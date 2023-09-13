import httpStatus from 'http-status';
import * as contractorService from './contractors.service';
import { defectConstant } from '../defect';
import { inquiryService } from '../inquiry';
import { apartmentComplexService } from '../apartmentComplex';
import { apartmentUnitService } from '../apartmentUnit';

import {
  IAssignDuty,
  ICreateContractorComplex,
  ICreateContractorInquiry,
  ICreatePartnership,
  IDeleteContractorComplex,
  IDeleteContractorUnitType,
  IDeleteDuty,
  IDeletePartnership,
  IDeleteSpecificUnit,
  IGetApartmentComplexes,
  IGetApartmentDongs,
  IGetApartmentHos,
  IGetContractorComplexes,
  IGetContractorDefects,
  IGetContractorDuty,
  IGetContractorInquiries,
  IGetContractorPspaceInquiry,
  IGetContractorTypes,
  IGetContractorUnits,
  IGetDashboardDashboardStatistics,
  IGetDashboardTasks,
  IGetPartnerManagingUnits,
  IGetPartners,
  IGetResidents,
  IGetSpecificUnit,
  IGetUnits,
  IGetWorks,
  IPatchContractorInquiry,
  IPostContractorType,
  IPostContractorUnit,
  IPostWork,
  IPostWorkDetail,
  IUpdateContractorComplex,
  IUpdateContractorUnitType,
  IUpdateSpecificUnit,
} from './contractor.interface';
import { Identifier, IResponse } from '@/modules/common/common.interfaces';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import { CreateComplexDto, UpdateComplexDto } from '@/modules/apartmentComplex/apartmentComplex.interface';
import { toObjectId } from '../utils';

