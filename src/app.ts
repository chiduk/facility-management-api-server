import express, { Express } from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from './modules/auth/passport';
import config from './config/config';
import { morgan } from './modules/logger';
import { authLimiter, httpStatus } from './modules/utils';
import { ApiError, errorConverter, errorHandler } from './modules/errors';
import routes from './routes/v1';

const app: Express = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
if (config.env === 'production') app.use(helmet());

// enable cors
app.use(cors());
app.options('*', cors());

// parse json request body
if (config.env === 'test') {
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: false }));
} else {
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: false }));
}

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(ExpressMongoSanitize());

// gzip compression
app.use(compression());

// jwt authentication
app.use(passport.initialize());

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/api/auth', authLimiter);
}

// v1 api routes
app.use('/api', routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);
export default app;
