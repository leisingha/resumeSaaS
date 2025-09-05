import * as z from 'zod';
import { type UpdateIsUserAdminById, type GetPaginatedUsers } from 'wasp/server/operations';
import { type User } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import { SubscriptionStatus } from '../payment/plans';
import { type Prisma } from '@prisma/client';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { ensureDailyCredits } from '../server/utils';

const updateUserAdminByIdInputSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean(),
});

type UpdateUserAdminByIdInput = z.infer<typeof updateUserAdminByIdInputSchema>;

export const updateIsUserAdminById: UpdateIsUserAdminById<UpdateUserAdminByIdInput, User> = async (
  rawArgs,
  context
) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(updateUserAdminByIdInputSchema, rawArgs);

  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  return context.entities.User.update({
    where: { id },
    data: { isAdmin },
  });
};

type GetPaginatedUsersOutput = {
  users: Pick<
    User,
    'id' | 'email' | 'username' | 'subscriptionStatus' | 'paymentProcessorUserId' | 'isAdmin'
  >[];
  totalPages: number;
};

const getPaginatorArgsSchema = z.object({
  skipPages: z.number(),
  filter: z.object({
    emailContains: z.string().nonempty().optional(),
    isAdmin: z.boolean().optional(),
    subscriptionStatusIn: z.array(z.nativeEnum(SubscriptionStatus).nullable()).optional(),
  }),
});

type GetPaginatedUsersInput = z.infer<typeof getPaginatorArgsSchema>;

export const getPaginatedUsers: GetPaginatedUsers<GetPaginatedUsersInput, GetPaginatedUsersOutput> = async (
  rawArgs,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const {
    skipPages,
    filter: { subscriptionStatusIn: subscriptionStatus, emailContains, isAdmin },
  } = ensureArgsSchemaOrThrowHttpError(getPaginatorArgsSchema, rawArgs);

  const includeUnsubscribedUsers = !!subscriptionStatus?.some((status) => status === null);
  const desiredSubscriptionStatuses = subscriptionStatus?.filter((status) => status !== null);

  const pageSize = 10;

  const userPageQuery: Prisma.UserFindManyArgs = {
    skip: skipPages * pageSize,
    take: pageSize,
    where: {
      AND: [
        {
          email: {
            contains: emailContains,
            mode: 'insensitive',
          },
          isAdmin,
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: desiredSubscriptionStatuses,
              },
            },
            {
              subscriptionStatus: includeUnsubscribedUsers ? null : undefined,
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true,
    },
    orderBy: {
      username: 'asc',
    },
  };

  const [pageOfUsers, totalUsers] = await prisma.$transaction([
    context.entities.User.findMany(userPageQuery),
    context.entities.User.count({ where: userPageQuery.where }),
  ]);
  const totalPages = Math.ceil(totalUsers / pageSize);

  return {
    users: pageOfUsers,
    totalPages,
  };
};

type UserAccountDetails = Pick<User, 'id' | 'email' | 'username' | 'subscriptionStatus' | 'subscriptionPlan' | 'datePaid' | 'credits' | 'isAdmin'> & {
  dailyCredits: number;
};

export const getUserAccountDetails = async (_args: void, context: any): Promise<UserAccountDetails> => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  // Ensure daily credits are up to date
  const { dailyCredits } = await ensureDailyCredits(context.user.id, context.entities.User);

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      datePaid: true,
      credits: true,
      isAdmin: true,
    }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return {
    ...user,
    dailyCredits,
  };
};

// Get current credits with enhanced fallback system
export const getCurrentDailyCredits = async (_args: void, context: any): Promise<{ dailyCredits: number; purchasedCredits: number; totalCredits: number; isAdmin: boolean }> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }
  
  // Use the enhanced credit system
  const { dailyCredits, purchasedCredits, totalCredits } = await ensureDailyCredits(context.user.id, context.entities.User);
  
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { isAdmin: true }
  });
  
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  
  return {
    dailyCredits,
    purchasedCredits,
    totalCredits,
    isAdmin: user.isAdmin
  };
};
