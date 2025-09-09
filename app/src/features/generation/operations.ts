import { HttpError } from 'wasp/server';
import OpenAI from 'openai';
import type { GeneratedDocument, UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import type {
  GenerateDocument,
  GetGeneratedDocuments,
  UpdateGeneratedDocument,
  GenerateAiResumePoints,
} from 'wasp/server/operations';
import { ensureDailyCredits, consumeCredit } from '../../server/utils';

// Setup OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : undefined;

// Type definition for the input payload of the generateDocument action
type GenerateDocumentPayload = {
  customizationOptions: {
    targetJobTitle: string;
    targetCompany: string;
    keySkills: string;
    tone: number;
    jobDescription: string;
  };
  documentType: 'resume' | 'coverLetter';
};

// Helper to convert numeric tone to a descriptive string for the AI
const getToneLabel = (value: number) => {
  if (value < 33) return 'Strict';
  if (value < 66) return 'Balanced';
  return 'Creative';
};

// Helper function to format profile data into a string for the prompt
const formatProfileForPrompt = (
  profile: UserProfile & { education: EducationEntry[]; experience: ExperienceEntry[] },
  email?: string | null
) => {
  const simplifiedProfile = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: email,
    phone: profile.phone,
    location: profile.location,
    languages: profile.languages,
    awards: profile.awards,
    education: profile.education.map((e) => ({
      school: e.school,
      fieldOfStudy: e.fieldOfStudy,
      graduationDate: e.graduationDate,
      gpa: e.gpa,
    })),
    experience: profile.experience.map((e) => ({
      employer: e.employer,
      jobTitle: e.jobTitle,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      workDescription: e.workDescription,
    })),
  };
  return JSON.stringify(simplifiedProfile, null, 2);
};

const resumeJsonSchema = `
{
  "summary": "string",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "date": "string",
      "location": "string",
      "description": [
        "string"
      ]
    }
  ],
  "education": [
    {
      "degree": "string",
      "school": "string",
      "date": "string",
      "gpa": "string (optional)"
    }
  ],
  "skills": [
    "string"
  ],
  "projects": [
    "string"
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ]
}
`;

type ResumeData = {
  summary: string;
  experience: {
    title: string;
    company: string;
    date: string;
    location: string;
    description: string[];
  }[];
  education: {
    degree: string;
    school: string;
    date: string;
    gpa?: string;
  }[];
  skills: string[];
  projects: string[];
  languages: {
    language: string;
    proficiency: string;
  }[];
};

