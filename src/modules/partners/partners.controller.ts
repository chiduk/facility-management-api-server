import { httpStatus } from '../utils';
import * as partnersService from './partners.service';
import ApiError from '../errors/ApiError';
import {
  IRepairDefect,
  IGetPartnerEmployees,
  IAssignTask,
  IGetPartnerDefects,
  IGetEngineerDefectsByComplex,
  IGetAllTaskOfOneComplex,
  IGetSpecificDefect,
  IPatchDefectReject,
  IGetAllTasksDynamic,
  IGetAssignedApartments,
  IRejectTask,
  IGetComplexesByName,
  IGetDongsByComplex,
  IGetHosByComplex,
  ICreatePartnerEmployee,
  IDeletePartnerEmployee,
  IUpdatePartnerEmployee,
} from '@/modules/partners/partners.interface';
import { IResponse } from '../common/common.interfaces';
import { DefectStatus } from '../defect/defect.constant';
import catchAsync from '../utils/catchAsync';
import {
  IGetAllTaskByUnit,
  IGetDashboardNotice,
  IGetDefectStatistics,
  IGetPartnerContractors,
  IGetPartnerEmployeeEngineers,
  IGetPartnerInquiries,
  IPostResidentInquiry,
} from '../residents/residents.interfaces';
import * as contractorPartnerService from '../contractor_partner/contractor_partner.service';
import * as inquiryService from '../inquiry/inquiry.service';
import * as defectService from '../defect/defects.service';
import { IUserPartnerDoc } from '@/modules/partners/partners.types';
import * as userService from '../user/user.service';

/**
 * @description
 * defect.uniqueId, assignedTo.partner.engineer.uniqueId 로 하자를 찾는다.
 * 찾은 하자의 데이터를 변경한다.
 */
export const repairDefect = async (req: IRepairDefect, res: IResponse) => {
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, '사진을 찍어주세요');
  const { defect } = req.query;
  const engineer = {
    uniqueId: req.user._id,
  };
  await partnersService.repairDefect(defect, engineer, req.file);
  const foundDefect = await partnersService.findDefectAndCreateNotification(defect);

  res.status(httpStatus.OK).json('ok');

  // 응답에 영향을 줘서는 안되는 로직들
  await partnersService.sendPushNotificationToResident(foundDefect, 'REPAIR_DEFECT');
};

/**
 * @description
 * 협력사가 해당 회사 직원 전체 조회
 */
export const getPartnerEmployees = async (req: IGetPartnerEmployees, res: IResponse) => {
  const { partner } = req.query;
  const employees = await partnersService.findEmployeesByPartner(partner);
  return res.status(httpStatus.OK).json({ employees });
};

/**
 * @description
 * 백오피스에서 협력사 관리자가 직원 추가
 */
export const createPartnerEmployee = catchAsync(async (req: ICreatePartnerEmployee, res: IResponse) => {
  const {
    user,
    body,
    query: { partner },
  } = req;

  if (!user.partner.uniqueId?.equals(partner.uniqueId)) throw new ApiError(httpStatus.FORBIDDEN, '권한이 없습니다.');

  await userService.createPartnerEmployee(partner, body);

  return res.status(httpStatus.OK).json('ok');
});

/**
 * @description
 * 백오피스에서 협력사 관리자가 직원 삭제
 */
export const deletePartnerEmployee = catchAsync(async (req: IDeletePartnerEmployee, res: IResponse) => {
  const {
    user,
    query: { employee, partner },
  } = req;

  if (!user.partner.uniqueId?.equals(partner.uniqueId)) throw new ApiError(httpStatus.FORBIDDEN, '권한이 없습니다.');

  await userService.deletePartnerEmployee(partner, employee);

  return res.status(httpStatus.OK).json('ok');
});