export const getDashboardDashboardStatistics = catchAsync(async (req: IGetDashboardDashboardStatistics, res: IResponse) => {
  const {
    user,
    query: { contractor, currentPage },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;

  const result = await contractorService.findDefectsStatistics(contractor, defaultCurrentPage);

  return res.status(httpStatus.OK).json(result);
});

export const getResidents = async (req: IGetResidents, res: IResponse) => {
  /**
   * TODO
   * 로그인 한 사람이 시공사 관리자인지 확인
   * 인가 미들웨어 추가 필요
   */
  const { contractor } = req.query;
  const residents = await contractorService.findResidents(contractor);

  return res.status(httpStatus.OK).json({ residents });
};

export const getPartners = async (req: IGetPartners, res: IResponse) => {
  const {
    user,
    query: { contractor, currentPage },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;

  const partners = await contractorService.findPartnersByContractor(contractor, defaultCurrentPage);

  return res.status(httpStatus.OK).json({ partners });
};

/**
 * @description
 * 시공사 백오피스 - 드랍다운 단지 선택지 보여주는 API
 * A 단지는 1동, 2동, 3동
 * B 단지는 1동, 2동, 3동, 4동, 5동
 */
export const getDropdownComplex = async (req: IGetApartmentComplexes, res: IResponse) => {
  const { contractor, apartment } = req.query;
  const complexes = await contractorService.findContractorComplexesFilter(contractor, apartment);
  return res.status(httpStatus.OK).json({ complexes });
};

/**
 * @description 시공사 백오피스 - 단지를 선택하면 해당 단지의 동을 보여주는 API
 */
export const getDropdownDong = async (req: IGetApartmentDongs, res: IResponse) => {
  const { apartment } = req.query;
  const dongs = await contractorService.findDongs(apartment);
  return res.status(httpStatus.OK).json({ dongs });
};

export const getDropdownHo = async (req: IGetApartmentHos, res: IResponse) => {
  const { apartment } = req.query;
  const hos = await contractorService.findContractorHosFilter(apartment);
  return res.status(httpStatus.OK).json({ hos });
};

/**
 * @description 단지, 동, 호가 식별된 뒤, 공종 업무를 할당하는 api
 */
export const assignDuty = async (req: IAssignDuty, res: IResponse) => {
  const { apartment, contractor, partner } = req.query;
  const { works } = req.body;

  const unit = await contractorService.findUnitByComplexDongHo(apartment);
  /**
   * TODO
   * check if partner, contractor exist
   * 해당 unit에 같은 공종으로 등록이 되어있으면 안되는데?
   */
  apartment.unit.uniqueId = unit._id;

  await contractorService.checkIfAssignDutyAvailable(works, contractor, partner, apartment);
  await contractorService.createContractorPartnerDuty(works, contractor, partner, apartment);
  return res.status(httpStatus.OK).json('ok');
};

export const getWorks = catchAsync(async (req: IGetWorks, res: IResponse) => {
  const { contractor } = req.query;
  const works = await contractorService.findWorksByContractorId(contractor);
  return res.status(httpStatus.OK).json(works);
});

/**
 * @description 시공사 백오피스 - 유닛 전체 조회
 * 단지 정보, 동 호수, 타입 전부 필요
 */
export const getUnits = async (req: IGetUnits, res: IResponse) => {
  const { contractor } = req.query;
  const units = await contractorService.findAllUnits(contractor);

  return res.status(httpStatus.OK).json({ units });
};

/**
 * @description 특정 협력사가 관리 중인 유닛 리스트 조회
 */
export const getPartnerManagingUnits = async (req: IGetPartnerManagingUnits, res: IResponse): Promise<IResponse> => {
  const { contractor, partner } = req.query;
  const units = await contractorService.findPartnerManagingUnits(contractor, partner);
  return res.status(httpStatus.OK).json({ units });
};

/**
 * @description 공종 추가하기
 */
export const postWork = async (req: IPostWork, res: IResponse) => {
  const {
    query: { contractor },
    body: { work },
  } = req;

  await contractorService.createWork(contractor, work);
  return res.status(httpStatus.OK).json('ok');
};

/**
 * @description 공종 상세 내용 추가
 * 배열 push
 */
export const postWorkDetail = async (req: IPostWorkDetail, res: IResponse) => {
  const {
    query: { contractor },
    body: { work },
  } = req;

  await contractorService.addWorkDetail(contractor, work);

  return res.status(httpStatus.OK).json('ok');
};

export const createContractorInquiry = catchAsync(async (req: ICreateContractorInquiry, res: IResponse) => {
  const { inquiry } = req.body;
  const { user } = req;

  await inquiryService.createInquiry(inquiry, user);
  return res.status(httpStatus.OK).json('ok');
});

/**
 * 시공사가 자기네 회사로 들어온 문의 조회
 */
export const getContractorInquiries = catchAsync(async (req: IGetContractorInquiries, res: IResponse) => {
  const { contractor } = req.query;

  const inquiries = await inquiryService.getContractorInquiries(contractor);

  return res.status(httpStatus.OK).json({ inquiries });
});

/**
 * 시공사가 자기 회사로 들어온 문의 답변
 */
export const patchContractorInquiry = catchAsync(async (req: IPatchContractorInquiry, res: IResponse) => {
  const { contractor, inquiry } = req.query;
  const {
    inquiry: { answer },
  } = req.body;

  await inquiryService.answerContractorInquiry(contractor, inquiry, answer);

  return res.status(httpStatus.OK).json('ok');
});

export const getContractorPspaceInquiry = catchAsync(async (req: IGetContractorPspaceInquiry, res: IResponse) => {
  const { contractor } = req.query;

  const inquiries = await inquiryService.getContractorPspaceInquiries(contractor);

  return res.status(httpStatus.OK).json({ inquiries });
});

/**
 * @description
 * 시공사 대시보드 - 관리자가 주목해야 할 업무 조회
 */
export const getDashboardTasks = catchAsync(async (req: IGetDashboardTasks, res: IResponse) => {
  const {
    user,
    query: { contractor, currentPage },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;

  const result = await contractorService.findCriticalTasks(contractor, defaultCurrentPage);

  return res.status(httpStatus.OK).json(result);
});

export const getContractorComplexes = catchAsync(async (req: IGetContractorComplexes, res: IResponse) => {
  const {
    user,
    query: { contractor, currentPage },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;

  const result = await contractorService.findComplexesByContractorPagination(contractor, defaultCurrentPage);

  return res.status(httpStatus.OK).json(result);
});

export const createContractorComplex = catchAsync(async (req: ICreateContractorComplex, res: IResponse) => {
  const {
    user,
    query: { contractor },
    body: {
      complex: { name, address },
    },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const foundComplex = await apartmentComplexService.checkComplexNameDuplication(name);
  if (foundComplex) throw new ApiError(httpStatus.CONFLICT, '이미 해당 아파트 단지가 존재합니다.');

  const createComplexDto: CreateComplexDto = {
    name,
    address,
    contractor: {
      uniqueId: toObjectId(contractor.uniqueId),
    },
  };

  await apartmentComplexService.createComplex(createComplexDto);
  return res.status(httpStatus.OK).json('ok');
});

export const updateContractorComplex = catchAsync(async (req: IUpdateContractorComplex, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { complex },
    },
  } = req;
  const updateComplexBody = req.body.complex;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const updateComplexDto: UpdateComplexDto = { ...updateComplexBody };
  await apartmentComplexService.updateComplex(contractor, complex as Identifier, updateComplexDto);

  return res.status(httpStatus.OK).json('ok');
});

export const deleteContractorComplex = catchAsync(async (req: IDeleteContractorComplex, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { complex },
    },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await apartmentComplexService.deleteComplex(contractor, complex as Identifier);
  return res.status(httpStatus.OK).json('ok');
});

export const getContractorUnits = catchAsync(async (req: IGetContractorUnits, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { complex },
      currentPage,
    },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;

  const result = await contractorService.findUnitsByComplexPagination(contractor, complex, defaultCurrentPage);

  return res.status(httpStatus.OK).json(result);
});

export const getContractorTypes = catchAsync(async (req: IGetContractorTypes, res: IResponse) => {
  const {
    user,
    query: { contractor, apartment, currentPage },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;

  const result = await contractorService.findContractorComplexTypes(contractor, apartment.complex, defaultCurrentPage);

  return res.status(httpStatus.OK).json(result);
});

export const postContractorUnitType = catchAsync(async (req: IPostContractorType, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { complex },
    },
    body: { unitType },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.createComplexUnitType(contractor, complex, unitType);

  return res.status(httpStatus.OK).json('ok');
});

export const updateContractorUnitType = catchAsync(async (req: IUpdateContractorUnitType, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { unitType },
    },
    body: { updateUnitTypeBody },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.updateComplexUnitType(unitType, updateUnitTypeBody);

  return res.status(httpStatus.OK).json('ok');
});

