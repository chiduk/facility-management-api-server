import { Aggregate } from 'mongoose';
import { toObjectId, httpStatus, moment } from '../utils';
import Defect from './defect.model';
import { CreateDefectDto } from '../residents/residents.interfaces';
import {
  DEFECT_PARTNER_ADMIN_STATUS,
  DefectStatus,
  DEFECT_RESIDENT_STATUS,
  DEFECT_PARTNER_ENGINEER_STATUS,
  DEFECT_CONTRACTOR_STATUS,
} from './defect.constant';
import { ApartmentQuery, DefectQuery, Identifier } from '@/modules/common/common.interfaces';
import { IFilterDefect } from '@/modules/partners/partners.interface';
import { ApiError } from '../errors';
import { ApartmentUnit } from '../apartmentUnit';
import { IUserDoc } from '@/modules/user/user.interfaces';
import { IUserPartnerDoc, PartnerDefectResult } from '@/modules/partners/partners.types';
import { DefectStatistics } from '@/modules/defect/defect.type';
import { DEFAULT_PAGINATION } from '../common/common.constants';

export const findDefectById = (defect: DefectQuery) => Defect.findById(toObjectId(defect.uniqueId));

export const findMyFilteredDefects = async (query: any) =>
  Defect.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: {
          $cond: [
            { $in: ['$status', DEFECT_RESIDENT_STATUS.NOT_PROCESSED] },
            'NOT_PROCESSED',
            {
              $cond: [
                { $in: ['$status', DEFECT_RESIDENT_STATUS.CONFIRMED] },
                'REPAIRED',
                {
                  $cond: [{ $in: ['$status', DEFECT_RESIDENT_STATUS.CONFIRMED] }, 'CONFIRMED', 'IN_PROGRESS'],
                },
              ],
            },
          ],
        },
        defects: {
          $push: {
            uniqueId: '$_id',
            apartment: '$apartment',
            date: '$date',
            coordinate: '$coordinate',
            location: '$location',
            status: '$status',
            work: '$work',
            image: '$image',
            assignedTo: '$assignedTo',
            contractor: '$contractor',
            resident: '$resident',
          },
        },
      },
    },
    {
      $project: {
        status: '$_id',
        _id: 0,
        defects: 1,
        defectCount: { $size: '$defects' },
      },
    },
    {
      $facet: {
        groupedDefects: [
          {
            $project: {
              status: 1,
              // defects: 1,
              defectCount: { $size: '$defects' },
            },
          },
        ],
        allDefects: [
          { $unwind: '$defects' },
          { $replaceRoot: { newRoot: '$defects' } },
          { $sort: { 'date.requested': -1 } },
        ],
      },
    },
  ]);

export const createMyDefects = async (
  resident: Identifier,
  unit: any,
  defect: CreateDefectDto,
  file: Express.Multer.File,
  contractorPartner: any
) => {
  const address = `${unit.apartment.complex.address} ${unit.apartment.complex.name} ${unit.dong}동 ${unit.ho}호`;

  const newDefect = await Defect.create({
    apartment: {
      unit: {
        uniqueId: toObjectId(unit.uniqueId),
      },
      address,
    },
    coordinate: {
      x: defect.coordinate.x,
      y: defect.coordinate.y,
      z: defect.coordinate.z,
      latitude: defect.coordinate.latitude,
      longitude: defect.coordinate.longitude,
      imageId: parseInt(String(defect.coordinate.imageId), 10),
    },
    location: defect.location,
    work: defect.work,
    image: {
      requested: file.filename || '',
    },
    assignedTo: {
      partner: {
        uniqueId: contractorPartner ? toObjectId(contractorPartner.partner.uniqueId) : null,
      },
    },
    contractor: {
      uniqueId: toObjectId(unit.apartment.complex.contractor.uniqueId),
    },
    resident: {
      uniqueId: toObjectId(resident.uniqueId),
    },
    status: contractorPartner ? DefectStatus.PARTNER_ASSIGNED : DefectStatus.PARTNER_NOT_ASSIGNED,
  });

  return newDefect;
};

