import { Request, Response } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import ParsedQs from 'qs';
import { Types } from 'mongoose';
import { IUserDoc } from '@/modules/user/user.interfaces';
import { IDefectResidentStatus } from '@/modules/defect/defect.constant';
import { UserType } from '@/modules/user/user.constants';

export type ObjectId = Types.ObjectId;

export interface IRequest extends Request {
  user: IUserDoc;
  query: IReqQueryCommon;
}

export interface IResponse extends Response {}

export interface IReqQueryCommon extends ParsedQs.ParsedQs {}

export interface IRequestError extends Request {
  error?: Error;
}

export interface Phone {
  mobile?: PhoneNumberDetail;
  office?: PhoneNumberDetail;
  fax?: PhoneNumberDetail;
}

export interface PhoneNumberDetail {
  countryCode: number;
  number: string;
}

export type Identifier = {
  uniqueId: string;
};

export type ApartmentQuery = {
  unit: Identifier & {
    dongs?: string[];
    hos?: string[];
    dong?: string;
    ho?: string;
  };
  complex: Identifier & {
    address?: string;
    name?: string;
    keyword?: string;
    uniqueIds: string[];
  };
  unitType: Identifier;
};

export type SpecificApartmentQuery = ApartmentQuery & {
  unit: Identifier & {
    dong?: string;
    ho?: string;
  };
};

export type EmployeeQuery = Identifier & {
  uniqueIds: string[];
};

export type SingleSelectDefectQuery = Identifier & {
  status?: string;
  location?: string;
  work?: {
    type: string;
  };
};

export type DefectQuery = Identifier & {
  status?: Partial<keyof IDefectResidentStatus>[];
  location?: string[];
  work?: {
    type: string[];
  };
};

export type FaqQuery = {
  category?: string;
  qna?: {
    question?: string;
  };
};

export type ResidentIdentifier = Identifier & {
  uniqueIds?: string[];
  name?: string;
  phone?: Pick<Phone, 'mobile'>;
  email?: string;
  type?: UserType;
};

export interface IdentifierQueries {
  user: Identifier;
  engineer: Identifier;
  employee: EmployeeQuery;
  partner: Identifier;
  resident: ResidentIdentifier;
  contractor: Identifier;
  defect: DefectQuery;
  apartment: ApartmentQuery;
  faq: FaqQuery;
  inquiry: Identifier;
  duty: Identifier;
  currentPage?: string;
}

export interface CreateCompanyBody {
  ceo: string;
  company: string;
  address: string;
  phone: {
    mobile: {
      number: string;
    };
    office: {
      number: string;
    };
    fax: {
      number: string;
    };
  };
  business: {
    number: string;
    registration?: string;
  };
}
