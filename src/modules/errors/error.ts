/* eslint-disable @typescript-eslint/no-unused-vars */
import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { httpStatus } from '../utils';
import config from '../../config/config';
import ApiError from './ApiError';
import { IRequestError } from '../common/common.interfaces';

export const errorConverter = (err: any, req: IRequestError, _res: Response, next: NextFunction) => {
  let error = err;
  req.error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message: string = error.message || `${httpStatus[statusCode]}`;
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err: ApiError, _req: IRequestError, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }
  res.locals['errorMessage'] = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).send(response);
};
