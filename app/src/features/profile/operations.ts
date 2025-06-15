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
  
  const existingProfile = await context.entities.UserProfile.findUnique({
    where: { userId: context.user.id },
    select: { education: { select: { id: true } }, experience: { select: { id: true } } },
  });

  const clientEducationIds = education.map((e) => e.id).filter(Boolean);
  const educationIdsToDelete =
    existingProfile?.education.map((e) => e.id).filter((id) => !clientEducationIds.includes(id)) || [];

  const clientExperienceIds = experience.map((e) => e.id).filter(Boolean);
  const experienceIdsToDelete =
    existingProfile?.experience.map((e) => e.id).filter((id) => !clientExperienceIds.includes(id)) || [];

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
        create: education.map(({ school, fieldOfStudy, graduationDate, location, achievements }) => ({
          school,
          fieldOfStudy,
          graduationDate,
          location,
          achievements,
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
        deleteMany: { id: { in: educationIdsToDelete } },
        upsert: education.map(({ id, school, fieldOfStudy, graduationDate, location, achievements }) => ({
          where: { id: id || '' },
          create: { school, fieldOfStudy, graduationDate, location, achievements },
          update: { school, fieldOfStudy, graduationDate, location, achievements },
        })),
      },
      experience: {
        deleteMany: { id: { in: experienceIdsToDelete } },
        upsert: experience.map(({ id, employer, jobTitle, startDate, endDate, location, workDescription }) => ({
          where: { id: id || '' },
          create: { employer, jobTitle, startDate, endDate, location, workDescription },
          update: { employer, jobTitle, startDate, endDate, location, workDescription },
        })),
      },
    },
    include: {
      education: true,
      experience: true,
    },
  });
}; 