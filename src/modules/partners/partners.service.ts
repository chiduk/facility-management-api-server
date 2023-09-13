import { Aggregate } from 'mongoose';
import { Defect, defectService, defectConstant } from '../defect';
import { User, userService } from '../user';
import Partner from './partners.model';
import { IFilterDefect } from '@/modules/partners/partners.interface';
import { contractorPartnerService } from '../contractor_partner';
import { notificationService } from '../notification';
import { noticeService } from '../notice';
import { ApiError } from '../errors';
import { toObjectId, httpStatus, fcmService } from '../utils';
import { ApartmentQuery, DefectQuery, Identifier } from '@/modules/common/common.interfaces';
import { apartmentUnitService } from '../apartmentUnit';
import { CreateNotificationDto, NotificationTypeEnum } from '../notification/notification.interface';
import { IDefectDoc } from '@/modules/defect/defect.interface';
import { FindEmployeesByPartner, IUserPartnerDoc, PartnerDefectResult } from './partners.types';
import { residentPushMessages, TypePushMessage } from '../common/common.push.messages';
import { IPushMessage } from '../utils/fcm';
import { deviceTokenService } from '../deviceToken';
import { logger } from '../logger';
import { DEFAULT_PAGINATION } from '../common/common.constants';
import { IUserDoc } from '@/modules/user/user.interfaces';

const { DEFECT_PARTNER_ADMIN_STATUS, DEFECT_PARTNER_ENGINEER_STATUS, DefectStatus } = defectConstant;
const { sendPushToFCM } = fcmService;

export const createPartner = async (createPartnerDto: any) => {
  // check if partner exist
  const isExist = await Partner.findOne({
    company: createPartnerDto.company,
  });
  if (isExist) throw new ApiError(httpStatus.CONFLICT, '해당 협력사가 이미 존재합니다.');

  const createdContractor = await Partner.create(createPartnerDto);
  return createdContractor;
};

