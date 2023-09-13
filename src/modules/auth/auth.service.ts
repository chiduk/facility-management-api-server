import { httpStatus, toObjectId, moment, bcrypt } from '../utils';
import Token from '../token/token.model';
import ApiError from '../errors/ApiError';
import tokenTypes from '../token/token.types';
import * as tokenService from '../token/token.service';
import * as userService from '../user/user.service';
import {
  findUserByEmailLookupDefaultApartment,
  getUserByEmail,
  getUserByEmailAndMobilePhoneNumber,
  getUserById,
  updateUserById,
} from '../user/user.service';
import { EmployeeIdentifier, IUserDoc } from '../user/user.interfaces';
import { generateToken, verifyToken } from '../token/token.service';
import { emailService } from '../email';
import { IVerifyCodeBody, PatchPassword, VerifyMethodEnum, WakeUpUser } from './auth.interfaces';
import { config } from '../../config';
import * as radish from '../radish/radish.service';
import { resetPasswordTemplate } from '../email/email.template';
import { BackofficeLoginUserTypeArray } from '../user/user.constants';

const { isMatched } = bcrypt;

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  const user = await findUserByEmailLookupDefaultApartment(email);

  if (user.length !== 1 || user[0] === undefined || !user[0].password || !(await isMatched(password, user[0].password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  delete user[0].password;
  return user[0];
};

export const backofficeLoginUserWithEmailAndPassword = async (email: string, password: string) => {
  const user = await getUserByEmail(email);
  if (!user || !user.password || !(await isMatched(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const isValidType = BackofficeLoginUserTypeArray.some((type) => user.type === type);

  if (!isValidType) throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, '해당 회원은 로그인할 수 없습니다');

  // @ts-ignore
  delete user?.password;
  return user;
};

/**
 * Sign out
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const signout = async (user: IUserDoc, refreshToken: string): Promise<void> => {
  const refreshTokenDoc = await Token.findOne({
    user: user._id,
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token Not found');
  }
  await tokenService.deleteTokenByRefresh(refreshToken);
};

/**
 * Delete user
 * @param {string} uniqueId
 * @returns {Promise<void>}
 */
export const deleteUser = async (uniqueId: string): Promise<void> => {
  const user = await getUserById(toObjectId(uniqueId));
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await user.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<IUserWithTokens>}
 */
export const refreshAuth = async (user: IUserDoc, refreshToken: string) => {
  const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
  const foundUser = await getUserById(toObjectId(refreshTokenDoc.user));
  if (!foundUser) {
    throw new ApiError(httpStatus.NOT_FOUND, '사용자를 찾을 수 업습니다.');
  }
  const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user._id, expires, tokenTypes.ACCESS, config.jwt.secret);
  return { access: { token: accessToken, expires } };
};

/**
 * Request password reset url to email
 * @param {string} email
 * @returns {Promise<void>}
 */
export const requestPasswordResetViaEmail = async (email: string): Promise<void> => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, '가입한 이메일을 찾을 수 없습니다.');
  }
  const passwordResetUrl = 'https://pspace.ai';
  const html = resetPasswordTemplate(passwordResetUrl);
  await emailService.sendEmail(email, '비밀번호 재설정', html);
};

export const requestPasswordResetViaPhone = async (phone: object): Promise<void> => {
  const user = await getUserByEmailAndMobilePhoneNumber(phone);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, '가입한 회원을 찾을 수 없습니다.');
  }
  // TODO: 문자로 비밀번호 재설정 링크 발송
};

export const wakeUserUp = async (user: IUserDoc): Promise<void> => {
  // eslint-disable-next-line no-param-reassign
  user.isActive = true;
  await user!.save();
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<IUserDoc | null>}
 */
export const verifyEmail = async (verifyEmailToken: any): Promise<IUserDoc | null> => {
  try {
    const verifyEmailTokenDoc = await verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await getUserById(toObjectId(verifyEmailTokenDoc.user));
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    const updatedUser = await updateUserById(user.id, { isEmailVerified: true });
    return updatedUser;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

/**
 * @description method에 따라 email 또는 phone을 검증
 */
export const checkIfCorrectInfo = async (method: any, resident: WakeUpUser) => {
  const user = await getUserById(toObjectId(resident.uniqueId));

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, '존재하지 않는 사용자입니다.');
  }

  switch (method) {
    case 'email': {
      if (!resident.method?.email || user.email !== resident.method.email)
        throw new ApiError(httpStatus.BAD_REQUEST, '이메일이 일치하지 않습니다.');
      break;
    }
    case 'phone': {
      if (!resident.method.phone || user.phone.mobile!.number !== resident.method.phone?.mobile.number)
        throw new ApiError(httpStatus.BAD_REQUEST, '휴대폰 번호가 일치하지 않습니다.');
      break;
    }
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, '잘못된 요청입니다.');
  }

  return user;
};

export const setVerificationCodeToRedis = (key: string, code: number) => radish.setVerificationCode(key, code);

export const verifyCode = async (method: VerifyMethodEnum, body: IVerifyCodeBody) => {
  let storedCode: string | null;

  if (method === 'email' && body.email) {
    storedCode = await radish.getValue(body.email);
  } else if (method === 'phone' && body.phoneNumber) {
    storedCode = await radish.getValue(body.phoneNumber);
  } else throw new ApiError(httpStatus.BAD_REQUEST, '형식에 맞지 않습니다.');

  if (!storedCode || storedCode !== body.code.toString())
    throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, '잘못된 코드입니다.');

  await radish.deleteValue(method === 'email' ? body.email! : body.phoneNumber!);
};

export const withdrawUserService = (user: IUserDoc) => userService.deleteUser(user);

export const loginWithCodeService = async (employee: EmployeeIdentifier, password: string) => {
  const [partnerWorker] = await userService.findUserByEmployeeCode(employee);

  if (!partnerWorker || !(await isMatched(password, partnerWorker.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect code or password');
  }
  delete partnerWorker.password;
  return partnerWorker;
};

export const changePassword = async (query: PatchPassword, password: string): Promise<void> => {
  const filter: any = {
    email: query.email,
  };

  const user = await userService.findUserByEmailOrPhone(filter);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, '존재하지 않는 사용자입니다.');

  user.password = password;

  await user.save();
};
