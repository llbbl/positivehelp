import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { isUserAdmin } from '@/lib/auth';
import logger from '@/lib/logger';
import { adminSchemas, validateParams } from '@/lib/validation/types';
import { handleAPIError, APIError } from '@/lib/error-handler';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate URL parameters
    const params = await context.params;
    const { id: userId } = await validateParams(adminSchemas.userId)(params);
    
    const requestingUser = await currentUser();

    if (!requestingUser) {
      logger.info("Unauthorized access attempt (no user)");
      throw new APIError("Authentication required", 401, 'AUTH_REQUIRED');
    }

    const isAdmin = await isUserAdmin(requestingUser);

    if (!isAdmin) {
      logger.info("Non-admin access attempt", { userId: requestingUser.id });
      throw new APIError("Admin access required", 403, 'ADMIN_REQUIRED');
    }

    try {
      const clerk = await clerkClient();
      const requestedUser = await clerk.users.getUser(userId);
      return NextResponse.json({
        id: requestedUser.id,
        firstName: requestedUser.firstName,
        lastName: requestedUser.lastName,
        username: requestedUser.username,
      });
    } catch (clerkError) {
      logger.warn("User not found", { userId });
      throw new APIError("User not found", 404, 'USER_NOT_FOUND');
    }

  } catch (error) {
    logger.error("Internal server error", { error: error instanceof Error ? error.message: "Unknown Error"});
    return handleAPIError(error, 'GET /api/admin/users/[id]');
  }
}