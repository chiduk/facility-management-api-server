import { createClient, RedisClientType } from 'redis';
import config from '../../config/config';
import logger from '../logger/logger';

const codeExpireIn = 180; // 180 seconds

let radish: RedisClientType;

export const connectRadish = () => {
  radish = createClient({
    url: config.redis.url,
  });
  radish
    .connect()
    .then(() => {
      logger.info('Connected to Redis');
    })
    .catch((err: any) => {
      logger.error(err.stack);
    });
};

export const disconnectRadish = () => radish.disconnect();

export const setVerificationCode = (key: string, code: number): Promise<any> => radish.set(key, code, { EX: codeExpireIn });

export const getValue = (key: string) => radish.get(key);

export const deleteValue = (key: string) => radish.del(key);

export const setEmailVerificationCode = async (email: string, code: number): Promise<void> => {
  await radish.set(email, code, { EX: codeExpireIn });
};
