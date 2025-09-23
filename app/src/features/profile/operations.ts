import { HttpError } from 'wasp/server';
import type { UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import type { SaveUserProfile, GetUserProfile } from 'wasp/server/operations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { downloadFileFromS3 } from '../../file-upload/s3Utils';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : undefined;

type SaveProfilePayload = Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'education' | 'experience'> & {
  education: Omit<EducationEntry, 'userProfileId'>[];
  experience: Omit<ExperienceEntry, 'userProfileId'>[];
};

export const getUserProfile: GetUserProfile<
  void,
  (UserProfile & { email: string | null; education: EducationEntry[]; experience: ExperienceEntry[] }) | null
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const userProfile = await context.entities.UserProfile.findUnique({
    where: { userId: context.user.id },
    include: {
      education: true,
      experience: true,
    },
  });

  const email = context.user.email;

  if (!userProfile) {
    // A slight hack to satisfy the type-checker until we have a more robust solution
    return {
      id: '',
      userId: context.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: null,
      lastName: null,
      phone: null,
      location: null,
      languages: null,
      awards: null,
      email,
      education: [],
      experience: [],
    } as any;
  }

  return {
    ...userProfile,
    email,
  };
};

export const saveUserProfile: SaveUserProfile<SaveProfilePayload, UserProfile> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { firstName, lastName, phone, location, education, experience, languages, awards } = args as UserProfile & {
    education: EducationEntry[];
    experience: ExperienceEntry[];
  };

  if (!firstName || !lastName || !phone) {
    throw new HttpError(400, 'Missing required fields: First Name, Last Name and Phone are required.');
  }

  // To ensure data consistency, we'll first remove all existing entries
  // and then create the new ones based on the client's payload.
  
  // Delete existing education entries
  await context.entities.EducationEntry.deleteMany({
    where: { userProfile: { userId: context.user.id } },
  });
  
  // Delete existing experience entries
  await context.entities.ExperienceEntry.deleteMany({
    where: { userProfile: { userId: context.user.id } },
  });

  // Now, upsert the profile with the new education and experience entries
  return context.entities.UserProfile.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      firstName,
      lastName,
      phone,
      location,
      languages,
      awards,
      education: {
        create: education.map(({ school, fieldOfStudy, graduationDate, gpa }) => ({
          school,
          fieldOfStudy,
          graduationDate,
          gpa,
        })),
      },
      experience: {
        create: experience.map(({ employer, jobTitle, startDate, endDate, location, workDescription }) => ({
          employer,
          jobTitle,
          startDate,
          endDate,
          location,
          workDescription,
        })),
      },
    },
    update: {
      firstName,
      lastName,
      phone,
      location,
      languages,
      awards,
      education: {
        create: education.map(({ school, fieldOfStudy, graduationDate, gpa }) => ({
          school,
          fieldOfStudy,
          graduationDate,
          gpa,
        })),
      },
      experience: {
        create: experience.map(({ employer, jobTitle, startDate, endDate, location, workDescription }) => ({
          employer,
          jobTitle,
          startDate,
          endDate,
          location,
          workDescription,
        })),
      },
    },
    include: {
      education: true,
      experience: true,
    },
  });
};

