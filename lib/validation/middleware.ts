import { NextResponse } from "next/server";
import { z } from "zod";
import { APIError } from "@/lib/error-handler";
import { formatZodError } from "./schemas";

/**
 * Validates request body using a Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
	return async (request: Request): Promise<T> => {
		try {
			let body: unknown;
			try {
				body = await request.json();
			} catch {
				throw new APIError("Invalid JSON in request body", 400, "INVALID_JSON");
			}

			return schema.parse(body);
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new APIError(formatZodError(error), 400, "VALIDATION_ERROR");
			}
			throw error; // Re-throw non-Zod errors (like APIError)
		}
	};
}

/**
 * Validates URL parameters using a Zod schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
	return async (params: Record<string, string>): Promise<T> => {
		try {
			return schema.parse(params);
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new APIError(formatZodError(error), 400, "VALIDATION_ERROR");
			}
			throw error;
		}
	};
}

/**
 * Validates query parameters using a Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
	return async (searchParams: URLSearchParams): Promise<T> => {
		try {
			// Convert URLSearchParams to a plain object
			const queryObject: Record<string, string> = {};
			searchParams.forEach((value, key) => {
				queryObject[key] = value;
			});

			return schema.parse(queryObject);
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new APIError(formatZodError(error), 400, "VALIDATION_ERROR");
			}
			throw error;
		}
	};
}

/**
 * Validates FormData using a Zod schema
 * Useful for server actions
 */
export function validateFormData<T>(schema: z.ZodSchema<T>) {
	return (formData: FormData): T => {
		try {
			// Convert FormData to a plain object
			const formObject: Record<string, string> = {};
			formData.forEach((value, key) => {
				if (typeof value === "string") {
					formObject[key] = value;
				}
			});

			return schema.parse(formObject);
		} catch (error) {
			if (error instanceof z.ZodError) {
				// For server actions, we return error objects instead of throwing
				throw new Error(formatZodError(error));
			}
			throw error;
		}
	};
}

/**
 * Higher-order function to wrap API route handlers with validation
 */
export function withValidation<
	TBody = unknown,
	TParams = unknown,
	TQuery = unknown,
>(options: {
	body?: z.ZodSchema<TBody>;
	params?: z.ZodSchema<TParams>;
	query?: z.ZodSchema<TQuery>;
}) {
	return <TContext extends { params?: Promise<Record<string, string>> }>(
		handler: (
			request: Request,
			context: TContext,
			validated: {
				body?: TBody;
				params?: TParams;
				query?: TQuery;
			},
		) => Promise<NextResponse>,
	) =>
		async (request: Request, context: TContext) => {
			try {
				const validated: {
					body?: TBody;
					params?: TParams;
					query?: TQuery;
				} = {};

				// Validate body if schema provided
				if (options.body) {
					validated.body = await validateBody(options.body)(request);
				}

				// Validate params if schema provided
				if (options.params && context.params) {
					const params = await context.params;
					validated.params = await validateParams(options.params)(params);
				}

				// Validate query if schema provided
				if (options.query) {
					const url = new URL(request.url);
					validated.query = await validateQuery(options.query)(
						url.searchParams,
					);
				}

				return await handler(request, context, validated);
			} catch (error) {
				if (error instanceof APIError) {
					return NextResponse.json(
						{ error: error.message, code: error.code },
						{ status: error.statusCode },
					);
				}

				// Fallback for unexpected errors
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 },
				);
			}
		};
}
