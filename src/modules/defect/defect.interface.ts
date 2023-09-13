import { Document, Model, Types } from 'mongoose';
import { DefectStatus } from './defect.constant';

type Coordinate = {
  x: number;
  y: number;
  z: number;
  latitude: number;
  longitude: number;
  imageId: number;
};

export interface IDefect {
  apartment: {
    unit: {
      uniqueId: Types.ObjectId;
    };
    address: string;
  };
  date: {
    requested: Date;
    repaired: Date;
    confirmed: Date;
  };
  location: string; // 하자보수 위치. 거실, 화장실, 부엌, ...
  status: DefectStatus;
  coordinate: Coordinate;
  work: {
    type: string;
    detail: string;
    additionalInfo: string;
  };
  image: {
    requested: string;
    repaired: string;
    confirmed: string;
  };
  assignedTo: {
    partner: {
      uniqueId: Types.ObjectId;
      engineer: {
        uniqueId: Types.ObjectId;
      };
    };
  };
  contractor: {
    uniqueId: Types.ObjectId;
  };
  resident: {
    uniqueId: Types.ObjectId;
    signature: string;
  };
  rejected: {
    reason: string;
  };
}

export interface IDefectDoc extends IDefect, Document {}
export type IDefectModel = Model<IDefectDoc>;
