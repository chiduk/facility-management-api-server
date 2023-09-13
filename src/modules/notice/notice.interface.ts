import { Document, Model } from 'mongoose';
import { ObjectId } from '../common/common.interfaces';

export interface INotice {
  title: string;
  content: string;
  status: string;
  category: string;
  author: {
    uniqueId: ObjectId;
  };
  contractor: {
    uniqueId: ObjectId;
  };
}

export interface INoticeDoc extends INotice, Document {}
export type INoticeModel = Model<INoticeDoc>;
