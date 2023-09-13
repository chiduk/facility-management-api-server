import winston, { transports } from 'winston';
import WinstonDaily from 'winston-daily-rotate-file';
import config from '../../config/config';

const { timestamp } = winston.format;

interface LoggingInfo {
  level: string;
  message: string;
  timestamp?: string;
  code?: string;
  stack?: string;
}

const logDir = 'logs';

const enumerateErrorFormat = winston.format((info: LoggingInfo) => {
  if (info instanceof Error || 'code' in info) {
    Object.assign(info, { message: info.stack ?? JSON.stringify(info) });
  }
  return info;
});

const commonFormat = winston.format.combine(
  timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  enumerateErrorFormat(),
  winston.format.colorize(),
  winston.format.splat(),
  winston.format.printf((info: LoggingInfo) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  transports: [
    new transports.Console({
      format: winston.format.combine(commonFormat),
      stderrLevels: ['error'],
    }),
    new WinstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/error`,
      filename: `%DATE%.error.log`,
      maxSize: '30m',
      maxFiles: 30,
      zippedArchive: true,
      format: winston.format.combine(commonFormat, winston.format.uncolorize()),
    }),
    new WinstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/info`,
      filename: `%DATE%.info.log`,
      maxSize: '30m',
      maxFiles: 30,
      zippedArchive: true,
      format: winston.format.combine(commonFormat, winston.format.uncolorize()),
    }),
  ],
});

export default logger;
