import { Model, Document, Types } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { TokenPayload } from '../token/token.interfaces';
import { UserRole, UserType } from '@/modules/user/user.constants';

export interface IUser {
  employee?: EmployeeIdentifier;
  name: string;
  email: string;
  password: string;
  phone: {
    mobile: {
      countryCode: number;
      number: string;
    };
  };
  partner: {
    uniqueId: Types.ObjectId | null;
  };
  contractor: {
    uniqueId: Types.ObjectId | null;
  };
  role: UserRole;
  type: UserType;
  isEmailVerified: boolean;
  isActive: boolean;
  isBlacklisted: boolean;
  isReceivePush: boolean;
  default: {
    apartment: {
      unit: {
        uniqueId: Types.ObjectId | null;
      };
    };
  };
}

export interface IUserDoc extends IUser, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
  isEmailTaken(email: string, excludeUserId?: Types.ObjectId): Promise<boolean>;
}

export type UpdateUserBody = Partial<IUser>;

export type NewCreatedUser = Partial<IUser>;

export type NewCreatedResident = Omit<IUser, 'contractor' | 'partner'>;

export interface IUserWithTokens {
  user: IUserDoc;
  accessToken: TokenPayload;
}

export type EmployeeIdentifier = {
  code: string | null;
};

export interface CreateAdminBody extends Pick<IUserDoc, 'name' | 'email' | 'password'> {
  phone: {
    mobile: {
      number: string;
    };
  };
}
