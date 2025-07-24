// Re-export validation schemas and types for easy importing
export {
  messageSchemas,
  adminSchemas,
  formSchemas,
  formatZodError,
  type MessageCreateInput,
  type MessageQueryInput,
  type SubmissionIdInput,
  type UserIdInput,
  type CreateMessageFormInput
} from './schemas';

export {
  validateBody,
  validateParams,
  validateQuery,
  validateFormData,
  withValidation
} from './middleware';

// Additional utility types for API responses
export interface ValidationError {
  error: string;
  code: 'VALIDATION_ERROR' | 'INVALID_JSON';
  field?: string;
}

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
}

// Type guards for validation responses
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'code' in error &&
    (error as ValidationError).code === 'VALIDATION_ERROR'
  );
}