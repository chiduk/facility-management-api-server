import { IRequest, IReqQueryCommon, IdentifierQueries } from '../common/common.interfaces';
import { CreateInquiryBody } from '@/modules/inquiry/inquiry.interface';

export interface IFindMyApartmentUnitLocations extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export type CreateDefectDto = {
  location: string;
  work: {
    type: string;
    detail: string;
    additionalInfo: string;
  };
  image?: {
    requested?: string;
  };
  coordinate: {
    x: number;
    y: number;
    z: number;
    latitude: number;
    longitude: number;
    imageId: number;
  };
};

export type CreateDefectBody = {
  defect: CreateDefectDto;
};

export interface ICreateMyDefects extends IRequest {
  file?: Express.Multer.File;
  body: CreateDefectBody;
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident' | 'apartment'>;
}

export interface IFindSpecificDefect extends IRequest {
  query: Pick<IdentifierQueries, 'defect'>;
}

export interface IConfirmMyDefect extends IRequest {
  file?: Express.Multer.File;
  query: Pick<IdentifierQueries, 'defect'>;
}

export interface IVerifyMyApartment extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IGetSupportedWorks extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'apartment'>;
}

export interface ISetDefaultApartment extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IFindMyApartmentUnit extends IRequest {}

export interface IFindMyFilteredDefects extends IRequest {
  query: Pick<IdentifierQueries, 'apartment' | 'defect'>;
}

export interface IGetComplexesByAddress extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident' | 'apartment'>;
}

export interface IGetDongsByComplex extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident' | 'apartment'>;
}

export interface IGetHosByDong extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident' | 'apartment'>;
}

export interface IGetFaq extends IRequest {
  query: Pick<IdentifierQueries, 'faq'>;
}

export interface IPostResidentInquiry extends IRequest {
  body: {
    inquiry: CreateInquiryBody;
  };
}

export interface IGetMyInquiries extends IRequest {}

export interface IFindMyDefectsWithinAptUnit extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IGetResidentNotification extends IRequest {}

export interface IGetPartnerContractors extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'partner'>;
}

export interface IGetRepairedDefects extends IRequest {}

export interface IFindMyApartmentComplexes extends IRequest {}

export interface IGetPartnerInquiries extends IRequest {
  query: Pick<IdentifierQueries, 'partner'>;
}

export interface IGetAllTaskByUnit extends IRequest {
  query: Pick<IdentifierQueries, 'apartment' | 'partner'>;
}

export interface IDeleteResidentFromUnit extends IRequest {
  query: Pick<IdentifierQueries, 'user' | 'apartment'>;
}

export interface IGetDashboardNotice extends IRequest {
  query: IReqQueryCommon & {
    currentPage: string;
  };
}

export interface IGetDefectStatistics extends IRequest {}

export interface IGetPartnerEmployeeEngineers extends IRequest {
  query: Pick<IdentifierQueries, 'user' | 'partner'> & {
    currentPage?: string;
    name?: string;
    employee?: {
      code?: string;
    };
    phone?: {
      mobile?: {
        number?: string;
      };
    };
  };
}
