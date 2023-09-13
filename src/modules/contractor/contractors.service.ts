import Contractor from './contractor.model';
import { apartmentUnitService, ApartmentUnit } from '../apartmentUnit';
import { apartmentComplexService, ApartmentComplex } from '../apartmentComplex';
import { apartmentUnitTypeService } from '../apartmentUnitType';
import { contractorPartnerService, ContractorPartner } from '../contractor_partner';
import { defectService, defectConstant } from '../defect';
import {
  ContractorDefectStatuses,
  CreateWork,
  CreateWorkDetail,
  DefectRequestedDateRange,
  IFindComplexFilterByName,
} from './contractor.interface';
import { ApiError } from '../errors';
import { toObjectId, httpStatus } from '../utils';
import { ApartmentQuery, Identifier, SpecificApartmentQuery } from '@/modules/common/common.interfaces';
import { CONTRACTOR_STATISTICS_PAGINATION, DEFAULT_PAGINATION } from '../common/common.constants';
import {
  CreateUnitTypeBody,
  CreateUnitTypeDto,
  UpdateUnitTypeBody,
} from '@/modules/apartmentUnitType/apartmentUnitType.interface';
import {
  CreateUnitBody,
  CreateUnitDto,
  UpdateUnitBody,
  UpdateUnitDto,
} from '@/modules/apartmentUnit/apartmentUnit.interface';

const { DEFECT_CONTRACTOR_STATUS } = defectConstant;

export const createContractor = async (createContractorDto: any) => {
  // check if contractor exist
  const isExist = await Contractor.findOne({
    company: createContractorDto.company,
  });
  if (isExist) throw new ApiError(httpStatus.CONFLICT, '해당 시공사는 이미 존재합니다.');

  const createdContractor = await Contractor.create(createContractorDto);
  return createdContractor;
};