export const checkIfPartnerMatches = (user: IUserDoc, partner: Identifier) => {
  if (!user.partner.uniqueId || !user.partner.uniqueId.equals(partner.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인가 정보 불일치');
};

export const repairDefect = async (defect: Identifier, engineer: Identifier, file: Express.Multer.File) => {
  const foundDefect = await Defect.findOne({
    _id: toObjectId(defect.uniqueId),
    'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
  });
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '해당 업무를 찾을 수 없습니다.');

  foundDefect.image.repaired = file.filename;
  foundDefect.status = DefectStatus.REPAIRED;
  foundDefect.date.repaired = new Date();
  await foundDefect.save();
};

export const findEmployeesByPartner = (partner: Identifier): Aggregate<Array<FindEmployeesByPartner>> =>
  User.aggregate([
    {
      $match: {
        'partner.uniqueId': toObjectId(partner.uniqueId),
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        employee: 1,
        phone: 1,
        name: 1,
        email: 1,
        role: 1,
      },
    },
  ]);

export const findPartnerDefectsByDynamicQuery = (partner: Identifier): Aggregate<Array<PartnerDefectResult>> =>
  Defect.aggregate([
    {
      $match: { 'assignedTo.partner.uniqueId': toObjectId(partner.uniqueId) },
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
        from: 'USER',
        localField: 'assignedTo.partner.engineer.uniqueId',
        foreignField: '_id',
        as: 'assignedTo.partner.engineer',
      },
    },
    {
      $unwind: {
        path: '$assignedTo.partner.engineer',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        'apartment.unit.apartment': 0,
        'apartment.unit.resident': 0,
        'apartment.unit.__v': 0,
        'apartment.unit.createdAt': 0,
        'apartment.unit.updatedAt': 0,
        'apartment.complex.contractor': 0,
        'apartment.complex.__v': 0,
        'apartment.complex.createdAt': 0,
        'apartment.complex.updatedAt': 0,
        'assignedTo.partner.engineer.password': 0,
        'assignedTo.partner.engineer.__v': 0,
        'assignedTo.partner.engineer.createdAt': 0,
        'assignedTo.partner.engineer.updatedAt': 0,
        'assignedTo.partner.engineer.partner': 0,
        'assignedTo.partner.engineer.email': 0,
        'image._id': 0,
        resident: 0,
        date: 0,
        contractor: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        'apartment.unit.dong': 1,
        'apartment.unit.ho': 1,
        'apartment.unit.uniqueId': '$apartment.unit._id',
        'apartment.complex.uniqueId': '$apartment.complex._id',
        // 'apartment.complex.address': '$apartment.complex.address',
        'apartment.complex.name': '$apartment.complex.name',
        'apartment.complex.external3DViewer': '$apartment.complex.external3DViewer',
        'apartment.resident.uniqueId': '$apartment.resident._id',
        'apartment.resident.name': '$apartment.resident.name',
        'apartment.resident.phone': '$apartment.resident.phone',
        'assignedTo.partner.engineer.uniqueId': '$assignedTo.partner.engineer._id',
        'assignedTo.partner.engineer.name': 1,
        'assignedTo.partner.engineer.email': 1,
        'assignedTo.partner.engineer.employee.code': 1,
        // 'assignedTo.partner.engineer.role': 1,
        // 'assignedTo.partner.engineer.type': 1,
        date: 1,
        coordinate: 1,
        location: 1,
        _id: 0,
        status: 1,
        work: 1,
        image: 1,
        resident: 1,
      },
    },
    {
      $addFields: {
        assignedTo: {
          partner: {
            engineer: {
              $cond: {
                if: { $gt: ['$assignedTo.partner.engineer', {}] },
                then: '$assignedTo.partner.engineer',
                else: null,
              },
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
            resident: '$resident',
          },
        },
      },
    },
    {
      $project: {
        // apartment: '$_id',
        complex: '$_id.complex',
        unit: '$_id.unit',
        resident: '$_id.resident',
        _id: 0,
        defects: {
          $sortArray: {
            input: '$defects',
            sortBy: { 'date.requested': -1 },
          },
        },
        inProgressCount: {
          $size: {
            $filter: {
              input: '$defects',
              as: 'defect',
              cond: { $in: ['$$defect.status', DEFECT_PARTNER_ADMIN_STATUS.IN_PROGRESS] },
            },
          },
        },
        notProcessedCount: {
          $size: {
            $filter: {
              input: '$defects',
              as: 'defect',
              cond: { $in: ['$$defect.status', DEFECT_PARTNER_ADMIN_STATUS.NOT_PROCESSED] },
            },
          },
        },
      },
    },
    {
      $sort: {
        'complex.name': 1,
        'unit.dong': 1,
        'unit.ho': 1,
      },
    },
  ]);

export const checkIfValidDefect = async (partner: Identifier, defect: Identifier) => {
  const foundDefect = await Defect.findById(toObjectId(defect.uniqueId));
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '존재하지 않는 데이터입니다.');
  if (!foundDefect.assignedTo.partner.uniqueId.equals(partner.uniqueId))
    throw new ApiError(httpStatus.UNAUTHORIZED, '권한이 없습니다.');
  return foundDefect;
};

export const assignDefectToEngineer = (defect: Identifier, engineer: Identifier) =>
  Defect.updateOne(
    {
      _id: toObjectId(defect.uniqueId),
    },
    {
      $set: {
        'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
        status: 'SCHEDULED',
      },
    }
  );

export const getAssignedApartments = (engineer: Identifier) =>
  Defect.aggregate([
    {
      $match: {
        'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
        status: {
          $in: DEFECT_PARTNER_ENGINEER_STATUS.NOT_PROCESSED,
        },
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        foreignField: '_id',
        as: 'apartment.unit',
        localField: 'apartment.unit.uniqueId',
      },
    },
    {
      $unwind: '$apartment.unit',
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        foreignField: '_id',
        as: 'apartment.complex',
        localField: 'apartment.unit.apartment.complex.uniqueId',
      },
    },
    {
      $unwind: '$apartment.complex',
    },
    {
      $group: {
        _id: {
          uniqueId: '$apartment.complex._id',
          address: '$apartment.complex.address',
          name: '$apartment.complex.name',
        },
        scheduledCount: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id.uniqueId',
        address: '$_id.address',
        name: '$_id.name',
        scheduledCount: 1,
      },
    },
  ]);

