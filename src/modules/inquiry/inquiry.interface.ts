import { Document, Model, ObjectId, Types } from 'mongoose';
import { UserType } from '@/modules/user/user.constants';

export interface IInquiry {
  title: string;
  content: string;
  status: InquiryStatusEnum;
  category: InquiryCategoryEnum;
  author: {
    uniqueId: Types.ObjectId;
    name: string;
    email: string;
    type: UserType;
    partner: {
      uniqueId: Types.ObjectId | null;
    };
    contractor: {
      uniqueId: Types.ObjectId | null;
    };
  };
  answer: {
    content: string | null;
  };
  to: {
    contractor: {
      uniqueId: Types.ObjectId | null;
    };
  };
  date: {
    questioned: Date;
    answered: Date;
  };
}

export enum InquiryCategoryEnum {
  APP = 'APP',
  CONTRACTOR = 'CONTRACTOR',
  VIEWER = 'VIEWER',
}

export enum InquiryStatusEnum {
  ANSWERED = 'ANSWERED',
  UNANSWERED = 'UNANSWERED',
}

export interface IInquiryDoc extends IInquiry, Document {}
export type IInquiryModel = Model<IInquiryDoc>;

export interface CreateInquiryDto {
  title: string;
  content: string;
  category: InquiryCategoryEnum;
  author: {
    uniqueId: ObjectId;
    name: string;
    email: string;
    type: UserType;
    partner: {
      uniqueId: Types.ObjectId | null;
    };
    contractor: {
      uniqueId: Types.ObjectId | null;
    };
  };
  to: {
    contractor: {
      uniqueId: string | null;
    };
  };
}

export interface CreateInquiryBody {
  title: string;
  category: InquiryCategoryEnum;
  content: string;
  to?: {
    contractor: {
      uniqueId: string;
    };
  };
}