export const parseResumeAndPopulateProfile = async (args: { key: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (!openai) {
    throw new HttpError(500, 'OpenAI API key is not set.');
  }

  const { key } = args;

  console.log(`[parseResumeAndPopulateProfile] User ${context.user.id} initiated parsing for key: ${key}`);

  let resumeText = '';
  try {
    // This is a workaround for a known issue with pdfjs-dist on the server.
    // It prevents a crash by polyfilling a missing browser-specific API.
    (global as any).DOMMatrix = class {};
    
    // Polyfill Promise.withResolvers for older Node.js versions
    if (!Promise.withResolvers) {
      Promise.withResolvers = <T>() => {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: any) => void;
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }
    
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist');
    const fileBuffer = await downloadFileFromS3(key);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    resumeText = text;
    console.log('[parseResumeAndPopulateProfile] Successfully parsed PDF text.');
  } catch (error: any) {
    console.error('[parseResumeAndPopulateProfile] Error parsing PDF:', error);
    throw new HttpError(500, `Failed to parse resume: ${error.message}`);
  }

  try {
    const systemPrompt = `
      You are an expert HR analyst. Your task is to parse the following resume text and extract the user's professional information into a structured JSON object.
      The output MUST strictly adhere to the following JSON schema. Do not add any extra text, notes, or explanations.

      The JSON schema is as follows:
      {
        "firstName": "string",
        "lastName": "string",
        "phone": "string | null",
        "location": "string | null",
        "languages": "string | null (e.g., 'English, Spanish')",
        "awards": "string | null (A summary of awards or achievements, can be a single string with newlines)",
        "education": [
          {
            "school": "string",
            "fieldOfStudy": "string",
            "graduationDate": "string | null (e.g., 'May 2020')",
            "gpa": "string | null"
          }
        ],
        "experience": [
          {
            "employer": "string",
            "jobTitle": "string",
            "startDate": "string | null (e.g., 'Aug 2020')",
            "endDate": "string | null (e.g., 'Present' or 'Jan 2022')",
            "location": "string | null",
            "workDescription": "string (A detailed summary of responsibilities and achievements, with each bullet point on a new line.)"
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: resumeText },
      ],
      response_format: { type: 'json_object' },
    });

    const jsonResponse = JSON.parse(completion.choices[0].message.content || '{}');
    console.log('[parseResumeAndPopulateProfile] Successfully received structured data from OpenAI.');

    // Action now returns the parsed data instead of saving it.
    return jsonResponse;
  } catch (error: any) {
    console.error('[parseResumeAndPopulateProfile] Error calling OpenAI:', error);
    throw new HttpError(500, `Failed to analyze resume with AI: ${error.message}`);
  }
};

export const getLocationSuggestions = async (args: { input: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { input } = args;

  if (!input || input.trim().length < 2) {
    return [];
  }

  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!googlePlacesApiKey) {
    throw new HttpError(500, 'Google Places API key is not configured');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${googlePlacesApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    return data.predictions?.map((prediction: any) => ({
      description: prediction.description,
      placeId: prediction.place_id,
    })) || [];

  } catch (error: any) {
    console.error('[getLocationSuggestions] Error:', error);
    throw new HttpError(500, `Failed to get location suggestions: ${error.message}`);
  }
};

export const getSchoolSuggestions = async (args: { input: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { input } = args;

  if (!input || input.trim().length < 2) {
    return [];
  }

  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!googlePlacesApiKey) {
    throw new HttpError(500, 'Google Places API key is not configured');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment&key=${googlePlacesApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    // Filter results for educational institutions
    const educationalKeywords = [
      'university', 'college', 'school', 'institute', 'academy', 'seminary',
      'polytechnic', 'conservatory', 'campus', 'educational', 'education'
    ];

    const filteredPredictions = data.predictions?.filter((prediction: any) => {
      const description = prediction.description.toLowerCase();
      return educationalKeywords.some(keyword => description.includes(keyword));
    }) || [];

    return filteredPredictions.map((prediction: any) => {
      // Extract just the institution name (before the first comma)
      const institutionName = prediction.description.split(',')[0].trim();

      return {
        description: institutionName,
        placeId: prediction.place_id,
      };
    });

  } catch (error: any) {
    console.error('[getSchoolSuggestions] Error:', error);
    throw new HttpError(500, `Failed to get school suggestions: ${error.message}`);
  }
};

// Hardcoded job titles - we'll inline them since file reading is tricky in Wasp
const JOB_TITLES = [
  "Academic Librarian",
  "Accountant",
  "Accounting Technician",
  "Actuary",
  "Adult Nurse",
  "Advertising Account executive",
  "Advertising Account planner",
  "Advertising Copywriter",
  "Advice Worker",
  "Aeronautical Engineer",
  "Agricultural Consultant",
  "Agricultural Manager",
  "Aid Worker/Humanitarian Worker",
  "Air Traffic Controller",
  "Airline Cabin Crew",
  "Amenity Horticulturist",
  "Analytical Chemist",
  "Animal Nutritionist",
  "Animator",
  "Archaeologist",
  "Architect",
  "Architectural Technologist",
  "Archivist",
  "Armed Forces Officer",
  "AromaTherapist",
  "Art Therapist",
  "Arts Administrator",
  "Auditor",
  "Automotive Engineer",
  "Barrister",
  "Barrister's Clerk",
  "Bid Manager",
  "Bilingual Secretary",
  "Biomedical Engineer",
  "Biomedical Scientist",
  "Biotechnologist",
  "Border Force Officer",
  "Brand Manager",
  "Broadcasting Presenter",
  "Building Control Officer/Surveyor",
  "Building Services Engineer",
  "Building Surveyor",
  "Business Analyst",
  "Camera Operator",
  "Careers Adviser (Higher Education)",
  "Careers Adviser",
  "Careers Consultant",
  "Cartographer",
  "Catering Manager",
  "Charities Administrator",
  "Charities Fundraiser",
  "Chemical (Process) Engineer",
  "Child PsychoTherapist",
  "Children's Nurse",
  "Chiropractor",
  "Civil Engineer",
  "Civil Service Administrator",
  "Clinical Biochemist",
  "Clinical Cytogeneticist",
  "Clinical Microbiologist",
  "Clinical Molecular Geneticist",
  "Clinical Research Associate",
  "Clinical Scientist",
  "Clothing Technologist",
  "Colour Technologist",
  "Commercial Airline Pilot",
  "Commercial Horticulturist",
  "Commercial/Residential Surveyor",
  "Commissioning Editor",
  "Commissioning Engineer",
  "Commodity Broker",
  "Communications Engineer",
  "Community Arts Worker",
  "Community Education Officer",
  "Community Worker",
  "Company Secretary",
  "Computer Sales Support",
  "Computer Scientist",
  "Conference Organiser",
  "Consultant",
  "Consumer Rights Adviser",
  "Control and Instrumentation Engineer",
  "Corporate Banker",
  "Corporate Treasurer",
  "Counsellor",
  "Court Reporter/Verbatim Reporter",
  "Credit Analyst",
  "Crown Prosecution Service lawyer",
  "Crystallographer",
  "Curator",
  "Customs Officer",
  "Cyber Security Specialist",
  "Dance Movement PsychoTherapist",
  "Data Analyst",
  "Data Scientist",
  "Data Visualisation Analyst",
  "Database Administrator",
  "Debt/Dinance Adviser",
  "Dental Hygienist",
  "Dentist",
  "Design Engineer",
  "Design Manager (Construction)",
  "DevOps Engineer",
  "Dietitian",
  "Diplomatic Service",
  "Doctor (GP)",
  "Doctor (Hospital)",
  "DramaTherapist",
  "Economist",
  "Editorial Assistant",
  "Education Administrator",
  "Electrical Engineer",
  "Electronics Engineer",
  "Employment Advice Worker",
  "Energy Conservation Officer",
  "Energy Consultant",
  "Engineering Geologist",
  "Environmental Education Officer",
  "Environmental Health Officer",
  "Environmental Manager",
  "Environmental Scientist",
  "Equal Opportunities Officer",
  "Equality and Diversity Officer",
  "Ergonomist",
  "Estate Agent",
  "Estimator",
  "European Commission Administrators",
  "Exhibition Display Designer",
  "Exhibition Organiser",
  "Exploration Geologist",
  "Facilities Manager",
  "Field Trials Officer",
  "Financial Manager",
  "Fire Engineer",
  "Firefighter",
  "Fisheries Enforcement Officer",
  "Fitness Centre Manager",
  "Food Scientist",
  "Food Technologist",
  "Forensic Scientist",
  "Freight Forwarder",
  "Geneticist",
  "Geographical Information Systems Manager",
  "Geomatics/Land Surveyor",
  "Government Lawyer",
  "Government Research Officer",
  "Graphic Designer",
  "Health and Safety Adviser",
  "Health and Safety Inspector",
  "Health Promotion Specialist",
  "Health Service Manager",
  "Health Visitor",
  "Herbalist",
  "Heritage Manager",
  "Higher Education Administrator",
  "Higher Education Advice Worker",
  "Homeless Support Worker",
  "Horticultural Consultant",
  "Hotel Manager",
  "Housing Adviser",
  "Human Resources Officer",
  "Hydrologist",
  "Illustrator",
  "Immigration Officer",
  "Immunologist",
  "Industrial/Product Designer",
  "Information Scientist",
  "Information Systems Manager",
  "Information Technology/Software Trainers",
  "Insurance Broker",
  "Insurance Claims Inspector",
  "Insurance Risk Surveyor",
  "Insurance Underwriter",
  "Interpreter",
  "Investment Analyst",
  "Investment Banker - Corporate Finance",
  "Investment Banker - Operations",
  "Investment FUnd Manager",
  "IT Consultant",
  "IT Support Analyst",
  "Journalist",
  "Laboratory Technician",
  "Land-based Engineer",
  "Landscape Architect",
  "Learning Disability Nurse",
  "Learning Mentor",
  "Lecturer (Adult Education)",
  "Lecturer (Further Education)",
  "Lecturer (Higher Education)",
  "Legal Executive",
  "Leisure Centre Manager",
  "Licensed Conveyancer",
  "Local Government administrator",
  "Local Government lawyer",
  "Logistics/Distribution Manager",
  "Magazine Features Editor",
  "Magazine Journalist",
  "Maintenance Engineer",
  "Management accountant",
  "Manufacturing Engineer",
  "Manufacturing Machine Operator",
  "Manufacturing Toolmaker",
  "Marine Scientist",
  "Market Research Analyst",
  "Market Research Executive",
  "Marketing Assistant",
  "Marketing Executive",
  "Marketing Manager (Direct)",
  "Marketing Manager (Social Media)",
  "Materials Engineer",
  "Materials Specialist",
  "Mechanical Engineer",
  "Media Analyst",
  "Media Buyer",
  "Media Planner",
  "Medical Physicist",
  "Medical Representative",
  "Mental Health Nurse",
  "Metallurgist",
  "Meteorologist",
  "Microbiologist",
  "Midwife",
  "Mining Engineer",
  "Mobile Developer",
  "Multimedia Programmer",
  "Multimedia Specialists",
  "Museum Education Officer",
  "Museum/Gallery Exhibition Officer",
  "Music Therapist",
  "Nanoscientist",
  "Nature Conservation Officer",
  "Naval Architect",
  "Network Administrator",
  "Nurse",
  "Nutritional Therapist",
  "Nutritionist",
  "Occupational Therapist",
  "Oceanographer",
  "Office Manager",
  "Operational Researcher",
  "Orthoptist",
  "Outdoor Pursuits Manager",
  "Packaging Technologist",
  "Paramedic",
  "Patent Attorney",
  "Patent Examiner",
  "Pension Scheme Manager",
  "Personal Assistant",
  "Petroleum Engineer",
  "Pharmacist",
  "Pharmacologist",
  "Pharmacovigilance Officer",
  "Photographer",
  "PhysioTherapist",
  "Picture Researcher",
  "Planning and Development Surveyor",
  "Planning Technician",
  "Plant Breeder",
  "Police Officer",
  "Political Party Agent",
  "Political Researcher",
  "Practice nurse",
  "Press Photographer",
  "Press Sub-editor",
  "Prison Officer",
  "Private Music Teacher",
  "Probation Officer",
  "Product Development Scientist",
  "Production Manager",
  "Programme Researcher",
  "Project Manager",
  "Psychologist (Clinical)",
  "Psychologist (Educational)",
  "PsychoTherapist",
  "Public Affairs Consultant (Lobbyist)",
  "Public Affairs Consultant (Research)",
  "Public House Manager",
  "Public Librarian",
  "Public Relations (PR) Officer",
  "QA Analyst",
  "Quality Assurance Manager",
  "Quantity Surveyor",
  "Records Manager",
  "Recruitment Consultant",
  "Recycling Officer",
  "Regulatory Affairs Officer",
  "Research Chemist",
  "Research Scientist",
  "Restaurant Manager",
  "Retail Banker",
  "Retail Buyer",
  "Retail Manager",
  "Retail Merchandiser",
  "Retail Pharmacist",
  "Sales Executive",
  "Scene of Crime Officer",
  "Secretary",
  "Seismic Interpreter",
  "Site Engineer",
  "Site Manager",
  "Social Researcher",
  "Social Worker",
  "Software Developer",
  "Software Engineer",
  "Soil Scientist",
  "Solicitor",
  "Speech and Language Therapist",
  "Sports Coach",
  "Sports Development Officer",
  "Sports Therapist",
  "Statistician",
  "Stockbroker",
  "Structural Engineer",
  "Systems Analyst",
  "Systems Developer",
  "Tax Inspector",
  "Teacher (Nursery Years)",
  "Teacher (Primary)",
  "Teacher (Secondary)",
  "Teacher (Special Educational Needs)",
  "Teaching/Classroom Assistant",
  "Technical Author",
  "Technical Sales Engineer",
  "TEFL/TESL Teacher",
  "Television Production Assistant",
  "Test Automation Developer",
  "Tour Guide",
  "Tour Operator",
  "Tour/Holiday Representative",
  "Tourism Officer",
  "Tourist Information Manager",
  "Town and Country Planner",
  "Toxicologist",
  "Trade Union Official",
  "Trade Union Research Officer",
  "Trader",
  "Trading Standards Officer",
  "Training and Development Officer",
  "Translator",
  "Transportation Planner",
  "Travel Agent",
  "TV/Film/Theatre Set Designer",
  "UX Designer",
  "Validation Engineer",
  "Veterinary Nurse",
  "Veterinary Surgeon",
  "Video Game Designer",
  "Video Game Developer",
  "Volunteer Work Organiser",
  "Waste Management Officer",
  "Water Conservation Officer",
  "Water Engineer",
  "Web Designer",
  "Web Developer",
  "Welfare Rights Adviser",
  "Writer",
  "Youth Worker"
];

export const getJobTitleSuggestions = async (args: { input: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { input } = args;

  if (!input || input.trim().length < 1) {
    return [];
  }

  try {
    // Filter job titles that match the input (case-insensitive)
    const filteredJobTitles = JOB_TITLES.filter(jobTitle =>
      jobTitle.toLowerCase().includes(input.toLowerCase())
    );

    // Return top 10 matches to avoid overwhelming the dropdown
    return filteredJobTitles.slice(0, 10).map(jobTitle => ({
      description: jobTitle,
      id: jobTitle.toLowerCase().replace(/\s+/g, '-'), // Simple ID for consistency
    }));

  } catch (error: any) {
    console.error('[getJobTitleSuggestions] Error:', error);
    throw new HttpError(500, `Failed to get job title suggestions: ${error.message}`);
  }
};

export const getSkillsSuggestions = async ({ input }: { input: string }) => {
  try {
    if (!input || input.trim().length < 2) {
      return [];
    }

    const CLIENT_ID = process.env.LIGHTCAST_CLIENT_ID;
    const CLIENT_SECRET = process.env.LIGHTCAST_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Lightcast API credentials not configured');
      return [];
    }

    // Step 1: Get OAuth token
    const tokenResponse = await fetch('https://auth.emsicloud.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'emsi_open'
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get Lightcast token:', tokenResponse.status);
      return [];
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Search for skills
    const skillsResponse = await fetch(`https://emsiservices.com/skills/versions/latest/skills?q=${encodeURIComponent(input)}&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!skillsResponse.ok) {
      console.error('Failed to get skills:', skillsResponse.status);
      return [];
    }

    const skillsData = await skillsResponse.json();

    // Transform the response to match our expected format
    return skillsData.data.map((skill: any) => ({
      id: skill.id,
      description: skill.name,
    }));

  } catch (error: any) {
    console.error('[getSkillsSuggestions] Error:', error);
    // Return empty array instead of throwing error to gracefully handle API failures
    return [];
  }
}; 