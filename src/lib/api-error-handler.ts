/**
 * Centralized API error handling with consistent error messages
 */

import { logger } from './logger';
import { toast } from 'sonner';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ApiErrorHandler {
  static handle(error: any, context?: string): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
    };

    // Handle different error types
    if (error?.response) {
      // HTTP error response
      apiError.status = error.response.status;
      apiError.message = error.response.data?.message || error.response.statusText;
      apiError.details = error.response.data;
    } else if (error?.message) {
      // Error object with message
      apiError.message = error.message;
    } else if (typeof error === 'string') {
      // String error
      apiError.message = error;
    }

    // Add context if provided
    const contextPrefix = context ? `[${context}] ` : '';
    const fullMessage = `${contextPrefix}${apiError.message}`;

    // Log error
    logger.error(fullMessage, error);

    return {
      ...apiError,
      message: fullMessage,
    };
  }

  static handleWithToast(error: any, context?: string): ApiError {
    const apiError = this.handle(error, context);
    toast.error(apiError.message);
    return apiError;
  }

  static getUserFriendlyMessage(error: any): string {
    const status = error?.response?.status;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You need to be signed in to perform this action.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This operation conflicts with existing data.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error?.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

// Export convenience functions
export const handleApiError = ApiErrorHandler.handle.bind(ApiErrorHandler);
export const handleApiErrorWithToast = ApiErrorHandler.handleWithToast.bind(ApiErrorHandler);
export const getUserFriendlyError = ApiErrorHandler.getUserFriendlyMessage.bind(ApiErrorHandler);
