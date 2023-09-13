import { ApartmentUnit, apartmentUnitService } from '../apartmentUnit';
import { apartmentComplexService } from '../apartmentComplex';
import { defectService, defectConstant } from '../defect';
import { faqService } from '../faq';
import { inquiryService } from '../inquiry';
import { notificationService } from '../notification';
import { toObjectId, httpStatus, fcmService } from '../utils';
import { ApartmentQuery, DefectQuery, FaqQuery, Identifier } from '@/modules/common/common.interfaces';
import { CategoryEnum, ICategoryFilter, IRegexFilter } from '@/modules/faq/faq.interface';
import { ApiError } from '../errors';
import { IDefectDoc } from '../defect/defect.interface';
import { NotificationTypeEnum } from '../notification/notification.interface';
import { IPushMessage } from '../utils/fcm';
import { IUserDoc } from '@/modules/user/user.interfaces';
import { TypePushMessage, residentPushMessages } from '../common/common.push.messages';
import { deviceTokenService } from '../deviceToken';
import { logger } from '../logger';
import { IApartmentUnitDoc } from '@/modules/apartmentUnit/apartmentUnit.interface';

const { DEFECT_RESIDENT_STATUS, DefectStatus } = defectConstant;
const { sendPushToFCM } = fcmService;

export const findMyApartmentUnitLocations = (apartment: ApartmentQuery, resident: Identifier) =>
  ApartmentUnit.aggregate([
    {
      $match: {
        'resident.uniqueId': toObjectId(resident.uniqueId),
        _id: toObjectId(apartment.unit.uniqueId),
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT_TYPE',
        as: 'apartment.unitType',
        localField: 'apartment.unitType.uniqueId',
        foreignField: '_id',
      },
    },
    {
      $unwind: '$apartment.unitType',
    },
    {
      $project: {
        _id: 0,
        locations: '$apartment.unitType.locations',
      },
    },
    {
      $unwind: '$locations',
    },
  ]);

export const findSupportedWorks = async (apartment: ApartmentQuery, resident: Identifier) =>
  apartmentUnitService.findWorksByApartmentUnit(apartment, resident);

/**
 * @description 입주민 앱 하자 조회 시 여기서 쿼리 빌드
 */

export const findMyFilteredDefectsService = async (
  resident: Identifier,
  apartment: ApartmentQuery,
  defect: DefectQuery
): Promise<any[]> => {
  const foundUnit = await apartmentUnitService.findOneApartment(apartment, resident);
  if (!foundUnit) throw new ApiError(httpStatus.NOT_FOUND, '아파트를 찾을 수 없습니다.');

  const filter: any = {};
  // in progress, not progress 등 배열 매핑 변환 필요
  const statusArr = defect?.status
    ? defect.status?.map((status) => (DEFECT_RESIDENT_STATUS[`${status}`] ? DEFECT_RESIDENT_STATUS[`${status}`] : [])).flat()
    : [];

  filter['resident.uniqueId'] = toObjectId(resident.uniqueId);
  filter['apartment.unit.uniqueId'] = toObjectId(apartment.unit.uniqueId);
  if (statusArr.length > 0) filter.status = { $in: statusArr };
  if (defect?.location) filter.location = { $in: defect.location };
  if (defect?.work?.type) filter['work.type'] = { $in: defect.work.type };

  const myDefects = await defectService.findMyFilteredDefects(filter);
  return myDefects;
};

/**
 * @description keyword 로 주소 || 단지 명 검색해서 단지 리스트 조회
 */
export const findComplexesByAddressOrName = async (apartment: ApartmentQuery) => {
  const keyword = apartment?.complex?.keyword || '';
  const complexes = await apartmentComplexService.findApartmentComplexByAddress(keyword);
  return complexes;
};

/**
 * @description 단지 Id 로 동 리스트 조회
 */
