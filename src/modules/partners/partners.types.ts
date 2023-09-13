import { ObjectId, PhoneNumberDetail } from '../common/common.interfaces';
import { IUser, IUserDoc } from '../user/user.interfaces';
import { CONTRACTOR_PARTNER_STATUS } from '@/modules/contractor_partner/contractor_partner.constants';
import { InquiryCategoryEnum, InquiryStatusEnum } from '@/modules/inquiry/inquiry.interface';
import { PartnerRole } from '@/modules/user/user.constants';
import { IDefectDoc } from '@/modules/defect/defect.interface';

export type FindEmployeesByPartner = Pick<IUser, 'employee' | 'phone' | 'name' | 'email' | 'role'> & {
  uniqueId: ObjectId;
};

export type CreatePartnerEmployeeDto = Pick<IUser, 'employee' | 'password' | 'name' | 'email' | 'phone'> & {
  role: PartnerRole;
};

export type UpdatePartnerEmployeeDto = Pick<IUser, 'employee' | 'password' | 'name' | 'email' | 'phone'> & {
  role: PartnerRole;
};

export type FindPartnerByContractor = {
  company: string;
  works: String[];
  status: CONTRACTOR_PARTNER_STATUS;
  email: string;
  phone: {
    mobile: PhoneNumberDetail;
    office: PhoneNumberDetail;
    fax: PhoneNumberDetail;
  };
  uniqueId: string;
};

export type GetInquiry = {
  title: string;
  content: string;
  category: InquiryCategoryEnum;
  status: InquiryStatusEnum;
  author: {
    uniqueId: ObjectId;
    name: string;
    email: string;
    partner: {
      uniqueId: ObjectId;
    };
  };
  to: {
    contractor: {
      uniqueId: ObjectId;
    };
  };
  createdAt: string;
};

export interface IUserPartnerDoc extends IUserDoc {
  partner: {
    uniqueId: ObjectId;
  };
}

export type PartnerDefect = Pick<IDefectDoc, 'location' | 'coordinate' | 'work' | 'status' | 'image'> & {
  uniqueId: ObjectId;
  assignedTo: {
    partner: {
      engineer: null | {
        name: string;
        uniqueId: ObjectId;
      };
    };
  };
};

export interface PartnerDefectResult {
  complex: {
    uniqueId: ObjectId;
    name: string;
  };
  unit: {
    uniqueId: ObjectId;
    dong: string;
    ho: number;
  };
  resident: {
    uniqueId: ObjectId;
    name: string;
    phone: {
      mobile: PhoneNumberDetail;
    };
  };
  defects: PartnerDefect[];
}