export const updatePartnerEmployee = catchAsync(async (req: IUpdatePartnerEmployee, res: IResponse) => {
  const {
    user,
    query: { partner, employee },
    body,
  } = req;

  if (!user.partner.uniqueId?.equals(partner.uniqueId)) throw new ApiError(httpStatus.FORBIDDEN, '권한이 없습니다.');

  await userService.findAndUpdatePartnerEmployee(partner, employee, body);
  return res.status(httpStatus.OK).json('ok');
});

export const getPartnerDefects = async (req: IGetPartnerDefects, res: IResponse) => {
  const { partner } = req.query;

  const apartments = await partnersService.findPartnerDefectsByDynamicQuery(partner);
  return res.status(httpStatus.OK).json({ apartments });
};
/**
 * @description 협력사 백오피스 - 협력사 직원이 특정 업무를 기사에게 할당
 */
export const assignTask = async (req: IAssignTask, res: IResponse) => {
  const { defect, partner } = req.query;
  const { engineer } = req.body;

  const foundDefect = await partnersService.checkIfValidDefect(partner, defect);
  await partnersService.assignDefectToEngineer(defect, engineer);

  foundDefect.status = DefectStatus.SCHEDULED;

  await partnersService.createResidentNotification(foundDefect);
  await partnersService.sendPushNotificationToResident(foundDefect, 'ASSIGN_DEFECT');
  return res.status(httpStatus.OK).json('ok');
};

/**
 * @description 기사 아저씨 앱 랜딩 페이지 - 내 업무가 있는 아파트들 리스트 조회
 */
export const getAssignedApartments = async (req: IGetAssignedApartments, res: IResponse) => {
  const engineer = {
    uniqueId: req.user._id,
  };
  const complexes = await partnersService.getAssignedApartments(engineer);
  return res.status(httpStatus.OK).json({ complexes });
};

export const getEngineerDefectsByComplex = async (req: IGetEngineerDefectsByComplex, res: IResponse) => {
  const { apartment } = req.query;
  const engineer = {
    uniqueId: req.user._id,
  };
  const dongs = await partnersService.findDefectsGroupByDongHo(engineer, apartment);
  return res.status(httpStatus.OK).json({ dongs });
};

/**
 * @description
 * 특정 아파트 단지가 선택 되고, 동, 호 필터는 동적으로 변할 때
 */
export const getAllTaskOfOneComplex = async (req: IGetAllTaskOfOneComplex, res: IResponse) => {
  const { apartment } = req.query;
  const engineer = {
    uniqueId: req.user._id,
  };
  const dongs = await partnersService.getAllTasksOfOneComplexService(engineer, apartment);
  return res.status(httpStatus.OK).json({ dongs });
};

/**
 * @description 특정 하자 조회
 */
export const getSpecificDefect = async (req: IGetSpecificDefect, res: IResponse) => {
  const { defect } = req.query;
  const engineer = {
    uniqueId: req.user._id,
  };
  const foundDefect = await partnersService.findDefectByIdAndAssignee(defect, engineer);
  if (foundDefect.length !== 1) throw new ApiError(httpStatus.NOT_FOUND, '하자를 찾을 수 업습니다.');
  return res.status(httpStatus.OK).json({ defect: foundDefect[0] });
};

/**
 * @description 협력사 백오피스 - 협력사 관리자가 자기 회사에 할당된 하자 처리 업무 거절
 */
export const patchDefectReject = async (req: IPatchDefectReject, res: IResponse) => {
  const { partner, defect } = req.query;
  await partnersService.rejectAssignedDefect(partner, defect);
  return res.status(httpStatus.OK).json('ok');
};

/**
 * @description 개선한 V2 api에 lookup 완료 후
 * match stage 추가해서 동적으로 필터링 해야 함.
 */
export const getAllTasksDynamic = async (req: IGetAllTasksDynamic, res: IResponse) => {
  const { apartment } = req.query;
  const engineer = {
    uniqueId: req.user._id,
  };
  const complexes = await partnersService.getAllTasksDynamicService(engineer, apartment);
  return res.status(httpStatus.OK).json({ complexes });
};