export const findMyDefectsWithinAptUnit = async (resident: Identifier, apartment: ApartmentQuery) => {
  const foundApartment = await ApartmentUnit.findOne({ _id: toObjectId(apartment.unit.uniqueId) });
  if (!foundApartment) throw new ApiError(httpStatus.NOT_FOUND, '아파트가 존재하지 않습니다.');

  const defects = await Defect.aggregate([
    {
      $match: {
        'resident.uniqueId': resident.uniqueId,
        'apartment.unit.uniqueId': toObjectId(apartment.unit.uniqueId),
      },
    },
    {
      $sort: {
        'date.requested': -1,
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        apartment: 1,
        date: 1,
        coordinate: 1,
        rejected: 1,
        work: 1,
        assignedTo: 1,
        contractor: 1,
        resident: 1,
        location: 1,
        status: 1,
        image: 1,
      },
    },
  ]);
  return defects;
};

export const findOneDefect = async (defect: DefectQuery, resident: Identifier) => {
  const foundDefect = await Defect.aggregate([
    {
      $match: {
        'resident.uniqueId': toObjectId(resident.uniqueId),
        _id: toObjectId(defect.uniqueId),
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        apartment: 1,
        date: 1,
        coordinate: 1,
        work: 1,
        assignedTo: 1,
        contractor: 1,
        location: 1,
        status: 1,
        image: 1,
      },
    },
  ]);

  if (foundDefect.length <= 0) throw new ApiError(httpStatus.NOT_FOUND, '하자를 찾을 수 없습니다.');
  return foundDefect[0];
};

