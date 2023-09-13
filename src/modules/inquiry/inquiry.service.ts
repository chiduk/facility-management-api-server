import { Aggregate } from 'mongoose';
import Inquiry from './inquiry.model';
import { CreateInquiryBody, CreateInquiryDto, InquiryStatusEnum } from './inquiry.interface';
import { Identifier } from '@/modules/common/common.interfaces';
import { toObjectId, httpStatus } from '../utils';
import { DEFAULT_PAGINATION } from '../common/common.constants';
import { Answer, ContractorInquiry } from '@/modules/contractor/contractor.types';
import { ApiError } from '../errors';
import { contractorService } from '../contractor';
import { IUserDoc } from '@/modules/user/user.interfaces';
import { GetInquiry } from '@/modules/partners/partners.types';

export const createInquiry = async (inquiry: CreateInquiryBody, user: IUserDoc) => {
  const createInquiryDto: CreateInquiryDto = {
    category: inquiry.category,
    title: inquiry.title,
    content: inquiry.content,
    author: {
      uniqueId: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      partner: user.partner,
      contractor: user.contractor,
    },
    to: {
      contractor: {
        uniqueId: null,
      },
    },
  };
  if (inquiry.to !== undefined) {
    await contractorService.checkIfContractorExist(inquiry.to.contractor);
    createInquiryDto.to.contractor.uniqueId = inquiry.to.contractor.uniqueId;
  }
  await Inquiry.create({
    ...createInquiryDto,
  });
};

export const findInquiriesByAuthor = (author: Identifier) =>
  Inquiry.aggregate([
    {
      $match: {
        'author.uniqueId': toObjectId(author.uniqueId),
      },
    },
    {
      $group: {
        _id: null,
        answered: {
          $push: {
            $cond: {
              if: { $eq: ['$status', InquiryStatusEnum.ANSWERED] },
              then: {
                uniqueId: '$_id',
                title: '$title',
                content: '$content',
                category: '$category',
                author: '$author',
                answer: '$answer',
                to: '$to',
                createdAt: '$createdAt',
              },
              else: null,
            },
          },
        },
        unanswered: {
          $push: {
            $cond: {
              if: { $eq: ['$status', InquiryStatusEnum.UNANSWERED] },
              then: {
                uniqueId: '$_id',
                title: '$title',
                content: '$content',
                category: '$category',
                author: '$author',
                answer: '$answer',
                to: '$to',
                createdAt: '$createdAt',
              },
              else: null,
            },
          },
        },
      },
    },
    {
      $project: {
        answered: {
          $filter: {
            input: '$answered',
            cond: { $ne: ['$$this', null] },
          },
        },
        unanswered: {
          $filter: {
            input: '$unanswered',
            cond: { $ne: ['$$this', null] },
          },
        },
        _id: 0,
      },
    },
    {
      $project: {
        answered: { $ifNull: ['$answered', []] },
        unanswered: { $ifNull: ['$unanswered', []] },
      },
    },
  ]);

export const findInquiriesPagination = (currentPage: number) =>
  Inquiry.aggregate([
    {
      $sort: {
        createdAt: -1,
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
        createdAt: 1,
        author: 1,
      },
    },
  ]);

export const getContractorInquiries = (contractor: Identifier): Aggregate<Array<ContractorInquiry>> =>
  Inquiry.aggregate([
    {
      $match: {
        'to.contractor.uniqueId': toObjectId(contractor.uniqueId),
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        title: 1,
        content: 1,
        status: 1,
        author: 1,
        createdAt: 1,
      },
    },
  ]);

export const answerContractorInquiry = async (contractor: Identifier, inquiry: Identifier, answer: Answer) => {
  const foundInquiry = await Inquiry.findById(toObjectId(inquiry.uniqueId));
  if (!foundInquiry) throw new ApiError(httpStatus.NOT_FOUND, '문의가 존재하지 않습니다.');
  if (!foundInquiry.to.contractor.uniqueId || !toObjectId(contractor.uniqueId).equals(foundInquiry.to.contractor.uniqueId))
    throw new ApiError(httpStatus.UNAUTHORIZED, '권한이 없습니다.');
  if (foundInquiry.status === InquiryStatusEnum.ANSWERED)
    throw new ApiError(httpStatus.CONFLICT, '이미 답변 완료된 문의입니다.');

  foundInquiry.answer.content = answer.content;
  foundInquiry.status = InquiryStatusEnum.ANSWERED;

  await foundInquiry.save();
};

export const getPartnerInquiries = (partner: Identifier): Aggregate<Array<GetInquiry>> =>
  Inquiry.aggregate([
    {
      $match: {
        'author.partner.uniqueId': toObjectId(partner.uniqueId),
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        title: 1,
        content: 1,
        category: 1,
        status: 1,
        author: 1,
        to: 1,
        createdAt: 1,
      },
    },
  ]);

export const getContractorPspaceInquiries = (contractor: Identifier): Aggregate<Array<GetInquiry>> =>
  Inquiry.aggregate([
    {
      $match: {
        'author.contractor.uniqueId': toObjectId(contractor.uniqueId),
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        title: 1,
        content: 1,
        category: 1,
        status: 1,
        author: 1,
        to: 1,
        createdAt: 1,
      },
    },
  ]);
