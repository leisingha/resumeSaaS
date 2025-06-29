import { HttpError } from 'wasp/server';
import type { UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import type { GetUserProfile, SaveUserProfile } from 'wasp/server/operations';

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