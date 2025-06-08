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
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Type definition for the input payload of the generateDocument action
type GenerateDocumentPayload = {
  customizationOptions: {
    targetJobTitle: string;
    targetCompany: string;
    keySkills: string;
    tone: string;
  };
  documentType: 'resume' | 'coverLetter';
};

// Helper function to format profile data into a string for the prompt
const formatProfileForPrompt = (
  profile: UserProfile & { education: EducationEntry[]; experience: ExperienceEntry[] }
) => {
  let prompt = `
    Full Name: ${profile.firstName} ${profile.lastName}
    Phone: ${profile.phone}
  `;

  if (profile.education.length > 0) {
    prompt += '\n\nEducation:\n';
    profile.education.forEach((edu) => {
      prompt += `- ${edu.fieldOfStudy} from ${edu.school} (Graduated ${edu.graduationDate})\n  Location: ${edu.location}\n  Achievements: ${edu.achievements}\n`;
    });
  }

  if (profile.experience.length > 0) {
    prompt += '\n\nWork Experience:\n';
    profile.experience.forEach((exp) => {
      prompt += `- ${exp.jobTitle} at ${exp.employer} (${exp.startDate} - ${exp.endDate})\n  Location: ${exp.location}\n  Description: ${exp.workDescription}\n`;
    });
  }

  return prompt;
};

export const generateDocument: GenerateDocument<GenerateDocumentPayload, GeneratedDocument> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }
  if (!openai) {
    throw new HttpError(500, 'OpenAI API key not set. Please set OPENAI_API_KEY in .env.server file.');
  }

  const { customizationOptions, documentType } = args;

  // 1. Fetch the user's full profile
  const userProfile = await context.entities.UserProfile.findUnique({
    where: { userId: context.user.id },
    include: { education: true, experience: true },
  });

  if (!userProfile) {
    throw new HttpError(404, 'User profile not found. Please complete your profile first.');
  }

  // 2. Construct the prompt for OpenAI
  const profileString = formatProfileForPrompt(userProfile);
  const documentTypeString = documentType === 'resume' ? 'a professional resume' : 'a compelling cover letter';

  const systemPrompt = `You are a world-class career coach and professional writer. Your task is to generate ${documentTypeString} based on the user's profile and specific job application details provided. Adhere to the specified tone and highlight the key skills mentioned. The output should be a single block of well-formatted text.`;

  const userPrompt = `
    Based on the following profile, please generate ${documentTypeString}.

    Profile Details:
    ${profileString}

    Customization Details:
    - Target Job Title: ${customizationOptions.targetJobTitle}
    - Target Company: ${customizationOptions.targetCompany}
    - Key Skills to Highlight: ${customizationOptions.keySkills}
    - Tone: ${customizationOptions.tone}
  `;

  // 3. Call OpenAI API
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const generatedContent = completion.choices[0]?.message?.content;

  if (!generatedContent) {
    throw new HttpError(500, 'Failed to generate document from OpenAI.');
  }

  // 4. Save the generated document to the database
  const newDocument = await context.entities.GeneratedDocument.create({
    data: {
      user: { connect: { id: context.user.id } },
      documentType: documentType.toUpperCase() as 'RESUME' | 'COVER_LETTER',
      content: generatedContent,
      customizationParams: customizationOptions,
      templateName: 'default', // Or get from args if available
    },
  });

  return newDocument;
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