export const findDefectByIdAndAssigneeEngineer = (defect: Identifier, engineer: Identifier) =>
  Defect.aggregate([
    {
      $match: {
        _id: toObjectId(defect.uniqueId),
        'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        foreignField: '_id',
        localField: 'apartment.unit.uniqueId',
        as: 'apartment.unit',
      },
    },
    {
      $unwind: '$apartment.unit',
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        foreignField: '_id',
        localField: 'apartment.unit.apartment.complex.uniqueId',
        as: 'apartment.complex',
      },
    },
    {
      $unwind: '$apartment.complex',
    },
    {
      $project: {
        uniqueId: '$_id',
        apartment: {
          complex: {
            uniqueId: '$apartment.complex._id',
            name: '$apartment.complex.name',
            address: '$apartment.complex.address',
          },
          unit: {
            uniqueId: '$apartment.unit._id',
            dong: '$apartment.unit.dong',
            ho: '$apartment.unit.ho',
          },
        },
        date: 1,
        coordinate: 1,
        location: 1,
        status: 1,
        assignedTo: 1,
        contractor: 1,
        resident: 1,
        image: 1,
        work: 1,
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

export const findDefectByIdAndAssigneePartner = (partner: Identifier, defect: Identifier) =>
  Defect.findOne({
    _id: toObjectId(defect.uniqueId),
    'assignedTo.partner.uniqueId': toObjectId(partner.uniqueId),
  });

export const findDefectsByEngineerMultiFilter = (engineer: Identifier, query: IFilterDefect) =>
  Defect.aggregate([
    {
      $match: {
        'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        foreignField: '_id',
        localField: 'apartment.unit.uniqueId',
        as: 'apartment.unit',
      },
    },
    {
      $unwind: '$apartment.unit',
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        foreignField: '_id',
        localField: 'apartment.unit.apartment.complex.uniqueId',
        as: 'apartment.complex',
      },
    },
    {
      $unwind: '$apartment.complex',
    },
    {
      $addFields: {
        'apartment.complex.uniqueId': '$apartment.complex._id',
      },
    },
    {
      $match: query,
    },
    {
      $group: {
        _id: {
          uniqueId: '$apartment.complex._id',
          address: '$apartment.complex.address',
          name: '$apartment.complex.name',
        },
        defects: {
          $push: {
            uniqueId: '$_id',
            status: '$status',
          },
        },
      },
    },
    {
      $project: {
        uniqueId: '$_id.uniqueId',
        address: '$_id.address',
        name: '$_id.name',
        _id: 0,
        defect: {
          notProcessed: {
            count: {
              $size: {
                $filter: {
                  input: '$defects',
                  as: 'defect',
                  cond: { $in: ['$$defect.status', DEFECT_PARTNER_ENGINEER_STATUS.NOT_PROCESSED] },
                },
              },
            },
          },
          completed: {
            count: {
              $size: {
                $filter: {
                  input: '$defects',
                  as: 'defect',
                  cond: { $in: ['$$defect.status', DEFECT_PARTNER_ENGINEER_STATUS.ENGINEER_DONE] },
                },
              },
            },
          },
          rejected: {
            count: {
              $size: {
                $filter: {
                  input: '$defects',
                  as: 'defect',
                  cond: { $in: ['$$defect.status', DEFECT_PARTNER_ENGINEER_STATUS.REJECTED] },
                },
              },
            },
          },
        },
      },
    },
  ]);

export const findDefectByPkResident = (defect: DefectQuery, resident: Identifier) =>
  Defect.findOne({
    _id: toObjectId(defect.uniqueId),
    'resident.uniqueId': toObjectId(resident.uniqueId),
  });

export const findEngineerTasksOfOneComplex = (engineer: Identifier, filter: any) =>
  Defect.aggregate([
    {
      $match: {
        'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
        status: {
          $in: DEFECT_PARTNER_ENGINEER_STATUS.ENGINEER_ASSIGNED,
        },
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        foreignField: '_id',
        localField: 'apartment.unit.uniqueId',
        as: 'apartment.unit',
      },
    },
    {
      $unwind: '$apartment.unit',
    },
    {
      $match: filter,
    },
    {
      $group: {
        _id: {
          dong: '$apartment.unit.dong',
          ho: '$apartment.unit.ho',
          uniqueId: '$apartment.unit._id',
        },
        defects: {
          $push: {
            uniqueId: '$_id',
            status: '$status',
            coordinate: '$coordinate',
            location: '$location',
            work: '$work',
            image: '$image',
            date: '$date',
          },
        },
      },
    },
    {
      $project: {
        defects: 1,
        unit: '$_id',
        _id: 0,
      },
    },
    {
      $group: {
        _id: {
          ho: '$unit.ho',
          uniqueId: '$unit.uniqueId',
        },
        dong: { $first: '$unit.dong' },
        defects: { $first: '$defects' },
      },
    },
    {
      $sort: {
        '_id.ho': 1,
      },
    },
    {
      $project: {
        ho: '$_id.ho',
        uniqueId: '$_id.uniqueId',
        _id: 0,
        dong: 1,
        defects: 1,
        notProcessedCount: {
          $size: {
            $filter: {
              input: '$defects',
              as: 'defect',
              cond: { $in: ['$$defect.status', DEFECT_PARTNER_ENGINEER_STATUS.NOT_PROCESSED] },
            },
          },
        },
        completedCount: {
          $size: {
            $filter: {
              input: '$defects',
              as: 'defect',
              cond: { $in: ['$$defect.status', DEFECT_PARTNER_ENGINEER_STATUS.ENGINEER_DONE] },
            },
          },
        },
        rejectedCount: {
          $size: {
            $filter: {
              input: '$defects',
              as: 'defect',
              cond: { $in: ['$$defect.status', DEFECT_PARTNER_ENGINEER_STATUS.REJECTED] },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: '$dong',
        units: {
          $push: {
            uniqueId: '$uniqueId',
            ho: '$ho',
            count: {
              notProcessed: '$notProcessedCount',
              completed: '$completedCount',
              rejected: '$rejectedCount',
            },
            // completedCount: '$completedCount',
            // notProcessedCount: '$notProcessedCount',
            // rejectedCount: '$rejectedCount',
            // defects: '$defects',
          },
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        dong: '$_id',
        units: 1,
        count: {
          notProcessed: { $sum: '$units.count.notProcessed' },
          completed: { $sum: '$units.count.completed' },
          rejected: { $sum: '$units.count.rejected' },
        },
      },
    },
  ]);

export const findDefectByIdAndEngineer = (defect: Identifier, engineer: Identifier) =>
  Defect.findOne({
    _id: toObjectId(defect.uniqueId),
    'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
  });

export const findAndGroupRecent7days = () =>
  Defect.aggregate([
    {
      $match: {
        createdAt: {
          $gte: moment().add(-10, 'days').toDate(),
        },
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        createdAt: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        status: 1,
      },
    },
    {
      $group: {
        _id: {
          status: '$status',
          createdAt: '$createdAt',
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        status: '$_id.status',
        createdAt: '$_id.createdAt',
        _id: 0,
        count: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ]);

export const findRepairedDefectsByResident = (user: IUserDoc) =>
  Defect.aggregate([
    {
      $match: {
        'resident.uniqueId': user._id,
        status: DefectStatus.REPAIRED,
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        apartment: 1,
        date: 1,
        coordinate: 1,
        location: 1,
        status: 1,
        work: 1,
        image: 1,
        resident: 1,
      },
    },
    {
      $sort: {
        'date.requested': -1,
      },
    },
  ]);

export const findDefectsByPartnerEngineerUnit = (partner: Identifier, unit: Identifier, engineer: IUserDoc) =>
  Defect.aggregate([
    {
      $match: {
        'apartment.unit.uniqueId': toObjectId(unit.uniqueId),
        'assignedTo.partner.uniqueId': toObjectId(partner.uniqueId),
        'assignedTo.partner.engineer.uniqueId': engineer._id,
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        apartment: 1,
        date: 1,
        coordinate: 1,
        location: 1,
        status: 1,
        work: 1,
        image: 1,
        assignedTo: 1,
        contractor: 1,
        resident: 1,
      },
    },
  ]);

export const calculateDefectCountByStatusPartner = (user: IUserPartnerDoc): Aggregate<Array<DefectStatistics>> =>
  Defect.aggregate([
    {
      $match: {
        'assignedTo.partner.uniqueId': user.partner.uniqueId,
      },
    },
    {
      $addFields: {
        inProgress: {
          $in: ['$status', DEFECT_PARTNER_ADMIN_STATUS.IN_PROGRESS],
        },
        notProcessed: {
          $in: ['$status', DEFECT_PARTNER_ADMIN_STATUS.NOT_PROCESSED],
        },
        rejected: {
          $in: ['$status', DEFECT_PARTNER_ADMIN_STATUS.REJECTED],
        },
        repaired: {
          $in: ['$status', DEFECT_PARTNER_ADMIN_STATUS.REPAIRED],
        },
        confirmed: {
          $in: ['$status', DEFECT_PARTNER_ADMIN_STATUS.CONFIRMED],
        },
      },
    },
    {
      $group: {
        _id: null,
        inProgress: {
          $sum: {
            $cond: ['$inProgress', 1, 0],
          },
        },
        notProcessed: {
          $sum: {
            $cond: ['$notProcessed', 1, 0],
          },
        },
        rejected: {
          $sum: {
            $cond: ['$rejected', 1, 0],
          },
        },
        repaired: {
          $sum: {
            $cond: ['$repaired', 1, 0],
          },
        },
        confirmed: {
          $sum: {
            $cond: ['$confirmed', 1, 0],
          },
        },
      },
    },
    {
      $addFields: {
        all: {
          $add: ['$inProgress', '$notProcessed', '$rejected', '$repaired', '$confirmed'],
        },
      },
    },
    {
      $project: {
        _id: 0,
        inProgress: 1,
        notProcessed: 1,
        rejected: 1,
        repaired: 1,
        confirmed: 1,
        all: 1,
      },
    },
  ]);

export const countContractorCriticalDefects = (contractor: Identifier) =>
  Defect.count({
    contractor: {
      uniqueId: toObjectId(contractor.uniqueId),
    },
    status: {
      $in: [...DEFECT_CONTRACTOR_STATUS.REJECTED, ...DEFECT_CONTRACTOR_STATUS.PARTNER_NOT_ASSIGNED],
    },
  });

export const findContractorCriticalDefects = (contractor: Identifier, currentPage: number) =>
  Defect.aggregate([
    {
      $match: {
        contractor: {
          uniqueId: toObjectId(contractor.uniqueId),
        },
        status: {
          $in: [...DEFECT_CONTRACTOR_STATUS.REJECTED, ...DEFECT_CONTRACTOR_STATUS.PARTNER_NOT_ASSIGNED],
        },
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        localField: 'apartment.unit.uniqueId',
        foreignField: '_id',
        as: 'apartment.unit',
      },
    },
    {
      $unwind: '$apartment.unit',
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        localField: 'apartment.unit.apartment.complex.uniqueId',
        foreignField: '_id',
        as: 'apartment.complex',
      },
    },
    {
      $unwind: '$apartment.complex',
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
        'date.requested': 1,
        status: 1,
        'work.type': '$work.type',
        'apartment.complex.uniqueId': '$apartment.complex._id',
        'apartment.complex.name': 1,
        'apartment.unit.dong': 1,
        'apartment.unit.ho': 1,
        'apartment.unit.uniqueId': '$apartment.unit._id',
      },
    },
  ]);

export const findContractorDefectsDynamicQuery = (
  contractor: Identifier,
  filter: any,
  currentPage: number
): Aggregate<Array<PartnerDefectResult>> =>
  Defect.aggregate([
    {
      $match: { 'contractor.uniqueId': toObjectId(contractor.uniqueId) },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        localField: 'apartment.unit.uniqueId',
        foreignField: '_id',
        as: 'apartment.unit',
      },
    },
    {
      $unwind: {
        path: '$apartment.unit',
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT_TYPE',
        localField: 'apartment.unit.apartment.unitType.uniqueId',
        foreignField: '_id',
        as: 'apartment.unit.unitType',
      },
    },
    {
      $unwind: {
        path: '$apartment.unit.unitType',
      },
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        localField: 'apartment.unit.apartment.complex.uniqueId',
        foreignField: '_id',
        as: 'apartment.complex',
      },
    },
    {
      $unwind: {
        path: '$apartment.complex',
      },
    },
    {
      $lookup: {
        from: 'USER',
        localField: 'apartment.unit.resident.uniqueId',
        foreignField: '_id',
        as: 'apartment.resident',
      },
    },
    {
      $unwind: {
        path: '$apartment.resident',
      },
    },
    {
      $lookup: {
        from: 'PARTNER',
        localField: 'assignedTo.partner.uniqueId',
        foreignField: '_id',
        as: 'assignedTo.partner',
      },
    },
    {
      $unwind: {
        path: '$assignedTo.partner',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        uniqueId: '$_id',
        'apartment.unit.dong': 1,
        'apartment.unit.ho': 1,
        'apartment.unit.uniqueId': '$apartment.unit._id',
        'apartment.unit.unitType.uniqueId': '$apartment.unitType._id',
        'apartment.unit.unitType.viewer': 1,
        'apartment.complex.uniqueId': '$apartment.complex._id',
        'apartment.complex.name': '$apartment.complex.name',
        'apartment.complex.external3DViewer': '$apartment.complex.external3DViewer',
        'apartment.resident.uniqueId': '$apartment.resident._id',
        'apartment.resident.name': '$apartment.resident.name',
        'apartment.resident.phone': '$apartment.resident.phone',
        'assignedTo.partner.uniqueId': '$assignedTo.partner._id',
        'assignedTo.partner.company': 1,
        coordinate: 1,
        location: 1,
        date: 1,
        _id: 0,
        status: 1,
        work: 1,
        image: 1,
        resident: 1,
      },
    },
    {
      $match: filter,
    },
    {
      $addFields: {
        assignedTo: {
          partner: {
            $cond: {
              if: { $gt: ['$assignedTo.partner', {}] },
              then: '$assignedTo.partner',
              else: null,
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          complex: '$apartment.complex',
          unit: '$apartment.unit',
          resident: '$apartment.resident',
        },
        defects: {
          $push: {
            uniqueId: '$uniqueId',
            location: '$location',
            coordinate: '$coordinate',
            status: '$status',
            work: '$work',
            date: '$date',
            assignedTo: '$assignedTo',
            image: '$image',
          },
        },
      },
    },
    {
      $project: {
        complex: '$_id.complex',
        uniqueId: '$_id.unit.uniqueId',
        dong: '$_id.unit.dong',
        ho: '$_id.unit.ho',
        unitType: '$_id.unit.unitType',
        resident: '$_id.resident',
        _id: 0,
        defects: {
          $sortArray: {
            input: '$defects',
            sortBy: { 'date.requested': -1 },
          },
        },
        // inProgressCount: {
        //   $size: {
        //     $filter: {
        //       input: '$defects',
        //       as: 'defect',
        //       cond: { $in: ['$$defect.status', DEFECT_PARTNER_ADMIN_STATUS.IN_PROGRESS] },
        //     },
        //   },
        // },
        // notProcessedCount: {
        //   $size: {
        //     $filter: {
        //       input: '$defects',
        //       as: 'defect',
        //       cond: { $in: ['$$defect.status', DEFECT_PARTNER_ADMIN_STATUS.NOT_PROCESSED] },
        //     },
        //   },
        // },
      },
    },
    {
      $sort: {
        'complex.name': 1,
        dong: 1,
        ho: 1,
      },
    },
    {
      $skip: (currentPage - 1) * DEFAULT_PAGINATION,
    },
    {
      $limit: DEFAULT_PAGINATION,
    },
  ]);

export const countContractorDefectsDynamicQuery = (contractor: Identifier, filter: any) =>
  Defect.aggregate([
    {
      $match: { 'contractor.uniqueId': toObjectId(contractor.uniqueId) },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        localField: 'apartment.unit.uniqueId',
        foreignField: '_id',
        as: 'apartment.unit',
      },
    },
    {
      $unwind: {
        path: '$apartment.unit',
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT_TYPE',
        localField: 'apartment.unit.apartment.unitType.uniqueId',
        foreignField: '_id',
        as: 'apartment.unit.unitType',
      },
    },
    {
      $unwind: {
        path: '$apartment.unit.unitType',
      },
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        localField: 'apartment.unit.apartment.complex.uniqueId',
        foreignField: '_id',
        as: 'apartment.complex',
      },
    },
    {
      $unwind: {
        path: '$apartment.complex',
      },
    },
    {
      $lookup: {
        from: 'USER',
        localField: 'apartment.unit.resident.uniqueId',
        foreignField: '_id',
        as: 'apartment.resident',
      },
    },
    {
      $unwind: {
        path: '$apartment.resident',
      },
    },
    {
      $lookup: {
        from: 'PARTNER',
        localField: 'assignedTo.partner.uniqueId',
        foreignField: '_id',
        as: 'assignedTo.partner',
      },
    },
    {
      $unwind: {
        path: '$assignedTo.partner',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        uniqueId: '$_id',
        'apartment.unit.dong': 1,
        'apartment.unit.ho': 1,
        'apartment.unit.uniqueId': '$apartment.unit._id',
        'apartment.unit.unitType.uniqueId': '$apartment.unitType._id',
        'apartment.unit.unitType.viewer': 1,
        'apartment.complex.uniqueId': '$apartment.complex._id',
        'apartment.complex.name': '$apartment.complex.name',
        'apartment.complex.external3DViewer': '$apartment.complex.external3DViewer',
        'apartment.resident.uniqueId': '$apartment.resident._id',
        'apartment.resident.name': '$apartment.resident.name',
        'apartment.resident.phone': '$apartment.resident.phone',
        'assignedTo.partner.uniqueId': '$assignedTo.partner._id',
        'assignedTo.partner.company': 1,
        coordinate: 1,
        date: 1,
        location: 1,
        _id: 0,
        status: 1,
        work: 1,
        image: 1,
        resident: 1,
      },
    },
    {
      $match: filter,
    },
    {
      $addFields: {
        assignedTo: {
          partner: {
            $cond: {
              if: { $gt: ['$assignedTo.partner', {}] },
              then: '$assignedTo.partner',
              else: null,
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          complex: '$apartment.complex',
          unit: '$apartment.unit',
          resident: '$apartment.resident',
        },
      },
    },
    {
      $count: 'totalCount',
    },
  ]);
