import { Schema, Types, model } from 'mongoose';
import { INoticeDoc, INoticeModel } from './notice.interface';

const noticeSchema = new Schema<INoticeDoc, INoticeModel>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      uniqueId: {
        type: Types.ObjectId,
        required: true,
      },
    },
    contractor: {
      uniqueId: {
        type: Types.ObjectId,
      },
    },
  },
  { timestamps: true }
);

const Notice = model<INoticeDoc, INoticeModel>('Notice', noticeSchema, 'NOTICE');

export default Notice;