export const findDefectsGroupByDongHo = (engineer: Identifier, apartment: ApartmentQuery) =>
  Defect.aggregate([
    {
      $match: {
        'assignedTo.partner.engineer.uniqueId': toObjectId(engineer.uniqueId),
        status: {
          $in: ['SCHEDULED'],
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
      $match: {
        'apartment.unit.apartment.complex.uniqueId': toObjectId(apartment.complex.uniqueId),
      },
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
            assignedTo: '$assignedTo',
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
        _id: '$unit.ho',
        dong: { $first: '$unit.dong' },
        defects: { $first: '$defects' },
      },
    },
    {
      $project: {
        ho: '$_id',
        _id: 0,
        dong: 1,
        defects: 1,
        notProcessedCount: {
          $size: '$defects',
        },
      },
    },
    {
      $group: {
        _id: '$dong',
        units: {
          $push: {
            ho: '$ho',
            hoNotProcessedCount: '$notProcessedCount',
            defects: '$defects',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        dong: '$_id',
        units: 1,
        dongNotProcessedCount: {
          $sum: '$units.hoNotProcessedCount',
        },
      },
    },
  ]);

export const getAllTasksOfOneComplexService = async (engineer: Identifier, apartment: ApartmentQuery) => {
  const filter: any = {};
  filter['apartment.unit.apartment.complex.uniqueId'] = toObjectId(apartment.complex.uniqueId);
  if (apartment.unit?.dongs?.length) filter['apartment.unit.dong'] = { $in: apartment.unit.dongs };
  if (apartment?.unit?.hos?.length)
    filter['apartment.unit.ho'] = {
      $in: apartment.unit.hos.map((ho: string) => parseInt(ho, 10)).filter((ho: number) => !Number.isNaN(ho)),
    };

  const tasks = await defectService.findEngineerTasksOfOneComplex(engineer, filter);
  return tasks;
};

export const findDefectByIdAndAssignee = async (defect: Identifier, engineer: Identifier) => {
  const foundDefect = await defectService.findDefectByIdAndAssigneeEngineer(defect, engineer);
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '하자를 찾을 수 없습니다');
  return foundDefect;
};

export const rejectAssignedDefect = async (partner: Identifier, defect: Identifier) => {
  const foundDefect = await defectService.findDefectByIdAndAssigneePartner(partner, defect);
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '해당 하자에 대한 권한이 없거나, 데이터를 찾을 수 없습니다.');

  if (!DEFECT_PARTNER_ADMIN_STATUS.REJECT_AVAILABLE?.includes(foundDefect.status))
    throw new ApiError(httpStatus.FORBIDDEN, '해당 업무는 반려할 수 없습니다.');

  foundDefect.status = DefectStatus.REJECTED;
  await foundDefect.save();
};

export const getAllTasksDynamicService = (engineer: Identifier, apartment: ApartmentQuery) => {
  const query: IFilterDefect = {};

  if (apartment?.complex?.uniqueIds) {
    const uniqueIdArray = apartment.complex.uniqueIds.map((uniqueId) => toObjectId(uniqueId));
    query['apartment.complex.uniqueId'] = {
      $in: uniqueIdArray,
    };
  }
  // query['apartment.complex.uniqueId'] = toObjectId(apartment.complex.uniqueId);
  if (apartment?.unit?.dongs)
    query['apartment.unit.dong'] = {
      $in: apartment.unit.dongs,
    };
  if (apartment?.unit?.hos)
    query['apartment.unit.ho'] = {
      $in: apartment.unit.hos.map((ho: string) => parseInt(ho, 10)).filter((ho: number) => !Number.isNaN(ho)),
    };

  const defects = defectService.findDefectsByEngineerMultiFilter(engineer, query);
  return defects;
};

export const rejectAssignedTask = async (defect: Identifier, reason: string, engineer: Identifier) => {
  const foundDefect = await defectService.findDefectByIdAndEngineer(defect, engineer);
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '해당 하자를 찾을 수 없습니다.');
  if (foundDefect.status !== DefectStatus.SCHEDULED)
    throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, '반려가 불가능합니다.');

  foundDefect.status = DefectStatus.REJECTED;
  foundDefect.rejected.reason = reason;

  await foundDefect.save();
};

