import { CustomHelpers } from 'joi';
import { USER } from '../utils/length';

export const objectId = (value: string, helpers: CustomHelpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message({ custom: '"{{#label}}" must be a valid mongo id' });
  }
  return value;
};

export const password = (value: string, helpers: CustomHelpers) => {
  if (value.length < USER.PASSWORD.MIN || value.length > USER.PASSWORD.MAX) {
    return helpers.message({ custom: '비밀번호는 영문과 숫자를 포함한 8 ~ 20 글자입니다.' });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message({ custom: '비밀번호는 1개 이상의 숫자와 1개의 이상의 영문입니다.' });
  }
  return value;
};
