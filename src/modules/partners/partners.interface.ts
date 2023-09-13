import { Document, Model } from 'mongoose';
import { PhoneNumberDetail, IRequest, IdentifierQueries, IReqQueryCommon } from '../common/common.interfaces';
import { CreatePartnerEmployeeDto, UpdatePartnerEmployeeDto } from '@/modules/partners/partners.types';

export interface IPartner {
  ceo: string;
  company: string;
  email: string;
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
}

export interface IPartnerDoc extends IPartner, Document {}
export type IPartnerModel = Model<IPartnerDoc>;

export interface IRepairDefect extends IRequest {
  query: Pick<IdentifierQueries, 'defect'>;
  file?: Express.Multer.File;
}

export interface IGetPartnerEmployees {
  query: Pick<IdentifierQueries, 'partner'>;
}

export interface ICreatePartnerEmployee extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'partner'>;
  body: CreatePartnerEmployeeDto;
}

export interface IDeletePartnerEmployee extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'partner' | 'employee'>;
}

export interface IUpdatePartnerEmployee extends IRequest {
  query: Pick<IdentifierQueries, 'partner' | 'employee'>;
  body: UpdatePartnerEmployeeDto;
}

export interface IAssignTask extends IRequest {
  query: Pick<IdentifierQueries, 'partner' | 'defect'>;
  body: Pick<IdentifierQueries, 'engineer'>;
}

export interface IGetPartnerDefects {
  query: Pick<IdentifierQueries, 'partner' | 'apartment'>;
}

export interface IGetAssignedApartments extends IRequest {}

export interface IGetEngineerDefectsByComplex extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IGetAllTasksGroupByComplex extends IRequest {
  query: Pick<IdentifierQueries, 'engineer'>;
}

export interface IGetAllTaskOfOneComplex extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IGetSpecificDefect extends IRequest {
  query: Pick<IdentifierQueries, 'defect'>;
}

export interface IPatchDefectReject extends IRequest {
  query: Pick<IdentifierQueries, 'defect' | 'partner'>;
}

export interface IGetAllTasksDynamic extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IFilterDefect {
  'apartment.unit.dong'?: object;
  'apartment.unit.ho'?: object;
  'apartment.complex.uniqueId'?: object;
}

export interface IRejectTask extends IRequest {
  query: Pick<IdentifierQueries, 'defect'>;
}

export interface IGetComplexesByName extends IRequest {
  query: Pick<IdentifierQueries, 'apartment' | 'partner'>;
}

export interface IGetDongsByComplex extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}

export interface IGetHosByComplex extends IRequest {
  query: Pick<IdentifierQueries, 'apartment'>;
}
