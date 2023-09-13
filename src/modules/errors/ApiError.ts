import config from '../../config/config';

class ApiError extends Error {
  statusCode: number;

  isOperational: boolean;

  override stack?: string;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else if (config.env === 'development') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
