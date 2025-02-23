import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { isUserAdmin } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const requestingUser = await currentUser();

    if (!requestingUser) {
      logger.info("Unauthorized access attempt (no user)");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await isUserAdmin(requestingUser);

    if (!isAdmin) {
      logger.info("Non-admin access attempt", { userId: requestingUser.id });
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      const clerk = await clerkClient();
      const requestedUser = await clerk.users.getUser(params.id);
      return NextResponse.json({
        id: requestedUser.id,
        firstName: requestedUser.firstName,
        lastName: requestedUser.lastName,
        username: requestedUser.username,
      });
    } catch (error) {
      logger.warn("User not found", { userId: params.id });
      return new NextResponse("User not found", { status: 404 });
    }

  } catch (error) {
    logger.error("Internal server error", { error: error instanceof Error ? error.message: "Unknown Error"});
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}