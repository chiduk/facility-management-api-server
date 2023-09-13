import { Aggregate } from 'mongoose';
import Notice from './notice.model';
import { ObjectId } from '../common/common.interfaces';
import { PartnerNotice } from '@/modules/notice/notice.types';
import { DEFAULT_PAGINATION } from '../common/common.constants';

export const createNotice = (createNoticeDto: any) => Notice.create(createNoticeDto);

export const readPartnerNotices = (contractors: ObjectId[], currentPage: number): Aggregate<Array<PartnerNotice>> =>
  Notice.aggregate([
    {
      $match: {
        $or: [{ 'contractor.uniqueId': { $in: contractors } }, { 'contractor.uniqueId': null }],
      },
    },
    {
      $skip: (currentPage - 1) * DEFAULT_PAGINATION,
    },
    {
      $limit: DEFAULT_PAGINATION,
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        title: 1,
        content: 1,
        createdAt: 1,
        contractor: 1,
      },
    },
  ]);

export const countPartnerNotices = (contractors: Object[]) =>
  Notice.count({
    $match: {
      $or: [{ 'contractor.uniqueId': { $in: contractors } }, { 'contractor.uniqueId': null }],
    },
  });
