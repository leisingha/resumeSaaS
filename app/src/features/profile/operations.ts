import { HttpError } from 'wasp/server';
import type { UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import type { SaveUserProfile, GetUserProfile } from 'wasp/server/operations';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { downloadFileFromS3 } from '../../file-upload/s3Utils';
import OpenAI from 'openai';

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
      model: 'gpt-4.1-nano',
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