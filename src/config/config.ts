import Joi from 'joi';
import 'dotenv/config';
import * as process from 'process';

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    MONGODB_TEST_URL: Joi.string().required().description('Mongo DB test url'),
    SALT_ROUND: Joi.number().required().description('bcrypt salt round'),
    REDIS_URL: Joi.string().required().description('Redis url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    FM_SMTP_USERNAME: Joi.string().description('username for email server'),
    FM_SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    CLIENT_URL: Joi.string().required().description('Client url'),
    SNS_PUBLISHER_KEY: Joi.string(),
    SNS_PUBLISHER_SECRET: Joi.string(),
    AWS_LAMBDA_REGION: Joi.string(),
    SNS_PUBLISHER_FUNCTION_NAME: Joi.string(),
    FCM_RESIDENT_PROJECT_ID: Joi.string().required(),
    FCM_RESIDENT_PRIVATE_KEY: Joi.string().required(),
    FCM_RESIDENT_CLIENT_EMAIL: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  SALT_ROUND: envVars.SALT_ROUND,
  mongoose: {
    url: envVars.MONGODB_URL,
    testUrl: envVars.MONGODB_TEST_URL,
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'fm',
    },
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      signed: true,
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: true,
      auth: {
        user: envVars.FM_SMTP_USERNAME,
        pass: envVars.FM_SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  clientUrl: envVars.CLIENT_URL,
  snsPublisher: {
    region: envVars.AWS_LAMBDA_REGION,
    functionName: envVars.SNS_PUBLISHER_FUNCTION_NAME,
    credentials: {
      accessKeyId: envVars.SNS_PUBLISHER_KEY,
      secretAccessKey: envVars.SNS_PUBLISHER_SECRET,
    },
  },
  devUrl: envVars.SERVER_DEV_URL,
  FCM_RESIDENT_PROJECT_ID: envVars.FCM_RESIDENT_PROJECT_ID,
  FCM_RESIDENT_PRIVATE_KEY: envVars.FCM_RESIDENT_PRIVATE_KEY,
  FCM_RESIDENT_CLIENT_EMAIL: envVars.FCM_RESIDENT_CLIENT_EMAIL,
};
export default config;