export const findComplexesRightJoinUnit = async (contractorId: any) => {
  const complexes = await ApartmentComplex.aggregate([
    {
      $match: {
        'contractor.uniqueId': toObjectId(contractorId),
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT_TYPE',
        localField: '_id',
        foreignField: 'apartment.complex.uniqueId',
        as: 'types',
      },
    },
    {
      $addFields: {
        uniqueId: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    },
  ]);
  return complexes;
};

export const findResidents = async (contractor: Identifier) => apartmentComplexService.findResidentByContractor(contractor);

export const findPartnersByContractor = (contractor: Identifier, currentPage: number) =>
  contractorPartnerService.findPartnerByContractorPartner(contractor, currentPage);

export const findContractorComplexesFilter = async (
  contractor: Identifier,
  apartment: IFindComplexFilterByName | undefined
) => {
  const filter: any = {};

  filter['contractor.uniqueId'] = toObjectId(contractor.uniqueId);

  if (apartment?.complex?.name)
    filter.name = {
      $regex: new RegExp(apartment.complex.name, 'i'),
    };

  const complexes = await ApartmentComplex.aggregate([
    {
      $match: filter,
    },
    {
      $project: {
        uniqueId: '$_id',
        name: 1,
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);
  return complexes;
};

export const findDongs = async (apartment: ApartmentQuery) => {
  const filter: any = {};

  filter['apartment.complex.uniqueId'] = toObjectId(apartment.complex.uniqueId);

  if (apartment.unit?.dong) filter.dong = { $regex: new RegExp(apartment.unit.dong, 'i') };

  const units = await ApartmentUnit.aggregate([
    {
      $match: filter,
    },
    {
      $project: {
        dong: 1,
      },
    },
  ]);

  const dongs = new Set(units.map((unit) => unit.dong));

  return [...dongs].sort();
};

export const findContractorHosFilter = async (apartment: SpecificApartmentQuery) => {
  const filter: any = {};

  filter['apartment.complex.uniqueId'] = toObjectId(apartment.complex.uniqueId);
  if (apartment.unit?.dongs) filter.dong = { $in: apartment.unit.dongs };
  if (apartment.unit?.ho && Number(apartment.unit.ho))
    filter.$expr = {
      $regexMatch: {
        input: {
          $toString: '$ho',
        },
        regex: `${apartment.unit.ho}`,
      },
    };

  const units = await ApartmentUnit.aggregate([
    {
      $match: filter,
    },
  ]);

  const hos = [...new Set(units.map((unit) => unit.ho).sort())];
  return hos;
};

export const createContractorPartnerDuty = (
  works: string[],
  contractor: Identifier,
  partner: Identifier,
  apartment: ApartmentQuery
) =>
  ContractorPartner.create({
    contractor: {
      uniqueId: toObjectId(contractor.uniqueId),
    },
    partner: {
      uniqueId: toObjectId(partner.uniqueId),
    },
    apartment: {
      complex: {
        uniqueId: toObjectId(apartment.complex.uniqueId),
      },
      unit: {
        uniqueId: toObjectId(apartment.unit.uniqueId),
      },
    },
    works,
  });

export const findUnitByComplexDongHo = async (apartment: ApartmentQuery) => {
  const unit = await apartmentUnitService.findUnitByComplexDongHo(apartment);
  if (!unit) throw new ApiError(httpStatus.NOT_FOUND, '해당 아파트 유닛이 존재하지 않습니다.');

  return unit;
};

export const findWorksByContractorId = async (contractor: Identifier) => {
  const [works] = await Contractor.aggregate([
    {
      $match: {
        _id: toObjectId(contractor.uniqueId),
      },
    },
    {
      $project: {
        _id: 0,
        works: 1,
      },
    },
  ]);

  if (!works) throw new ApiError(httpStatus.NOT_FOUND, '시공사 정보 혹은 공종 데이터가 존재하지 않습니다.');
  return works;
};

export const checkIfAssignDutyAvailable = async (
  works: string[],
  contractor: Identifier,
  partner: Identifier,
  apartment: ApartmentQuery
) => {
  const contractorPartner = await ContractorPartner.findOne({
    'contractor.uniqueId': toObjectId(contractor.uniqueId),
    'partner.uniqueId': toObjectId(partner.uniqueId),
    'apartment.complex.uniqueId': toObjectId(apartment.complex.uniqueId),
    'apartment.unit.uniqueId': toObjectId(apartment.unit.uniqueId),
    works: {
      $in: works,
    },
  }).lean();
  if (contractorPartner) throw new ApiError(httpStatus.CONFLICT, '이미 해당 공종으로 등록된 협력업제가 존재합니다.');
};

export const findAllUnits = async (contractor: Identifier) =>
  ApartmentComplex.aggregate([
    {
      $match: {
        'contractor.uniqueId': toObjectId(contractor.uniqueId),
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        foreignField: 'apartment.complex.uniqueId',
        localField: '_id',
        as: 'unit',
      },
    },
    {
      $unwind: '$unit',
    },
    {
      $lookup: {
        from: 'APT_UNIT_TYPE',
        foreignField: '_id',
        localField: 'unit.apartment.unitType.uniqueId',
        as: 'type',
      },
    },
    {
      $unwind: '$type',
    },
    {
      $project: {
        _id: 0,
        complex: {
          uniqueId: '$_id',
          name: '$name',
        },
        unit: {
          uniqueId: '$unit._id',
          dong: '$unit.dong',
          ho: '$unit.ho',
        },
        type: {
          uniqueId: '$type._id',
          name: '$type.name',
        },
      },
    },
  ]);

export const findPartnerManagingUnits = async (contractor: Identifier, partner: Identifier): Promise<object> =>
  contractorPartnerService.findPartnerManagingUnits(contractor, partner);

export const createWork = async (contractor: Identifier, work: CreateWork): Promise<void> => {
  /**
   * 시공사 id 조회 후 공종 배열 탐색 -> 해당 공종이 이미 있으면 에러
   * 없으면 배열에 객체 형식으로 추가
   */
  const foundContractor = await Contractor.findOne({
    _id: toObjectId(contractor.uniqueId),
  });
  if (!foundContractor) throw new ApiError(httpStatus.NOT_FOUND, '시공사가 존재하지 않습니다.');

  const isExist = foundContractor.works.some((element) => element.type === work.type);
  if (isExist) throw new ApiError(httpStatus.CONFLICT, '해당 공종이 이미 존재합니다.');
  foundContractor.works.push({
    type: work.type,
    details: ['기타'],
  });

  await foundContractor.save();
};

/**
 * @description 특정 공종에 대해 상세 내용 추가
 */
export const addWorkDetail = async (contractor: Identifier, work: CreateWorkDetail): Promise<void> => {
  const foundContractor = await Contractor.findOne({
    _id: toObjectId(contractor.uniqueId),
  });
  if (!foundContractor) throw new ApiError(httpStatus.NOT_FOUND, '시공사가 존재하지 않습니다.');

  const foundWork = foundContractor.works.find((workElement) => workElement.type === work.type);
  if (!foundWork) throw new ApiError(httpStatus.NOT_FOUND, '입력하신 공종이 존재하지 않습니다');

  if (foundWork.details.includes(work.detail)) throw new ApiError(httpStatus.CONFLICT, '해당 상세 내용이 이미 존재합니다.');

  await Contractor.updateOne(
    {
      _id: toObjectId(contractor.uniqueId),
    },
    { $push: { 'works.$[elem].details': work.detail } },
    { arrayFilters: [{ 'elem.type': work.type }] }
  );

  await foundContractor.save();
};

export const checkIfContractorExist = async (contractor: Identifier) => {
  const foundContractor = await Contractor.findById(toObjectId(contractor.uniqueId));
  if (!foundContractor) throw new ApiError(httpStatus.NOT_FOUND, '시공사를 찾을 수 업습니다.');
};

export const findDefectsStatistics = async (contractor: Identifier, currentPage: number) => {
  const complexesPromise = apartmentComplexService.defectStatisticsGroupByComplex(contractor, currentPage);
  const totalCountPromise = apartmentComplexService.countComplexesByContractor(contractor);

  const [complexes, totalCount] = await Promise.all([complexesPromise, totalCountPromise]);

  const totalPage = Math.ceil(totalCount / CONTRACTOR_STATISTICS_PAGINATION);

  return { complexes, totalPage };
};

export const findCriticalTasks = async (contractor: Identifier, currentPage: number) => {
  const defectsPromise = defectService.findContractorCriticalDefects(contractor, currentPage);
  const totalCountPromise = defectService.countContractorCriticalDefects(contractor);
  const [defects, totalCount] = await Promise.all([defectsPromise, totalCountPromise]);
  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);
  return { defects, totalPage };
};

export const findComplexesByContractorPagination = async (contractor: Identifier, currentPage: number) => {
  const totalCountPromise = apartmentComplexService.countComplexesByContractor(contractor);
  const complexesPromise = apartmentComplexService.findComplexByContractorPagination(contractor, currentPage);

  const [totalCount, complexes] = await Promise.all([totalCountPromise, complexesPromise]);

  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);

  return { complexes, totalPage };
};

export const findUnitsByComplexPagination = async (contractor: Identifier, complex: Identifier, currentPage: number) => {
  const foundComplex = await apartmentComplexService.findComplexById(complex);

  if (!foundComplex || !foundComplex.contractor.uniqueId.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '존재하지 않는 아파트 단지입니다.');
  const totalCountPromise = apartmentUnitService.countUnitsByComplex(complex);

  const unitsPromise = apartmentUnitService.findUnitsByComplexPagination(complex, currentPage);

  const [units, totalCount] = await Promise.all([unitsPromise, totalCountPromise]);

  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);

  return { units, totalPage };
};

export const findContractorComplexTypes = async (contractor: Identifier, complex: Identifier, currentPage: number) => {
  const foundComplex = await apartmentComplexService.findComplexById(complex);
  if (!foundComplex || !foundComplex.contractor.uniqueId.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '존재하지 않는 아파트 단지입니다.');

  const totalCountPromise = apartmentUnitTypeService.countTypesByComplex(complex);
  const typesPromise = apartmentUnitTypeService.findUnitTypesByComplexPagination(complex, currentPage);

  const [types, totalCount] = await Promise.all([typesPromise, totalCountPromise]);

  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);

  return { complex: foundComplex, types, totalPage };
};