export const rejectTask = async (req: IRejectTask, res: IResponse) => {
  const { defect } = req.query;
  const {
    defect: {
      rejected: { reason },
    },
  } = req.body;
  const engineer = {
    uniqueId: req.user._id,
  };

  await partnersService.rejectAssignedTask(defect, reason, engineer);

  return res.status(httpStatus.OK).json('ok');
};

export const getComplexesByName = async (req: IGetComplexesByName, res: IResponse) => {
  const { partner, apartment } = req.query;
  const complexes = await partnersService.findComplexesByName(partner, apartment);

  return res.status(httpStatus.OK).json({ complexes });
};

export const getDongsByComplex = async (req: IGetDongsByComplex, res: IResponse) => {
  const { apartment } = req.query;

  const dongs = await partnersService.findDongsByComplex(apartment);
  return res.status(httpStatus.OK).json({ dongs });
};

export const getHosByComplex = async (req: IGetHosByComplex, res: IResponse) => {
  const { apartment } = req.query;

  const hos = await partnersService.findHosByComplexFilter(apartment);
  return res.status(httpStatus.OK).json({ hos });
};

export const postPartnerInquiry = catchAsync(async (req: IPostResidentInquiry, res: IResponse) => {
  const { inquiry } = req.body;
  const { user } = req;

  await inquiryService.createInquiry(inquiry, user);
  return res.status(httpStatus.OK).json('ok');
});

export const getPartnerContractors = catchAsync(async (req: IGetPartnerContractors, res: IResponse) => {
  const { partner } = req.query;
  const contractors = await contractorPartnerService.findContractorsByPartner(partner);
  return res.status(httpStatus.OK).json({ contractors });
});

export const getPartnerInquiries = catchAsync(async (req: IGetPartnerInquiries, res: IResponse) => {
  const { partner } = req.query;

  const inquiries = await inquiryService.getPartnerInquiries(partner);

  return res.status(httpStatus.OK).json({ inquiries });
});

export const getAllTaskByUnit = catchAsync(async (req: IGetAllTaskByUnit, res: IResponse) => {
  const {
    apartment: { unit },
    partner,
  } = req.query;
  const { user } = req;
  const defects = await defectService.findDefectsByPartnerEngineerUnit(partner, unit, user);

  return res.status(httpStatus.OK).json({ defects });
});

/**
 * @description
 * 협력사 - 백오피스 - 대시보드 - 공지사항 조회
 */
export const getDashboardNotices = catchAsync(async (req: IGetDashboardNotice, res: IResponse) => {
  const {
    user,
    query: { currentPage },
  } = req;

  const defaultCurrentPage = parseInt(currentPage, 10) || 1;

  const notices = await partnersService.getNoticesByPartnerPagination(user as IUserPartnerDoc, defaultCurrentPage);
  return res.status(httpStatus.OK).json(notices);
});

/**
 * @description
 * 협력사 백오피스 - 대시보드 - 하자 통계 조회
 */
export const getDefectStatistics = catchAsync(async (req: IGetDefectStatistics, res: IResponse) => {
  const { user } = req;

  const [defect] = await defectService.calculateDefectCountByStatusPartner(user as IUserPartnerDoc);

  return res.status(httpStatus.OK).json({
    defect,
  });
});

/**
 * @description
 * 협력사 백오피스 - PARTNER_ENGINEER 직원만 조회
 */
export const getPartnerEmployeeEngineers = catchAsync(async (req: IGetPartnerEmployeeEngineers, res: IResponse) => {
  const {
    user,
    query: { currentPage, employee, name, phone, partner },
  } = req;

  await partnersService.checkIfPartnerMatches(user, partner);

  const defaultCurrentPage = Number(currentPage) || 1;

  const filter: any = {};

  if (employee) filter.employee = employee;
  if (name) filter.name = name;
  if (phone) filter.phone = phone;

  const result = await userService.findFilteredEngineers(partner, filter, defaultCurrentPage);

  return res.status(httpStatus.OK).json(result);
});
