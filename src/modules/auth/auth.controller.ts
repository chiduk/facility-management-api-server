import { Request, Response } from 'express';
import { catchAsync, httpStatus, toObjectId } from '../utils';
import { tokenService } from '../token';
import { userService } from '../user';
import * as authService from './auth.service';
import * as contractorsService from '../contractor/contractors.service';
import * as partnersService from '../partners/partners.service';
import { emailService, emailUtil, emailTemplate } from '../email';
import snsServices from '../sns';
import {
  IBackofficeLogin,
  ICreateCompanyAndAdmin,
  IFindEmail,
  IGetDeviceToken,
  IPatchPassword,
  IPostDeviceTokens,
  IResetPassword,
  ISignout,
  IVerifyCode,
  IWakeUserUp,
  IWithdrawUser,
} from './auth.interfaces';
import ApiError from '../errors/ApiError';
import { IResponse } from '../common/common.interfaces';
import { deviceTokenInterface } from '../deviceToken';
import * as deviceTokenService from '../deviceToken/deviceToken.service';
import { UserRole, UserType } from '../user/user.constants';

export const createResident = catchAsync(async (req: Request, res: Response) => {
  await userService.createResident(req.body);
  return res.status(httpStatus.CREATED).json('ok');
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  return res.send({ user, tokens });
});

export const backofficeLogin = catchAsync(async (req: IBackofficeLogin, res: IResponse) => {
  const { email, password } = req.body;

  const user = await authService.backofficeLoginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  return res.status(httpStatus.OK).json({ user, tokens });
});

export const signout = catchAsync(async (req: ISignout, res: Response) => {
  const { user } = req;
  await authService.signout(user, req.body.refreshToken);
  return res.status(httpStatus.NO_CONTENT).json();
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await authService.deleteUser(req.body.resident.uniqueId);
  return res.status(httpStatus.NO_CONTENT).json();
});

/**
 * @description
 * access 토큰이 만료된 상태에서 토큰 재발급 요청
 * refresh를 받는다
 * 1. validation 먼저 한다.
 * 2. db에 존재하는지 확인한다.
 */
export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const { user } = req;
  const userWithTokens = await authService.refreshAuth(user, req.body.refreshToken);
  res.send({ ...userWithTokens });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const resetPassword = catchAsync(async (req: IResetPassword, res: Response) => {
  const { user } = req.body;
  const { method } = req.params;
  if (method === 'email') {
    await authService.requestPasswordResetViaEmail(user.email);
  } else {
    await authService.requestPasswordResetViaPhone(user.phone);
  }
  return res.status(httpStatus.OK).send();
});

export const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken, req.user.name);
  res.status(httpStatus.NO_CONTENT).send();
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.query['token']);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * @description
 * path - method 에 따라 분기 처리
 */
export const requestCode = catchAsync(async (req: Request, res: Response) => {
  const { method } = req.params;
  const { email, phoneNumber } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000);

  await authService.setVerificationCodeToRedis(email || phoneNumber, code);

  if (method === 'email' && email) {
    await userService.checkIfUserExistByEmail(email);

    await emailService.sendEmail(email, '인증번호', emailTemplate.verificationCodeTemplate(code));
  } else if (method === 'phone' && phoneNumber) {
    // if (config.env === 'production')
    await userService.checkIfUserExistByPhone(phoneNumber);
    await snsServices.sendVerificationCode({ phoneNumber, code });
  } else throw new ApiError(httpStatus.BAD_REQUEST, '형식이 맞지 않습니다.');

  return res.status(httpStatus.OK).json('ok');
});

export const verifyCode = catchAsync(async (req: IVerifyCode, res: Response) => {
  const { method } = req.params;
  await authService.verifyCode(method, req.body);

  return res.status(httpStatus.NO_CONTENT).send();
});

export const wakeUserUp = catchAsync(async (req: IWakeUserUp, res: Response) => {
  const { resident } = req.body;
  const { method } = req.params;
  // Check if valid user
  const user = await authService.checkIfCorrectInfo(method, resident);

  await authService.wakeUserUp(user);
  return res.status(httpStatus.OK).send();
});

