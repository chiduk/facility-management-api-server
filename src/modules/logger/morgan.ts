import morgan from 'morgan';
import { Request, Response } from 'express';
import { config } from '../../config';
import logger from './logger';
import { IRequestError } from '../common/common.interfaces';
import filterBody from '../utils/filterBody';

morgan.token('message', (_req: Request, res: Response) => res.locals['errorMessage'] || '');
morgan.token('body', (req: Request) => JSON.stringify(filterBody(req.body)));
morgan.token('params', (req: Request) => JSON.stringify(req.params));
morgan.token('jwt', (req: Request) => req.headers.authorization);
morgan.token('query', (req: Request) => JSON.stringify(req.query));
morgan.token('error', (req: IRequestError) => {
  return req.error?.stack;
});

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms\n\ttoken: :jwt\n\tbody: :body\n\tparams: :params\n\tquery: :query`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message\n\ttoken: :jwt\n\tbody: :body\n\tparams: :params\n\tquery: :query\n\t:error\n\t${
  process.env['NODE_ENV']
}`;

const successHandler = morgan(successResponseFormat, {
  skip: (_req: Request, res: Response) => res.statusCode >= 400,
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (_req: Request, res: Response) => res.statusCode < 400,
  stream: {
    write: (message: string) => logger.error(message.trim()),
  },
});

export default {
  successHandler,
  errorHandler,
};
