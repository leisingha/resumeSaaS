import { HttpError } from 'wasp/server';
import OpenAI from 'openai';
import type { GeneratedDocument, UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import type {
  GenerateDocument,
  GetGeneratedDocuments,
  UpdateGeneratedDocument,
  GenerateAiResumePoints,
} from 'wasp/server/operations';

// Setup OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : undefined;

// Type definition for the input payload of the generateDocument action
type GenerateDocumentPayload = {
  customizationOptions: {
    targetJobTitle: string;
    targetCompany: string;
    keySkills: string;
    tone: number;
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
      location: e.location,
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
      "date": "string"
    }
  ],
  "skills": [
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
  }[];
  skills: string[];
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
    You are an expert resume writer. Your task is to generate a professional resume in JSON format based on the user's profile data.
    The output MUST strictly adhere to the following JSON schema and contain a minimum of 260 words. The content should be dense, professional, and tailored to the target job.
    \`\`\`json
    ${resumeJsonSchema}
    \`\`\`

    Use the following example as a guide for structure and professional tone. Do not copy the content verbatim; adapt it to the user's data provided below.
    
    Example Resume Structure:
    - Name (e.g., James Appleseed)
    - Contact Info (e.g., (555) 555-5555 | james.appleseed@resume.com | 1234 Main St. San Francisco, CA)
    - Summary: A 2-3 sentence professional summary.
    - Experience: List of jobs with title, company, dates, and 2-3 bullet points with quantifiable achievements.
    - Education: List of degrees with school, graduation date, and details like GPA or clubs.
    - Skills: List of relevant skills.
    - Languages: List of languages and proficiency.

    Now, generate a resume for the following user profile. Emphasize keywords relevant to their experience and the target job title: "${customizationOptions.targetJobTitle}".
    The tone of the resume should be: ${toneLabel}.
  `;

  try {
    if (!openai) {
      throw new HttpError(500, 'OpenAI API key is not set.');
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: profileContext },
      ],
      response_format: { type: 'json_object' },
    });

    const jsonResponse = JSON.parse(completion.choices[0].message.content || '{}') as ResumeData;

    // Convert the JSON response to a structured HTML document
    const htmlContent = `
      <div style="background-color: white; padding: 0.5in; font-family: serif; font-size: 10pt; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24pt; font-weight: bold; margin: 0;">${userProfile.firstName} ${
      userProfile.lastName
    }</h1>
          <p style="font-size: 10pt; margin: 5px 0;">${userProfile.phone} | ${email} | ${userProfile.location}</p>
        </div>

        <div>
          <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Summary</h2>
          <p style="line-height: 1.4;">${jsonResponse.summary || ''}</p>
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
              <ul style="margin-top: 5px; padding-left: 20px; line-height: 1.4;">
                ${Array.isArray(exp.description) ? exp.description.map((desc) => `<li>${desc}</li>`).join('') : `<li>${exp.description}</li>`}
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
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Education</h2>
            ${(jsonResponse.education || [])
              .map(
                (edu) => `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <h3 style="font-size: 11pt; font-weight: bold; margin: 0;">${edu.degree}</h3>
                            <p style="margin: 2px 0;">${edu.school}</p>
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
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Languages</h2>
            <p style="line-height: 1.4;">${(jsonResponse.languages || []).map((lang) => lang.language).join(', ')}</p>
        </div>

        <div>
            <h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 15px 0 10px;">Projects & Achievements</h2>
            <div>${userProfile.awards || ''}</div>
        </div>
      </div>
    `;

    return context.entities.GeneratedDocument.create({
      data: {
        userId: context.user.id,
        content: htmlContent,
        documentType: documentType.toUpperCase() as 'RESUME' | 'COVER_LETTER',
        customizationParams: customizationOptions,
      },
    });
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

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.credits === 0 && !user.isAdmin) {
    throw new HttpError(402, 'No credits remaining');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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

    if (!user.isAdmin) {
      await context.entities.User.update({
        where: { id: context.user.id },
        data: { credits: { decrement: 1 } },
      });
    }

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