export const createComplexUnitType = async (contractor: Identifier, complex: Identifier, unitType: CreateUnitTypeBody) => {
  const foundComplex = await apartmentComplexService.findComplexById(complex);
  if (!foundComplex || !foundComplex.contractor.uniqueId.equals(contractor.uniqueId))
    throw new ApiError(httpStatus.FORBIDDEN, '존재하지 않는 아파트 단지입니다.');

  const createUnitTypeDto: CreateUnitTypeDto = {
    ...unitType,
    apartment: {
      complex: {
        uniqueId: foundComplex._id,
      },
    },
  };
  await apartmentUnitTypeService.createAptUnitType(createUnitTypeDto);
};

export const updateComplexUnitType = async (unitType: Identifier, updateUnitTypeBody: UpdateUnitTypeBody) => {
  const foundUnitType = await apartmentUnitTypeService.findUnitTypeById(unitType);

  if (!foundUnitType) throw new ApiError(httpStatus.NOT_FOUND, '해당 타입을 찾을 수 없습니다.');

  await apartmentUnitTypeService.updateUnitType(unitType, updateUnitTypeBody);
};

export const deleteContractorUnitType = async (complex: Identifier, unitType: Identifier) => {
  const foundUnitType = await apartmentUnitTypeService.findUnitTypeById(unitType);

  if (!foundUnitType || !foundUnitType.apartment.complex.uniqueId?.equals(complex.uniqueId))
    throw new ApiError(httpStatus.NOT_FOUND, '아파트 세대 타입을 찾을 수 없습니다.');

  await apartmentUnitTypeService.deleteContractorUnitType(unitType);
};

