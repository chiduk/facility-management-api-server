import { Document, Model } from 'mongoose';
import { ObjectId } from '../common/common.interfaces';
import { DefectStatus } from '@/modules/defect/defect.constant';

export interface INotification {
  user: {
    uniqueId: ObjectId;
  };
  defect: {
    apartment: {
      unit: {
        uniqueId: ObjectId;
      };
    };
    uniqueId: ObjectId;
    location: string;
    status: DefectStatus;
    image: {
      requested: string;
      repaired: string;
    };
    work: {
      type: string;
      detail: string;
      additionalInfo: string;
    };
    date: {
      requested: string;
      repaired: string;
      confirmed: string;
    };
    coordinate: {
      x: number;
      y: number;
      z: number;
      latitude: number;
      longitude: number;
      imageId: number;
    };
  };
  message: string;
  thumbnail: string;
  type: NotificationTypeEnum;
  isRead: boolean;
}

export interface INotificationDoc extends INotification, Document {}
export type INotificationModel = Model<INotificationDoc>;

export enum NotificationTypeEnum {
  RESIDENT = 'RESIDENT',
  PARTNER = 'PARTNER',
}

export interface CreateNotificationDto {
  user: {
    uniqueId: ObjectId;
  };
  defect?: {
    uniqueId?: ObjectId;
    apartment: {
      unit: {
        uniqueId: ObjectId;
      };
    };
    location: string;
    status: DefectStatus;
    image: {
      requested: string;
      repaired: string;
    };
    work: {
      type: string;
      detail: string;
      additionalInfo: string;
    };
    date: {
      requested: Date;
      repaired: Date;
      confirmed: Date;
    };
    coordinate: {
      x: number;
      y: number;
      z: number;
      latitude: number;
      longitude: number;
      imageId: number;
    };
  };
  message: string | null;
  thumbnail: string | null;
  type: NotificationTypeEnum;
  isRead: boolean;
}

export type ReadResidentNotification = {
  uniqueId: ObjectId;
  message: string;
  isRead: boolean;
  thumbnail: string;
  createdAt: string;
};
