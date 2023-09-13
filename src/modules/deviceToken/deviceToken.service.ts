import { Query } from 'mongoose';
import DeviceToken from './deviceToken.model';
import { CreateDeviceTokenDto } from './deviceToken.interfaces';
import { IUserDoc } from '@/modules/user/user.interfaces';
import { IDeviceTokenDoc } from '@/modules/deviceToken/deviceToken.interfaces';

export const createDeviceToken = (createDeviceTokenDto: CreateDeviceTokenDto) =>
  DeviceToken.create({
    user: {
      uniqueId: createDeviceTokenDto.user.uniqueId,
    },
    token: createDeviceTokenDto.device.token,
    platform: createDeviceTokenDto.device.platform,
  });

export const findDeviceTokenByUserId = (user: IUserDoc): Query<IDeviceTokenDoc, any> =>
  DeviceToken.findOne({
    'user.uniqueId': user._id,
  });

export const checkIfDeviceTokenExist = async (user: IUserDoc, token: string): Promise<boolean> => {
  const deviceToken = await DeviceToken.findOne({
    'user.uniqueId': user._id,
    token,
  });

  return !!deviceToken;
};
