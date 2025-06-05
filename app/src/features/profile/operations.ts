import { HttpError } from 'wasp/server';
import type { UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import type { GetUserProfile, SaveUserProfile } from 'wasp/server/operations';

type SaveProfilePayload = Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
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
    return {
      id: '',
      userId: context.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      fullName: null,
      phone: null,
      professionalSummary: null,
      email,
      education: [],
      experience: [],
    };
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

  const { fullName, phone, professionalSummary, education, experience } = args;

  if (!fullName || !phone || !professionalSummary) {
    throw new HttpError(400, 'Missing required fields: Full Name, Phone, and Professional Summary are required.');
  }
  
  const existingProfile = await context.entities.UserProfile.findUnique({
    where: { userId: context.user.id },
    select: { education: { select: { id: true } }, experience: { select: { id: true } } },
  });

  const clientEducationIds = education.map((e) => e.id).filter(Boolean);
  const educationIdsToDelete = existingProfile?.education.map((e) => e.id).filter((id) => !clientEducationIds.includes(id)) || [];

  const clientExperienceIds = experience.map((e) => e.id).filter(Boolean);
  const experienceIdsToDelete = existingProfile?.experience.map((e) => e.id).filter((id) => !clientExperienceIds.includes(id)) || [];

  return context.entities.UserProfile.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      fullName,
      phone,
      professionalSummary,
      education: {
        create: education.map(({ institution, degree, graduationYear }) => ({
          institution,
          degree,
          graduationYear,
        })),
      },
      experience: {
        create: experience.map(({ company, role, duration, description }) => ({
          company,
          role,
          duration,
          description,
        })),
      },
    },
    update: {
      fullName,
      phone,
      professionalSummary,
      education: {
        deleteMany: { id: { in: educationIdsToDelete } },
        upsert: education.map(({ id, institution, degree, graduationYear }) => ({
          where: { id: id || '' },
          create: { institution, degree, graduationYear },
          update: { institution, degree, graduationYear },
        })),
      },
      experience: {
        deleteMany: { id: { in: experienceIdsToDelete } },
        upsert: experience.map(({ id, company, role, duration, description }) => ({
          where: { id: id || '' },
          create: { company, role, duration, description },
          update: { company, role, duration, description },
        })),
      },
    },
    include: {
      education: true,
      experience: true,
    },
  });
}; 