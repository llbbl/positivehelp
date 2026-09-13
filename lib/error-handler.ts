import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export class APIError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public code?: string,
	) {
		super(message);
		this.name = "APIError";
	}
}

export function handleAPIError(error: unknown, context?: string): NextResponse {
	if (error instanceof APIError) {
		logger.error(`API Error ${context ? `in ${context}` : ""}`, {
			message: error.message,
			statusCode: error.statusCode,
			code: error.code,
			stack: error.stack,
		});

		return NextResponse.json(
			{ error: error.message, code: error.code },
			{ status: error.statusCode },
		);
	}

	if (error instanceof Error) {
		logger.error(`Unexpected error ${context ? `in ${context}` : ""}`, {
			message: error.message,
			stack: error.stack,
		});

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}

	logger.error(`Unknown error ${context ? `in ${context}` : ""}`, { error });

	return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