export const deleteContractorUnitType = catchAsync(async (req: IDeleteContractorUnitType, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { complex, unitType },
    },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.deleteContractorUnitType(complex, unitType);

  return res.status(httpStatus.OK).json('ok');
});

/**
 * @description
 * 검증
 * complex - contractor 일치 여부
 * unitType - complex 일치 여부
 */
export const postContractorUnit = catchAsync(async (req: IPostContractorUnit, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { unitType, complex },
    },
    body: { createUnitBody },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.checkIfCreateUnitAvailable(contractor, complex, unitType);

  await contractorService.createContractorUnit(complex, unitType, createUnitBody);

  return res.status(httpStatus.OK).json('ok');
});

export const getSpecificUnit = catchAsync(async (req: IGetSpecificUnit, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { unit },
    },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const foundUnit = await apartmentUnitService.findSpecificUnitById(unit);
  return res.status(httpStatus.OK).json({ unit: foundUnit });
});

export const updateSpecificUnit = catchAsync(async (req: IUpdateSpecificUnit, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { unit },
    },
    body: { updateUnitBody },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.updateSpecificUnit(unit, updateUnitBody);

  return res.status(httpStatus.OK).json('ok');
});

export const deleteSpecificUnit = catchAsync(async (req: IDeleteSpecificUnit, res: IResponse) => {
  const {
    user,
    query: {
      contractor,
      apartment: { unit },
    },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.deleteSpecificUnit(unit);

  return res.status(httpStatus.OK).json('ok');
});

export const createPartnership = catchAsync(async (req: ICreatePartnership, res: IResponse) => {
  const {
    user,
    query: { contractor, partner },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.checkIfPartnershipExist(contractor, partner);
  await contractorService.createPartnership;
  return res.status(httpStatus.OK).json('ok');
});

export const getContractorDefects = catchAsync(async (req: IGetContractorDefects, res: IResponse) => {
  const {
    user,
    query: { contractor, apartment, currentPage, defect, date },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const defaultCurrentPage = Number(currentPage) || 1;
  const result = await contractorService.findContractorDefectsDynamicQuery(
    contractor,
    apartment,
    defect,
    date,
    defaultCurrentPage
  );

  return res.status(httpStatus.OK).json(result);
});

export const deletePartnership = catchAsync(async (req: IDeletePartnership, res: IResponse) => {
  const {
    user,
    query: { contractor, partner },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.deleteContractorPartnership(contractor, partner);

  return res.status(httpStatus.OK).json('ok');
});

export const deleteContractorDuty = catchAsync(async (req: IDeleteDuty, res: IResponse) => {
  const {
    user,
    query: { contractor, duty },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  await contractorService.deleteDuty(contractor, duty);
  return res.status(httpStatus.OK).json('ok');
});

export const getContractorDuty = catchAsync(async (req: IGetContractorDuty, res: IResponse) => {
  const {
    user,
    query: { contractor, duty },
  } = req;

  if (!user.contractor.uniqueId?.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '인증 정보가 일치하지 않습니다.');

  const foundDuty = await contractorService.findContractorDuty(contractor, duty);
  return res.status(httpStatus.OK).json(foundDuty);
});

/**
 * @description
 * PARTNER_NOT_ASSIGNED > PARTNER_ASSIGNED
 * SCHEDULED > PARTNER_ASSIGNED
 *
 * PARTNER_ASSIGNED > PARTNER_NOT_ASSIGNED
 *
 * PARTNER_ASSIGNED > SCHEDULED
 * REPAIRED > SCHEDULED
 *
 * PARTNER_ASSIGNED > REJECTED
 *
 * SCHEDULED > REPAIRED
 * CONFIRM > REPAIRED
 *
 * REPARIED > CONFIRMED
 */
export const forceUpdateDefectStatus = catchAsync(async (req: any, res: IResponse) => {
  const {
    params: { status },
  } = req;

  switch (status) {
    case defectConstant.DefectStatus.PARTNER_NOT_ASSIGNED:
      break;
    case defectConstant.DefectStatus.PARTNER_ASSIGNED:
      break;
    case defectConstant.DefectStatus.SCHEDULED:
      break;
    case defectConstant.DefectStatus.REPAIRED:
      break;
    case defectConstant.DefectStatus.REJECTED:
      break;
    case defectConstant.DefectStatus.CONFIRMED:
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, '올바르지 않은 요청입니다.');
  }
  return res.status(httpStatus.OK).json('ok');
});