export const findComplexesByName = async (partner: Identifier, apartment: ApartmentQuery) => {
  const filter: any = {};
  if (apartment?.complex?.name) filter.name = { $regex: new RegExp(apartment.complex.name, 'i') };
  const complexes = await contractorPartnerService.findPartnerManagingComplexByName(partner, filter);
  return complexes;
};

export const findDongsByComplex = async (apartment: ApartmentQuery) => {
  return (await apartmentUnitService.findDongByComplex(apartment)).map((dong) => dong.dong).sort();
};

export const findHosByComplexFilter = async (apartment: ApartmentQuery) => {
  const filter: any = {};
  filter['apartment.complex.uniqueId'] = toObjectId(apartment.complex.uniqueId);
  if (apartment?.unit?.dongs) filter.dong = { $in: apartment.unit.dongs };

  return (await apartmentUnitService.findHosByComplexFilter(filter)).map((ho) => ho.ho).sort();
};

export const createResidentNotification = async (defect: IDefectDoc) => {
  const createNotificationDto: CreateNotificationDto = {
    user: {
      uniqueId: defect.resident.uniqueId,
    },
    defect: {
      uniqueId: defect._id,
      apartment: defect.apartment,
      location: defect.location,
      status: defect.status,
      image: defect.image,
      date: defect.date,
      work: defect.work,
      coordinate: defect.coordinate,
    },
    message: notificationService.residentNotificationTemplate(defect),
    thumbnail: defect.image.requested,
    type: NotificationTypeEnum.RESIDENT,
    isRead: false,
  };

  await notificationService.createNotification(createNotificationDto);
};

export const findDefectAndCreateNotification = async (defect: DefectQuery) => {
  const foundDefect = await defectService.findDefectById(defect);
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '하자를 찾을 수 업습니다.');
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
      date: foundDefect.date,
      work: foundDefect.work,
      coordinate: foundDefect.coordinate,
    },
    message: notificationService.residentNotificationTemplate(foundDefect),
    thumbnail: foundDefect.image.requested,
    type: NotificationTypeEnum.RESIDENT,
    isRead: false,
  };
  await notificationService.createNotification(createNotificationDto);

  return foundDefect;
};

/**
 * 하자에서 User 식별
 * user와 메세지 결정
 * fcm 서비스 호출
 */
export const sendPushNotificationToResident = async (defect: IDefectDoc, type: keyof TypePushMessage) => {
  const resident = await userService.getUserById(defect.resident.uniqueId);
  if (!resident || !resident.isReceivePush) return;

  const deviceToken = await deviceTokenService.findDeviceTokenByUserId(resident._id);
  if (!deviceToken) {
    // 기기 토큰을 못 찾은 경우, 로깅
    logger.error(`[user.uniqueId: ${resident._id}] 푸시알림 전송 실패`);
    return;
  }
  const message: IPushMessage = {
    notification: residentPushMessages[`${type}`],
    token: deviceToken.token,
  };
  await sendPushToFCM(message);
};

/**
 * @description
 * 협력사에게 할당되는 공지사항 조회
 * 1. 평행공간이 쓴 것 -> contractor.uniqueId = null
 * 2. 시공사가 쓴 것 -> contractor_partner 컬렉션 조회 -> 해당 시공사들이 쓴 것들 다 조회
 */
export const getNoticesByPartnerPagination = async (user: IUserPartnerDoc, currentPage: number) => {
  const associations = await contractorPartnerService.findAssociationsByPartnerId(user.partner.uniqueId);
  // 관계 컬렉션 조회, contractor.uniqueId 추출, 중복 제거, 배열로 변환
  const contractorIds = [...new Set(associations.map((association) => association.contractor.uniqueId))];

  const [notices, totalCount] = await Promise.all([
    noticeService.readPartnerNotices(contractorIds, currentPage),
    noticeService.countPartnerNotices(contractorIds),
  ]);
  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);
  return { notices, totalPage };
};
