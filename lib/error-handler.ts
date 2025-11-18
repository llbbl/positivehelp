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

export function validateRequired(
	value: unknown,
	fieldName: string,
): asserts value is string {
	if (!value || typeof value !== "string" || value.trim() === "") {
		throw new APIError(`${fieldName} is required`, 400, "VALIDATION_ERROR");
	}
}

export function validateStringLength(
	value: string,
	fieldName: string,
	minLength?: number,
	maxLength?: number,
): void {
	if (minLength !== undefined && value.length < minLength) {
		throw new APIError(
			`${fieldName} must be at least ${minLength} characters`,
			400,
			"VALIDATION_ERROR",
		);
	}

	if (maxLength !== undefined && value.length > maxLength) {
		throw new APIError(
			`${fieldName} must be no more than ${maxLength} characters`,
			400,
			"VALIDATION_ERROR",
		);
	}
}

export function validateInteger(
	value: unknown,
	fieldName: string,
	min?: number,
): number {
	const parsed =
		typeof value === "string" ? parseInt(value, 10) : Number(value);

	if (Number.isNaN(parsed)) {
		throw new APIError(
			`${fieldName} must be a valid integer`,
			400,
			"VALIDATION_ERROR",
		);
	}

	if (min !== undefined && parsed < min) {
		throw new APIError(
			`${fieldName} must be at least ${min}`,
			400,
			"VALIDATION_ERROR",
		);
	}

	return parsed;
}
