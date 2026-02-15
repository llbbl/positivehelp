import { toast } from "@/hooks/use-toast";
import logger from "@/lib/client-logger";

export interface APIErrorResponse {
	error: string;
	code?: string;
}

export class ClientError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public code?: string,
	) {
		super(message);
		this.name = "ClientError";
	}
}

export async function handleFetchError(
	response: Response,
	context?: string,
): Promise<never> {
	let errorData: APIErrorResponse;

	try {
		errorData = await response.json();
	} catch {
		errorData = { error: `${response.status} ${response.statusText}` };
	}

	const error = new ClientError(
		errorData.error || "An unexpected error occurred",
		response.status,
		errorData.code,
	);

	logger.error(`Fetch error ${context ? `in ${context}` : ""}`, {
		message: error.message,
		statusCode: error.statusCode,
		code: error.code,
		url: response.url,
	});

	throw error;
}

export function showErrorToast(
	error: unknown,
	fallbackMessage = "An unexpected error occurred",
) {
	let message = fallbackMessage;

	if (error instanceof ClientError) {
		message = error.message;
	} else if (error instanceof Error) {
		message = error.message;
	}

	toast({
		variant: "destructive",
		title: "Error",
		description: message,
	});
}

export function showSuccessToast(message: string, description?: string) {
	toast({
		title: message,
		description,
	});
}

export async function fetchWithErrorHandling(
	url: string,
	options?: RequestInit,
	context?: string,
): Promise<Response> {
	try {
		const response = await fetch(url, options);

		if (!response.ok) {
			await handleFetchError(response, context);
		}

		return response;
	} catch (error) {
		if (error instanceof ClientError) {
			throw error;
		}

		logger.error(`Network error ${context ? `in ${context}` : ""}`, {
			error: error instanceof Error ? error.message : "Unknown error",
			url,
		});

		throw new ClientError(
			"Network error. Please check your connection and try again.",
		);
	}
}

export function withErrorHandling<T extends unknown[], R>(
	fn: (...args: T) => Promise<R>,
	context?: string,
) {
	return async (...args: T): Promise<R> => {
		try {
			return await fn(...args);
		} catch (error) {
			logger.error(`Error in ${context || "function"}`, {
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			});

			showErrorToast(error);
			throw error;
		}
	};
}
