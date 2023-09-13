import { Aggregate } from 'mongoose';
import { httpStatus, moment } from '../utils';
import { defectService, defectConstant } from '../defect';
import Notification from './notification.model';
import { CreateNotificationDto, NotificationTypeEnum, ReadResidentNotification } from './notification.interface';
import { IDefectDoc } from '../defect/defect.interface';
import { IUserDoc } from '../user/user.interfaces';
import { Identifier } from '@/modules/common/common.interfaces';
import { ApiError } from '../errors';

const { convertDefectStatusToResidentKorean } = defectConstant;

export const residentNotificationTemplate = (defect: IDefectDoc) =>
  `${moment(defect.date.requested).format('YYYY.MM.DD')}에 신청한\n<b>${defect.location} > ${defect.work.type} > ${
    defect.work.detail
  }</b> 하자가 <b>${convertDefectStatusToResidentKorean(defect.status)}</b> 상태로 변경되었습니다.`;

export const createNotification = (createNotificationDto: CreateNotificationDto) =>
  Notification.create(createNotificationDto);

export const updateIsReadToTrue = async (notifications: ReadResidentNotification[]) => {
  const notificationIds = notifications.map((notification) => notification.uniqueId);

  await Notification.updateMany(
    {
      _id: {
        $in: notificationIds,
      },
      isRead: false,
    },
    {
      isRead: true,
    }
  );
};

export const readResidentNotification = (user: IUserDoc): Aggregate<Array<ReadResidentNotification>> =>
  Notification.aggregate([
    {
      $match: {
        user: {
          uniqueId: user._id,
        },
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        isRead: 1,
        defect: 1,
        createdAt: 1,
      },
    },
  ]);

export const findDefectAndCreateNotification = async (defect: Identifier) => {
  const foundDefect = await defectService.findDefectById(defect);
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '하자를 찾을 수 없습니다.');
  const createNotificationDto: CreateNotificationDto = {
    user: {
      uniqueId: foundDefect.resident.uniqueId,
    },
    defect: {
      apartment: foundDefect.apartment,
      uniqueId: foundDefect._id,
      location: foundDefect.location,
      status: foundDefect.status,
      image: foundDefect.image,
      work: foundDefect.work,
      date: foundDefect.date,
      coordinate: foundDefect.coordinate,
    },
    message: residentNotificationTemplate(foundDefect),
    thumbnail: foundDefect.image.requested,
    type: NotificationTypeEnum.RESIDENT,
    isRead: false,
  };
  await createNotification(createNotificationDto);
};
