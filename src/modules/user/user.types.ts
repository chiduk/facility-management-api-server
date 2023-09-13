import { Types } from 'mongoose';
import { PhoneNumberDetail } from '@/modules/common/common.interfaces';
import { UserRole, UserType } from '@/modules/user/user.constants';

export type LoginUser = {
  uniqueId: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone: {
    mobile: PhoneNumberDetail;
  };
  role: UserRole;
  type: UserType;
  isEmailVerified: boolean;
  isActive: boolean;
  isReceivePush: boolean;
  default: {
    apartment: {
      unit: {
        uniqueId: Types.ObjectId;
        dong: string;
        ho: number;
      };
      complex: {
        uniqueId: Types.ObjectId;
        name: string;
        address: string;
      };
    };
  };
};
