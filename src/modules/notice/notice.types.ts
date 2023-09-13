import { ObjectId } from '../common/common.interfaces';

export type PartnerNotice = {
  uniqueId: ObjectId;
  title: string;
  content: string;
  createdAt: string;
  contractor: {
    uniqueId: ObjectId | null;
  };
};