export const findDongByComplexService = async (apartment: ApartmentQuery) => {
  const dongList = await apartmentUnitService.findDongByComplex(apartment);
  const dongs = dongList.map((dong) => dong.dong).sort();
  return dongs;
};

/**
 * @description
 * 단지, 동으로 유닛들 식별 후, 호(ho) 중복 제거
 */
export const getHosByDongService = async (apartment: ApartmentQuery) => {
  const hos = (await apartmentUnitService.findHosByComplexDong(apartment)).map((unit) => unit._id);
  return [...new Set(hos)];
};

/**
 * @description faq 조회 시 동적 쿼리 빌드
 */
export const getFaqService = async (faq: FaqQuery) => {
  const categoryFilter: ICategoryFilter = {};
  const regexFilter: IRegexFilter = {};
  if (faq?.category) categoryFilter.category = faq.category as CategoryEnum;
  if (faq?.qna?.question)
    regexFilter['qna.question'] = {
      $regex: faq.qna.question,
    };
  const faqs = await faqService.getFaqDynamic(categoryFilter, regexFilter);
  return faqs;
};

export const getMyInquiriesService = async (resident: Identifier) => {
  const inquiries: any[] = await inquiryService.findInquiriesByAuthor(resident);
  if (inquiries.length <= 0)
    inquiries.push({
      answered: [],
      unanswered: [],
    });

  return inquiries;
};

export const confirmMyDefectService = async (resident: Identifier, defect: Identifier, signature: string) => {
  const foundDefect = await defectService.findDefectByPkResident(defect, resident);
  if (!foundDefect) throw new ApiError(httpStatus.NOT_FOUND, '하자를 찾을 수 없습니다.');
  if (!DEFECT_RESIDENT_STATUS.REPAIRED!.includes(foundDefect.status))
    throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, '서명 가능한 상태가 아닙니다.');

  foundDefect.status = DefectStatus.CONFIRMED;
  foundDefect.resident.signature = signature;
  foundDefect.date.confirmed = new Date();
  await foundDefect.save();
  return foundDefect;
};

export const createNewDefectNotification = async (defect: IDefectDoc) => {
  const createNotificationDto = {
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

/**
 * @description
 * 사용자 정보를 받아서, DeviceToken 조회
 * token이 없거나, isReceivePush가 false 이면 종료
 */
export const sendPushNotification = async (user: IUserDoc, type: keyof TypePushMessage) => {
  const deviceToken = await deviceTokenService.findDeviceTokenByUserId(user);

  if (!deviceToken) {
    // 기기 토큰을 못 찾은 경우, 로깅
    logger.warn(`[user.uniqueId: ${user._id}] 푸시알림 전송 실패`);
    return;
  }
  const message: IPushMessage = {
    notification: residentPushMessages[`${type}`],
    token: deviceToken.token,
  };

  await sendPushToFCM(message);
};

export const checkIfDefaultExistAndAdd = async (resident: IUserDoc, unit: IApartmentUnitDoc): Promise<void> => {
  if (resident.default.apartment.unit.uniqueId) return;

  // eslint-disable-next-line no-param-reassign
  resident.default.apartment.unit.uniqueId = unit._id;
  await resident.save();
};

export const deleteResidentFromUnitService = async (user: IUserDoc, unit: Identifier): Promise<any> => {
  const foundUnit = await ApartmentUnit.findOne({
    _id: toObjectId(unit.uniqueId),
  });
  if (!foundUnit) throw new ApiError(httpStatus.NOT_FOUND, '해당 유닛을 찾을 수 업습니다.');
  if (!foundUnit.resident.uniqueId?.equals(user._id))
    throw new ApiError(httpStatus.FORBIDDEN, '해당 유닛 입주민이 아닙니다.');

  foundUnit.resident.uniqueId = null;
  await foundUnit.save();

  if (user.default.apartment.unit.uniqueId?.equals(unit.uniqueId)) {
    // eslint-disable-next-line no-param-reassign
    user.default.apartment.unit.uniqueId = null;
    await user.save();
  }
};
