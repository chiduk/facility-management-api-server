import { Document, Model } from 'mongoose';
import ParsedQs from 'qs';
import { PhoneNumberDetail, IRequest, IdentifierQueries, ApartmentQuery } from '../common/common.interfaces';
import { CreateInquiryBody } from '@/modules/inquiry/inquiry.interface';
import { AnswerInquiryInput } from '@/modules/contractor/contractor.types';
import { CreateComplexDto, UpdateComplexDto } from '@/modules/apartmentComplex/apartmentComplex.interface';
import { CreateUnitTypeBody, UpdateUnitTypeBody } from '@/modules/apartmentUnitType/apartmentUnitType.interface';
import { CreateUnitBody, UpdateUnitBody } from '@/modules/apartmentUnit/apartmentUnit.interface';
import { DEFECT_CONTRACTOR_STATUS } from '@/modules/defect/defect.constant';

type Works = WorkDetail[];

type WorkDetail = {
  type: string;
  details: string[];
};

export type AssignDutyDto = {
  works: string[];
};

export interface IContractor {
  ceo: string;
  company: string;
  address: string;
  phone: {
    mobile: PhoneNumberDetail;
    office: PhoneNumberDetail;
    fax: PhoneNumberDetail;
  };
  business: {
    number: string;
    registration?: string;
  };
  works: Works;
}

export interface IContractorDoc extends IContractor, Document {}
export type IContractorModel = Model<IContractorDoc>;

export interface IGetWorks {
  query: Pick<IdentifierQueries, 'contractor'>;
}

export type GetDefectsQuery = {
  complexId?: string;
  partnerId?: string;
  dong?: string;
  ho?: string;
  floorStart?: string;
  floorEnd?: string;
  location?: string;
  workType?: string;
};

export interface IGetResidents {
  query: Pick<IdentifierQueries, 'contractor'>;
}

export interface IGetUnits extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
}

export interface IGetPartnerManagingUnits extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'partner'>;
}

export type CreateWork = {
  type: string;
};

export type CreateWorkBody = {
  work: CreateWork;
};

export interface IPostWork extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
  body: CreateWorkBody;
}

export type CreateWorkDetail = CreateWork & {
  detail: string;
};

export type CreateWorkDetailBody = {
  work: CreateWorkDetail;
};
export interface IPostWorkDetail extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
  body: CreateWorkDetailBody;
}

export interface IFindComplexFilterByName {
  complex?: {
    name?: string;
  };
}
export interface IGetApartmentComplexes extends IRequest {
  query: ParsedQs.ParsedQs &
    Pick<IdentifierQueries, 'contractor' | 'user'> & {
      apartment?: IFindComplexFilterByName;
    };
}

export interface IGetApartmentDongs {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
}

export interface IGetApartmentHos extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'> & {
    apartment: ApartmentQuery;
  };
}

export interface IGetPartners extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'> & {
    currentPage?: string;
  };
}

export interface IAssignDuty extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'partner' | 'apartment'>;
  body: AssignDutyDto;
}

export interface ICreateContractorInquiry extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
  body: {
    inquiry: CreateInquiryBody;
  };
}

export interface IGetContractorInquiries extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
}

export interface IPatchContractorInquiry extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'inquiry'>;
  body: AnswerInquiryInput;
}

export interface IGetContractorPspaceInquiry extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
}

export interface IGetDashboardDashboardStatistics extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'> & {
    currentPage?: string;
  };
}

export interface IGetDashboardTasks extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'> & {
    currentPage?: string;
  };
}

export interface IGetContractorComplexes extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'> & {
    currentPage?: string;
  };
}
export interface ICreateContractorComplex extends IRequest {
  query: Pick<IdentifierQueries, 'contractor'>;
  body: {
    complex: Pick<CreateComplexDto, 'name' | 'address'>;
  };
}

export interface IUpdateContractorComplex extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
  body: {
    complex: UpdateComplexDto;
  };
}

export interface IDeleteContractorComplex extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
}

export interface IGetContractorUnits extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'> & {
    currentPage?: string;
  };
}

export interface IGetContractorTypes extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'> & {
    currentPage?: string;
  };
}

export interface IPostContractorType extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
  body: {
    unitType: CreateUnitTypeBody;
  };
}

export interface IUpdateContractorUnitType extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
  body: {
    updateUnitTypeBody: UpdateUnitTypeBody;
  };
}

export interface IDeleteContractorUnitType extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
}

export interface IPostContractorUnit extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
  body: {
    createUnitBody: CreateUnitBody;
  };
}

export interface IGetSpecificUnit extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
}

export interface IUpdateSpecificUnit extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
  body: {
    updateUnitBody: UpdateUnitBody;
  };
}

export interface IDeleteSpecificUnit extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'apartment'>;
}

export interface ICreatePartnership extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'partner'>;
}

export interface ContractorDefectStatuses {
  statuses: (keyof typeof DEFECT_CONTRACTOR_STATUS)[];
}

export interface DefectRequestedDateRange {
  requested?: {
    start?: Date;
    end?: Date;
  };
}

export interface IGetContractorDefects extends IRequest {
  query: ParsedQs.ParsedQs &
    Pick<IdentifierQueries, 'contractor'> & {
      apartment?: Pick<ApartmentQuery, 'complex' | 'unit'>;
      defect?: ContractorDefectStatuses;
      date?: DefectRequestedDateRange;
      currentPage?: string;
    };
}

export interface IDeletePartnership extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'partner'>;
}

export interface IDeleteDuty extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'duty'>;
}

export interface IGetContractorDuty extends IRequest {
  query: Pick<IdentifierQueries, 'contractor' | 'duty'>;
}
