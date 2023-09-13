import { Schema, Types, model } from 'mongoose';
import { IInquiryDoc, IInquiryModel, InquiryCategoryEnum, InquiryStatusEnum } from './inquiry.interface';
import { UserType } from '../user/user.constants';

const inquirySchema = new Schema<IInquiryDoc, IInquiryModel>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: InquiryStatusEnum,
      default: InquiryStatusEnum.UNANSWERED,
    },
    category: {
      type: String,
      enum: InquiryCategoryEnum,
      required: true,
    },
    author: {
      uniqueId: {
        type: Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: UserType,
        required: true,
        default: UserType.RESIDENT,
      },
      partner: {
        uniqueId: {
          type: Types.ObjectId,
          default: null,
        },
      },
      contractor: {
        uniqueId: {
          type: Types.ObjectId,
          default: null,
        },
      },
    },
    answer: {
      content: {
        type: String,
        default: null,
      },
    },
    to: {
      contractor: {
        uniqueId: {
          type: Types.ObjectId,
          default: null,
        },
      },
    },
    date: {
      questioned: {
        type: Date,
        default: Date.now,
      },
      answered: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

const Inquiry = model<IInquiryDoc, IInquiryModel>('Inquiry', inquirySchema, 'INQUIRY');

export default Inquiry;
