import { IResponse } from '../common/common.interfaces';
import * as apartmentUnitService from '../apartmentUnit/apartmentUnit.service';
import * as defectService from '../defect/defects.service';
import * as residentsService from './residents.service';
import * as contractorPartnerService from '../contractor_partner/contractor_partner.service';
import * as notificationService from '../notification/notification.service';
import * as inquiryService from '../inquiry/inquiry.service';
import { ApiError } from '../errors';
import { httpStatus } from '../utils';
import {
  IFindSpecificDefect,
  IConfirmMyDefect,
  IVerifyMyApartment,
  IGetSupportedWorks,
  ISetDefaultApartment,
  IFindMyFilteredDefects,
  IGetComplexesByAddress,
  IGetDongsByComplex,
  IGetHosByDong,
  IGetFaq,
  IPostResidentInquiry,
  IGetMyInquiries,
  IFindMyApartmentUnitLocations,
  ICreateMyDefects,
  IFindMyDefectsWithinAptUnit,
  IFindMyApartmentUnit,
  IGetResidentNotification,
  IFindMyApartmentComplexes,
  IGetRepairedDefects,
  IDeleteResidentFromUnit,
} from './residents.interfaces';
import * as userService from '../user/user.service';
import catchAsync from '../utils/catchAsync';

/**
 * @description 입주자 앱 - 로그인 후 내 거주지 리스트 조회
 */
export const findMyApartmentUnit = async (req: IFindMyApartmentUnit, res: IResponse) => {
  const resident = {
    uniqueId: req.user._id,
  };
  const currentPage = Number(req.query['currentPage']) || 1;
  const units = await apartmentUnitService.findMyApartmentUnit(resident, currentPage);
  return res.status(httpStatus.OK).json({ units });
};

/**
 * @description
 * 입주민이 내 거주지 목록에서 거주지를 삭제
 * 입주민 식별 : token, query
 * 유닛 식별 : query
 * 거주지 삭제 -> apartment.unit 의 fk 삭제
 * 그 거주지가 기본 거주지라면? -> user.default.apartment.unit fk 도 삭제
 * 1.
 */
export const deleteResidentFromUnit = async (req: IDeleteResidentFromUnit, res: IResponse) => {
  const {
    apartment: { unit },
  } = req.query;
  const { user } = req;

  await residentsService.deleteResidentFromUnitService(user, unit);
  return res.status(httpStatus.OK).json('Ok');
};

/**
 * @description 입주자 앱 - 내 하자 리스트 조회
 */
export const findMyFilteredDefects = async (req: IFindMyFilteredDefects, res: IResponse) => {
  const { apartment, defect } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const [defects] = await residentsService.findMyFilteredDefectsService(resident, apartment, defect);
  return res.status(httpStatus.OK).json({ defects });
};

/**
 * @desccription 입주자 앱 - 내 하자 등록하기
 */
export const createMyDefects = async (req: ICreateMyDefects, res: IResponse) => {
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, '사진을 함께 첨부해주세요');
  const { apartment } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const { defect } = req.body;
  // check if the apartment exists
  const unit = await apartmentUnitService.findMyApartmentUnitByResidentIdAptUnitId(resident, apartment);
  // 해당 유닛, 공종을 할당할 협력사 찾기
  const contractorPartner = await contractorPartnerService.findAssociationByUnitId(unit, defect);
  const newDefect = await defectService.createMyDefects(resident, unit, defect, req.file, contractorPartner);

  res.status(httpStatus.OK).json({
    defect: {
      uniqueId: newDefect._id,
    },
  });
  await residentsService.createNewDefectNotification(newDefect);
  await residentsService.sendPushNotification(req.user, 'CREATE_DEFECT');
};

/**
 * @description 입주자 앱 - 내 거주지 추가(인증)하기
 * 1. 별도 API - 시공사 백오피스에서 입주민을 수동으로 등록한다.
 * 2. 데이터가 생성되고, isVerified : false 로 초기값 설정
 * 3. 입주민이 거주지 인증을 한다.
 * 4. 정보 비교 후 일치하면 isVerified: true 로 변경
 */
export const verifyMyApartment = async (req: IVerifyMyApartment, res: IResponse) => {
  const { apartment } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const unit = await apartmentUnitService.verifyMyApartment(apartment, resident);

  await residentsService.checkIfDefaultExistAndAdd(req.user, unit);
  return res.status(httpStatus.OK).json('ok');
};

/**
 * @description
 * 입주자 앱 랜딩 페이지 - 내 거주지 정해질 때 해당 거주지의 AS 리스트 조회
 * 최신순, 페이지네이션, 5개씩
 */
export const findMyDefectsWithinAptUnit = async (req: IFindMyDefectsWithinAptUnit, res: IResponse) => {
  const resident = {
    uniqueId: req.user._id,
  };
  const { apartment } = req.query;
  const defects = await defectService.findMyDefectsWithinAptUnit(resident, apartment);
  return res.status(httpStatus.OK).json({ defects });
};

/**
 * @description 입주민 앱 - 특정 하자 조회
 */
export const findSpecificDefect = async (req: IFindSpecificDefect, res: IResponse) => {
  const { defect } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const foundDefect = await defectService.findOneDefect(defect, resident);
  return res.status(httpStatus.OK).json({ defect: foundDefect });
};

/**
 * @description
 * 입주민이 내 하자 수리 완료를 확인/검수하고 서명
 * formData 로 이미지 받아야 함.
 * TODO
 * - API 실패 할 경우 파일 삭제
 */
