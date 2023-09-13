import bcrypt from 'bcryptjs';
import config from '../../config/config';

export const encrypted = (str: string): Promise<string> => bcrypt.hash(str, config.SALT_ROUND);

export const encryptSync = (string: string): string => bcrypt.hashSync(string, config.SALT_ROUND);

export const isMatched = (plain: string, hashed: string): Promise<boolean> => bcrypt.compare(plain, hashed);
