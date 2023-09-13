import mongoose, { Types } from 'mongoose';
import toJSON from '../toJSON/toJSON';
import { IDeviceTokenDoc, IDeviceTokenModel } from './deviceToken.interfaces';

const tokenSchema = new mongoose.Schema<IDeviceTokenDoc, IDeviceTokenModel>(
  {
    user: {
      uniqueId: {
        type: Types.ObjectId,
        required: true,
      },
    },
    platform: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

const DeviceToken = mongoose.model<IDeviceTokenDoc, IDeviceTokenModel>('DeviceToken', tokenSchema, 'DEVICE_TOKEN');

export default DeviceToken;