export const confirmMyDefect = async (req: IConfirmMyDefect, res: IResponse) => {
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, '서명을 첨부해주세요.');
  const { defect } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const signature = req.file.filename;
  await residentsService.confirmMyDefectService(resident, defect, signature);

  res.status(httpStatus.OK).json('Ok');

  await notificationService.findDefectAndCreateNotification(defect);
  await residentsService.sendPushNotification(req.user, 'CONFIRM_DEFECT');
};

/**
 * @description 특정 아파트 유닛의 장소 리스트 보여주기
 */
export const findMyApartmentUnitLocations = async (req: IFindMyApartmentUnitLocations, res: IResponse) => {
  const { apartment } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const locations = (await residentsService.findMyApartmentUnitLocations(apartment, resident)).map((obj) => obj.locations);
  return res.status(httpStatus.OK).json({ locations });
};

/**
 * @description 입주자 앱 - 기본 거주지 설정하기
 * 로그인한 입주민이 아파트 Id 를 보내면 해당 아파트가 로그인한 유저 소유인지 먼저 확인
 * 소유주가 아니거나 아파트가 존재하지 않으면 404
 */
export const setDefaultApartment = async (req: ISetDefaultApartment, res: IResponse) => {
  const { apartment } = req.query;
  const resident = {
    uniqueId: req.user._id,
  };
  const foundApartment = await apartmentUnitService.findOneApartment(apartment, resident);
  if (!foundApartment) throw new ApiError(httpStatus.NOT_FOUND, '아파트를 찾을 수 없습니다');
  if (foundApartment._id.equals(req.user.default.apartment.unit.uniqueId))
    throw new ApiError(httpStatus.ALREADY_REPORTED, '이미 해당 아파트로 설정이 되어 있습니다.');
  await userService.setUserDefaultAptUnit(resident, apartment);
  return res.status(httpStatus.OK).json('ok');
};

/**
 * @description 특정 아파트에 지원되는 공종 타입 조회
 */
export const getSupportedWorks = async (req: IGetSupportedWorks, res: IResponse) => {
  const resident = {
    uniqueId: req.user._id,
  };
  const { apartment } = req.query;
  const [works] = await residentsService.findSupportedWorks(apartment, resident);
  if (!works) throw new ApiError(httpStatus.NOT_FOUND, '공종을 찾을 수 업습니다.');
  return res.status(httpStatus.OK).json(works);
};

/**
 * @description 주소로 단지 검색
 */
export const getComplexesByAddressOrName = async (req: IGetComplexesByAddress, res: IResponse): Promise<any> => {
  const { apartment } = req.query;
  const complexes = await residentsService.findComplexesByAddressOrName(apartment);
  return res.status(httpStatus.OK).json({ complexes });
};

/**
 * @description 단지 id로 해당 단지 내 동 리스트 조회
 */
export const getDongsByComplex = async (req: IGetDongsByComplex, res: IResponse): Promise<any> => {
  const { apartment } = req.query;
  const dongs = await residentsService.findDongByComplexService(apartment);

  return res.status(httpStatus.OK).json({ dongs });
};

export const getHosByDong = async (req: IGetHosByDong, res: IResponse) => {
  const { apartment } = req.query;
  const hos = await residentsService.getHosByDongService(apartment);
  return res.status(httpStatus.OK).json({ hos });
};

/**
 * @description 입주민 앱에서 FAQ 조회
 */
export const getFaq = async (req: IGetFaq, res: IResponse) => {
  const { faq } = req.query;
  const faqs = await residentsService.getFaqService(faq);
  return res.status(httpStatus.OK).json({ faqs });
};

/**
 * @description 입주민 앱에서 평행공간에 문의 남기기
 */
export const postResidentInquiry = async (req: IPostResidentInquiry, res: IResponse) => {
  const { inquiry } = req.body;
  const { user } = req;

  await inquiryService.createInquiry(inquiry, user);
  return res.status(httpStatus.OK).json('ok');
};

/**
 * @description 입주민 앱에서 내 문의 조회
 * 답변 완료 여부에 따라 그룹화 후 내보내기
 */
export const getMyInquiries = async (req: IGetMyInquiries, res: IResponse) => {
  const resident = {
    uniqueId: req.user._id,
  };
  const [inquiries] = await residentsService.getMyInquiriesService(resident);
  return res.status(httpStatus.OK).json({ inquiries });
};

/**
 * @description
 * 토큰에서 사용자 식별
 * 사용자에 해당하는 노티 전부 조회
 * 응답 보낸 후 isRead = true 업데이트
 */
export const getResidentNotification = catchAsync(async (req: IGetResidentNotification, res: IResponse) => {
  const { user } = req;
  const notifications = await notificationService.readResidentNotification(user);
  res.status(httpStatus.OK).json({ notifications });

  await notificationService.updateIsReadToTrue(notifications);
});

export const getRepairedDefects = catchAsync(async (req: IGetRepairedDefects, res: IResponse) => {
  const { user } = req;
  const defects = await defectService.findRepairedDefectsByResident(user);

  return res.status(httpStatus.OK).json({ defects });
});

export const findMyApartmentComplexes = catchAsync(async (req: IFindMyApartmentComplexes, res: IResponse) => {
  const { user } = req;

  const complexes = await apartmentUnitService.findComplexesByResident(user);
  return res.status(httpStatus.OK).json({ complexes });
});
