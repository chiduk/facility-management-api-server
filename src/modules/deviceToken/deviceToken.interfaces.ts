import { Document, Model, Types } from 'mongoose';

export interface IDeviceToken {
  user: {
    uniqueId: Types.ObjectId;
  };
  platform: string;
  token: string;
}

export interface IDeviceTokenDoc extends IDeviceToken, Document {}

export interface IDeviceTokenModel extends Model<IDeviceTokenDoc> {}

export interface CreateDeviceTokenDto {
  user: {
    uniqueId: Types.ObjectId;
  };
  device: {
    platform: string;
    token: string;
  };
}
