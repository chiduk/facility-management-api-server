import { CreateCompanyBody, Identifier, IRequest, PhoneNumberDetail } from '../common/common.interfaces';
import { CreateAdminBody } from '@/modules/user/user.interfaces';

export interface WakeUpUser {
  uniqueId: string;
  method: {
    phone?: {
      mobile: {
        countryCode: number;
        number: string;
      };
    };
    email?: string;
  };
}

export interface ISignout extends IRequest {}

export enum VerifyMethodEnum {
  PHONE = 'phone',
  EMAIL = 'email',
}

export interface IVerifyCodeBody {
  code: number;
  phoneNumber?: string;
  email?: string;
}

export type VerifyMethod = {
  method: VerifyMethodEnum;
};
export interface IVerifyCode {
  params: VerifyMethod;
  body: IVerifyCodeBody;
}

export interface IWakeUserUp extends IRequest {
  params: {
    method: VerifyMethodEnum;
  };
  body: {
    resident: WakeUpUser;
  };
}

export type ResidentPhoneInfo = {
  phone: {
    mobile: PhoneNumberDetail;
  };
};

export type ResidentEmailInfo = {
  email: string;
};

export type UserIdentifyMethod = ResidentEmailInfo & ResidentPhoneInfo;
export interface IFindEmail {
  query: {
    resident: ResidentPhoneInfo;
    currentPage: string;
  };
}

export interface IResetPassword extends IRequest {
  params: {
    method: VerifyMethodEnum;
  };
  body: {
    user: UserIdentifyMethod;
  };
}

export interface IWithdrawUser extends IRequest {}

export interface IPatchPassword {
  query: PatchPassword;
  body: {
    password: string;
    confirmPassword: string;
  };
}

export type PatchPassword = {
  email: string;
};

export interface IPostDeviceTokens extends IRequest {
  body: {
    user: Identifier & {
      isReceivePush: boolean;
    };
    device: {
      platform: string;
      token: string;
    };
  };
}

export interface IGetDeviceToken extends IRequest {
  query: {
    user: Identifier;
    token: string;
  };
}

export interface ICreateCompanyAndAdmin extends IRequest {
  file: Express.Multer.File;
  body: {
    createCompanyBody: CreateCompanyBody;
    user: CreateAdminBody;
  };
}

export interface IBackofficeLogin extends IRequest {
  body: {
    email: string;
    password: string;
  };
}