export const checkIfCreateUnitAvailable = async (contractor: Identifier, complex: Identifier, unitType: Identifier) => {
  const complexPromise = apartmentComplexService.findComplexById(complex);
  const unitTypePromise = apartmentUnitTypeService.findUnitTypeById(unitType);

  const [foundComplex, foundUnitType] = await Promise.all([complexPromise, unitTypePromise]);

  if (
    !foundComplex ||
    !foundUnitType ||
    !foundComplex.contractor.uniqueId.equals(contractor.uniqueId) ||
    !foundUnitType.apartment.complex.uniqueId.equals(foundComplex._id)
  )
    throw new ApiError(httpStatus.NOT_FOUND, '단지 정보 혹은 시공사 정보가 일치하지 않습니다.');
};

export const createContractorUnit = async (complex: Identifier, unitType: Identifier, createUnitBody: CreateUnitBody) => {
  const createUnitDto: CreateUnitDto = {
    ...createUnitBody,
    apartment: {
      complex: {
        uniqueId: toObjectId(complex.uniqueId),
      },
      unitType: {
        uniqueId: toObjectId(unitType.uniqueId),
      },
    },
  };

  await apartmentUnitService.createAptUnit(createUnitDto);
};

export const updateSpecificUnit = async (unit: Identifier, updateUnitBody: UpdateUnitBody) => {
  const updateUnitDto: UpdateUnitDto = {
    ...updateUnitBody,
  };
  await apartmentUnitService.updateSpecificUnit(unit, updateUnitDto);
};

export const deleteSpecificUnit = async (unit: Identifier) => {
  await apartmentUnitService.deleteUnitById(unit);
};

export const checkIfPartnershipExist = async (contractor: Identifier, partner: Identifier) => {
  const foundPartnership = await contractorPartnerService.findPartnershipByContractorPartner(contractor, partner);
  if (foundPartnership) throw new ApiError(httpStatus.CONFLICT, '이미 해당 협력사가 존재합니다.');
};

export const createPartnership = async (contractor: Identifier, partner: Identifier) => {
  const createPartnershipDto: any = {
    contractor: {
      uniqueId: toObjectId(contractor.uniqueId),
    },
    partner: {
      uniqueId: toObjectId(partner.uniqueId),
    },
  };

  await contractorPartnerService.createAssociation(createPartnershipDto);
};

export const findContractorDefectsDynamicQuery = async (
  contractor: Identifier,
  apartment: Partial<ApartmentQuery> | undefined,
  defect: ContractorDefectStatuses | undefined,
  date: DefectRequestedDateRange | undefined,
  currentPage: number
) => {
  const filter: any = {};

  const startDate = date?.requested?.start ?? null;
  const endDate = date?.requested?.end ?? null;

  if (startDate || endDate)
    filter['date.requested'] = {
      ...(startDate && { $gte: startDate }),
      ...(endDate && { $lte: endDate }),
    };

  if (defect?.statuses) {
    const contractorDefectStatuses = defect.statuses.map((status) => DEFECT_CONTRACTOR_STATUS[`${status}`]).flat();

    filter.status = {
      $in: contractorDefectStatuses,
    };
  }

  if (date)
    if (apartment?.complex?.uniqueIds)
      filter['apartment.complex.uniqueId'] = {
        $in: apartment.complex.uniqueIds.map((uniqueId) => toObjectId(uniqueId)),
      };
  if (apartment?.unit?.dongs)
    filter['apartment.unit.dong'] = {
      $in: apartment.unit.dongs,
    };
  if (apartment?.unit?.hos)
    filter['apartment.unit.ho'] = {
      $in: apartment.unit.hos,
    };

  const totalCountPromise = defectService.countContractorDefectsDynamicQuery(contractor, filter);
  const unitsPromise = defectService.findContractorDefectsDynamicQuery(contractor, filter, currentPage);

  const [totalCountResult, units] = await Promise.all([totalCountPromise, unitsPromise]);

  const totalCount = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);

  return { units, totalPage };
};

export const deleteContractorPartnership = async (contractor: Identifier, partner: Identifier) =>
  contractorPartnerService.deleteAllPartnership(contractor, partner);

export const deleteDuty = async (contractor: Identifier, duty: Identifier) =>
  contractorPartnerService.deleteDuty(contractor, duty);

export const findContractorDuty = async (contractor: Identifier, duty: Identifier) => {
  const foundDuty = await contractorPartnerService.findDutyByIdAndContractor(contractor, duty);

  return { duty: foundDuty[0] };
};