export const findEmail = catchAsync(async (req: IFindEmail, res: Response) => {
  const {
    resident: { phone },
    currentPage,
  } = req.query;

  const defaultCurrentPage = parseInt(currentPage, 10) || 1;
  const options = {
    sortBy: '_id:desc', // sort order
    limit: 10, // maximum results per page
    page: defaultCurrentPage, // page number
    projectBy: 'password:hide,name:hide,phone:hide,role:hide,type:hide,isEmailVerified:hide,isActive:hide', // fields to hide or include in the results
  };
  const {
    mobile: { countryCode, number },
  } = phone;
  const filter = {
    'phone.mobile.countryCode': countryCode,
    'phone.mobile.number': number,
  };

  const result = await userService.queryUsers(filter, options);
  const { results: users, page, totalPages, totalResults, limit } = result;
  const maskedEmails: object[] = [];
  users.forEach((user) => {
    maskedEmails.push({ email: emailUtil.maskEmail(user.toObject()['email']), createdAt: user.toObject()['createdAt'] });
  });

  const user = {
    emails: maskedEmails,
    page,
    limit,
    totalPages,
    totalResults,
  };

  return res.status(httpStatus.OK).json(user);
});

export const withdrawUser = catchAsync(async (req: IWithdrawUser, res: IResponse) => {
  const { user } = req;
  await authService.withdrawUserService(user);
  return res.status(httpStatus.OK).json('ok');
});

export const loginWithCode = catchAsync(async (req: any, res: IResponse) => {
  const { employee, password } = req.body;
  const user = await authService.loginWithCodeService(employee, password);
  const tokens = await tokenService.generateAuthTokens(user);
  return res.status(httpStatus.OK).json({ user, tokens });
});

/**
 * 이메일 또는 전화번호만으로 사용자 식별해야 함
 */
export const patchPassword = catchAsync(async (req: IPatchPassword, res: IResponse) => {
  const { query, body } = req;
  if (body.password !== body.confirmPassword)
    throw new ApiError(httpStatus.BAD_REQUEST, '비밀번호 확인이 일치하지 않습니다.');

  await authService.changePassword(query, body.password);
  return res.status(httpStatus.OK).json('ok');
});

export const postDeviceTokens = catchAsync(async (req: IPostDeviceTokens, res: any) => {
  const { user, body } = req;

  if (String(user._id) !== body.user.uniqueId) throw new ApiError(httpStatus.FORBIDDEN, '올바르지 않은 인증 정보입니다.');

  /**
   * 푸시 알림 수신 동의 여부에 따라 분기 처리
   * 거절 -> user isReceivePush false로 업데이트
   * 수락 -> user isReceivePush true로 업데이트, 기기 토큰 정보 생성
   */

  if (body.user.isReceivePush) {
    const createDeviceTokenDto: deviceTokenInterface.CreateDeviceTokenDto = {
      user: {
        uniqueId: toObjectId(body.user.uniqueId),
      },
      device: body.device,
    };
    await deviceTokenService.createDeviceToken(createDeviceTokenDto);
    await userService.updateUserIsReceivePushToTrue(body.user);
  }
  return res.status(httpStatus.OK).json('ok');
});

/**
 * @description
 * 사용자 uniqueId와 google device token으로 최초접속 여부 확인
 */
export const getDeviceToken = catchAsync(async (req: IGetDeviceToken, res: IResponse) => {
  const {
    user,
    query: { token },
  } = req;

  const isDeviceTokenExist = await deviceTokenService.checkIfDeviceTokenExist(user, token);
  return res.status(httpStatus.OK).json({ isDeviceTokenExist });
});

/**
 * @description
 * 백오피스에서 관리자 계정 생성
 * 시공사 정보 1개와 관리자 계정 정보 1개 생성
 * 1. validation - 시공사 이미 존재하는지??
 * 2. 회원가입 이 후 해당 이메일 인증 발송 필요
 */
export const createContractorAndAdmin = catchAsync(async (req: ICreateCompanyAndAdmin, res: IResponse) => {
  const {
    file,
    body: { createCompanyBody, user },
    params: { type },
  } = req;

  createCompanyBody.business.registration = file.path;

  let createdCompany;
  let createUserDto;

  switch (type) {
    case 'partner':
      createdCompany = await partnersService.createPartner(createCompanyBody);
      createUserDto = {
        ...user,
        partner: {
          uniqueId: createdCompany._id,
        },
        business: {
          registration: file.path,
        },
        role: UserRole.PARTNER_ADMIN,
        type: UserType.PARTNER,
      };
      await userService.createUser(createUserDto);
      break;
    case 'contractor':
      createdCompany = await contractorsService.createContractor(createCompanyBody);
      createUserDto = {
        ...user,
        contractor: {
          uniqueId: createdCompany._id,
        },
        business: {
          registration: file.path,
        },
        role: UserRole.CONTRACTOR_ADMIN,
        type: UserType.CONTRACTOR,
      };
      await userService.createUser(createUserDto);

      break;
    default:
  }

  return res.status(httpStatus.OK).json('ok');
});

export const getMe = catchAsync(async (req: any, res: IResponse) => {
  const { user } = req;
  return res.status(httpStatus.OK).json({ user });
});
