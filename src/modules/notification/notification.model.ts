import { Schema, Types, model } from 'mongoose';
import { INotificationDoc, INotificationModel, NotificationTypeEnum } from './notification.interface';
import { DefectStatus } from '../defect/defect.constant';

const notificationSchema = new Schema<INotificationDoc, INotificationModel>(
  {
    user: {
      uniqueId: {
        type: Types.ObjectId,
        required: true,
      },
    },
    defect: {
      uniqueId: {
        type: Types.ObjectId,
        default: null,
      },
      apartment: {
        unit: {
          uniqueId: {
            type: Types.ObjectId,
          },
        },
      },
      location: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: Object.values(DefectStatus),
        default: null,
      },
      work: {
        type: {
          type: String,
          required: true,
        },
        detail: {
          type: String,
          required: true,
        },
        additionalInfo: {
          type: String,
          default: null,
        },
      },
      image: {
        requested: {
          type: String,
          default: null,
        },
        repaired: {
          type: String,
          default: null,
        },
      },
      date: {
        requested: {
          type: Date,
          default: null,
        },
        repaired: {
          type: Date,
          default: null,
        },
        confirmed: {
          type: Date,
          default: null,
        },
      },
      coordinate: {
        x: {
          type: Number,
          default: null,
        },
        y: {
          type: Number,
          default: null,
        },
        z: {
          type: Number,
          default: null,
        },
        latitude: {
          type: Number,
          default: null,
        },
        longitude: {
          type: Number,
          default: null,
        },
        imageId: {
          type: Number,
          default: null,
          integer: true,
        },
      },
    },
    message: {
      type: String,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypeEnum),
    },
    isRead: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Notification = model<INotificationDoc, INotificationModel>('Notification', notificationSchema, 'NOTIFICATION');

export default Notification;
