import { ObjectId } from 'mongoose';
import { InquiryStatusEnum } from '@/modules/inquiry/inquiry.interface';
import { UserType } from '@/modules/user/user.constants';

export type ContractorInquiry = {
  uniqueId: ObjectId;
  title: string;
  content: string;
  status: InquiryStatusEnum;
  author: {
    uniqueId: ObjectId;
    name: string;
    email: string;
    type: UserType;
  };
  createdAt: string;
};

export type Answer = {
  content: string;
};

export type AnswerInquiryInput = {
  inquiry: {
    answer: Answer;
  };
};