export const generateDocument: GenerateDocument<GenerateDocumentPayload, GeneratedDocument> = async (
  { customizationOptions, documentType },
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Check and ensure credits (daily + purchased)
  console.log(`[generateDocument] Checking credits for user: ${context.user.id}`);
  const { dailyCredits, purchasedCredits, totalCredits } = await ensureDailyCredits(context.user.id, context.entities.User);
  console.log(`[generateDocument] User has ${totalCredits} total credits (${dailyCredits} daily + ${purchasedCredits} purchased)`);
  
  if (totalCredits <= 0) {
    throw new HttpError(402, 'No credits remaining. Daily credits reset tomorrow or purchase more credits.');
  }

  const userProfile = await context.entities.UserProfile.findFirst({
    where: { userId: context.user.id },
    include: { education: true, experience: true },
  });

  if (!userProfile) {
    throw new HttpError(404, 'User profile not found');
  }
  
  const email = context.user.email;

  const profileContext = formatProfileForPrompt(userProfile, email);

  const toneLabel = getToneLabel(customizationOptions.tone);

  const systemPrompt = `
    You are an expert resume writer and career strategist. Your task is to transform the user's profile data into a highly targeted resume that aligns perfectly with their target job and company.

    IMPORTANT: You must use the user's actual profile data as the foundation, but strategically reframe, emphasize, and optimize it to match the target position. Alter the content to match the target job description and company if you have to.

    OUTPUT FORMAT: Generate a professional resume in JSON format that strictly adheres to this schema:
    \`\`\`json
    ${resumeJsonSchema}
    \`\`\`

    Use the following example as a guide for structure and professional tone. Do not copy the content verbatim; adapt it to the user's data provided below.
    
    Example Resume Structure:
    - Name (e.g., James Appleseed)
    - Contact Info (e.g., (555) 555-5555 | james.appleseed@resume.com | 1234 Main St. San Francisco, CA)
    - Summary: A max 3 sentence professional summary.
    - Experience: List of jobs with title, company, dates, and max 3 bullet points with quantifiable achievements.
    - Education: List of degrees with school and graduation date. If a GPA is provided in the user's data, it MUST be included.
    - Skills: List of relevant skills.
    - Projects: List of projects/achievements as bullet points, each describing a separate project with technologies and impact.
    - Languages: List of languages and proficiency.

    CUSTOMIZATION REQUIREMENTS:
    - Target Job Title: "${customizationOptions.targetJobTitle}"
    ${customizationOptions.keySkills ? `- Key Skills to Highlight: "${customizationOptions.keySkills}"` : ''}
    ${customizationOptions.jobDescription ? `- Job Description Requirements: "${customizationOptions.jobDescription}"` : ''}

    CONTENT TRANSFORMATION STRATEGY:

    1. PROFESSIONAL SUMMARY:
       - Write a 2-3 sentence summary that positions the candidate as an ideal fit for the target role
       - Use terminology and keywords from the job description
       - Highlight the most relevant aspects of their background

    2. EXPERIENCE SECTION OPTIMIZATION:
       - Keep job titles, companies, and dates from the user's profile as reference points
       - COMPLETELY REWRITE job descriptions to showcase responsibilities and achievements that directly relate to the target role
       - Transform generic tasks into specific accomplishments that match job requirements
       - Create compelling bullet points that demonstrate competencies required for the target position
       - Use quantified achievements and metrics that impress in the target industry
       - Incorporate job description keywords and requirements throughout experience descriptions
       - Frame all work experience to tell a story of progression toward the target role

    3. SKILLS SECTION TARGETING:
       - Prioritize skills from the user's profile that match the job requirements
       - Include the specified key skills prominently
       - Add relevant technical/soft skills mentioned in the job description that the user likely possesses
       - Organize skills by relevance to the target role

    4. EDUCATION OPTIMIZATION:
       - Present education information as provided
       - If relevant coursework/projects align with the target role, emphasize those connections

    5. PROJECTS & ACHIEVEMENTS ALIGNMENT:
       - Transform the user's awards/projects into compelling bullet points that showcase skills needed for the target role
       - Each bullet point should describe a separate project/achievement with relevant technologies and quantified impact
       - Use industry-specific language and metrics that resonate with the target position
       - Present each project as a standalone bullet point that directly correlates to job requirements
       - Include technologies, tools, and measurable outcomes for each project

    TRANSFORMATION APPROACH:
    - AGGRESSIVELY customize all content to fit the target job while maintaining the structural foundation (companies, titles, dates)
    - Think like a skilled recruiter presenting the candidate in the best possible light for this specific role
    - Every sentence should serve the purpose of making this candidate appear ideal for the target position
    - Use powerful action verbs, industry terminology, and quantified results that align with the job requirements
    - CREATE compelling narratives from the user's background that position them as the perfect candidate
    - The tone should be: ${toneLabel}

    FINAL GOAL: Transform this resume into a laser-focused, highly persuasive document that makes the candidate irresistible for the target role.

    Transform the user's profile into a compelling, targeted resume that makes them appear as the perfect candidate for this specific role. Minimum 300 words.
  `;

  try {
    if (!openai) {
      throw new HttpError(500, 'OpenAI API key is not set.');
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: profileContext },
      ],
      response_format: { type: 'json_object' },
    });

    const jsonResponse = JSON.parse(completion.choices[0].message.content || '{}') as ResumeData;

    // Convert the JSON response to a structured HTML document
    const htmlContent = `
      <div style="background-color: white; padding: 0; font-family: serif; font-size: 10pt; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24pt; font-weight: bold; margin: 0;">${userProfile.firstName} ${userProfile.lastName}</h1>
          <p style="font-size: 10pt; margin: 5px 0;">${userProfile.phone} | ${email} | ${userProfile.location}</p>
        </div>

        <div>
          <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Summary</h2>
          <p style="line-height: 1.4;">${jsonResponse.summary || ''}</p>
        </div>
        
        <div>
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Education</h2>
            ${(jsonResponse.education || [])
              .map(
                (edu) => `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <h3 style="font-size: 11pt; font-weight: bold; margin: 0;">${edu.degree}</h3>
                            <p style="margin: 2px 0;">
                              ${edu.school}
                              ${edu.gpa ? `<span style="margin-left: 10px;">GPA: ${edu.gpa}</span>` : ''}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0;">${edu.date}</p>
                        </div>
                    </div>
                </div>
                `
              )
              .join('')}
        </div>
        
        <div>
          <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Experience</h2>
          ${(jsonResponse.experience || [])
            .map(
              (exp) => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <h3 style="font-size: 11pt; font-weight: bold; margin: 0;">${exp.title}</h3>
                  <p style="margin: 2px 0;">${exp.company} - ${exp.location}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0;">${exp.date}</p>
                </div>
              </div>
              <ul style="margin-top: 5px; padding-left: 0; margin-left: 1.25rem; line-height: 1.4; list-style-type: disc;">
                ${Array.isArray(exp.description) ? exp.description.map((desc) => `<li style="margin-bottom: 0.25rem; font-size: 10pt; line-height: 1.4;">${desc}</li>`).join('') : `<li style="margin-bottom: 0.25rem; font-size: 10pt; line-height: 1.4;">${exp.description}</li>`}
              </ul>
            </div>
          `
            )
            .join('')}
        </div>
        
        <div>
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Skills</h2>
            <p style="line-height: 1.4;">${(jsonResponse.skills || []).join(', ')}</p>
        </div>

        <div>
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Projects & Achievements</h2>
            <ul style="margin-top: 5px; padding-left: 0; margin-left: 1.25rem; line-height: 1.4; list-style-type: disc;">
                ${(jsonResponse.projects || []).map((project) => `<li style="margin-bottom: 0.25rem; font-size: 10pt; line-height: 1.4;">${project}</li>`).join('')}
            </ul>
        </div>
        
        <div>
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Languages</h2>
            <p style="line-height: 1.4;">${(jsonResponse.languages || []).map((lang) => lang.language).join(', ')}</p>
        </div>

      </div>
    `;

    const generatedDocument = await context.entities.GeneratedDocument.create({
      data: {
        userId: context.user.id,
        content: htmlContent,
        documentType: documentType.toUpperCase() as 'RESUME' | 'COVER_LETTER',
        customizationParams: customizationOptions,
      },
    });

    // Consume 1 credit after successful generation (daily first, then purchased)
    console.log(`[generateDocument] About to consume 1 credit for user: ${context.user.id}`);
    const { consumedFrom } = await consumeCredit(context.user.id, context.entities.User);
    console.log(`[generateDocument] Successfully consumed 1 ${consumedFrom} credit for user: ${context.user.id}`);

    return generatedDocument;
  } catch (error: any) {
    console.error('Error generating document: ', error);
    throw new HttpError(500, 'Failed to generate document.');
  }
};

type UpdateDocumentPayload = {
  id: string;
  content: string;
};

export const updateGeneratedDocument: GenerateDocument<UpdateDocumentPayload, GeneratedDocument> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { id, content } = args;

  return context.entities.GeneratedDocument.update({
    where: {
      id,
      userId: context.user.id,
    },
    data: {
      content,
    },
  });
};

export const getGeneratedDocuments: GetGeneratedDocuments<void, GeneratedDocument[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  return context.entities.GeneratedDocument.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
  });
};

export const generateAiResumePoints: GenerateAiResumePoints<
  { context: string },
  { content: string }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  if (!openai) {
    throw new HttpError(500, 'OpenAI API key is not set.');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume writer. Based on the following context, generate 3 concise, impactful, and quantifiable bullet points for a resume. Each bullet point should start with an action verb. Your response must be ONLY the HTML content of an unordered list (<ul>), with each bullet point wrapped in an <li> tag. Do not include any other text, explanations, or markdown formatting.`,
        },
        {
          role: 'user',
          content: args.context,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new HttpError(500, 'AI response was empty.');
    }

    return { content };
  } catch (error: any) {
    console.error('Error generating AI resume points: ', error);
    if (error.response) {
      throw new HttpError(error.response.status, error.response.data.message);
    } else {
      throw new HttpError(500, 'Failed to generate AI content.');
    }
  }
}; 