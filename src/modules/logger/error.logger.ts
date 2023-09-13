import { Request } from 'express';
import logger from './logger';

const errorLogger = (error: Error, req: Request) =>
  logger.error(`
 [API method : ${req.method}]
 [API url : ${req.originalUrl}]${(() =>
    Object.keys(req.params).length > 0 ? `\n [API params : ${JSON.stringify(req.params)}]` : '\b')()}${(() =>
    Object.keys(req.query).length > 0 ? `\n [API query : ${JSON.stringify(req.query)}]` : '\b')()}${(() =>
    Object.keys(req.body).length > 0 ? `\n [API body : ${JSON.stringify(req.body)}]` : '')()}
 [Error message : ${error.message}]
 [${error.stack}]`);

export default errorLogger;
