import { IdentifierQueries, IReqQueryCommon, IRequest, Phone } from '@/modules/common/common.interfaces';
import { UserRole } from '@/modules/user/user.constants';

export type PspaceRole = Extract<UserRole, 'PSPACE_WORKER' | 'PSPACE_SUB_ADMIN'>;

export interface IGetDashboardInquiry extends IRequest {}

export interface IGetDashboardUserInflow extends IRequest {}

export interface IGetDashboardDefects {}

export interface IGetPspaceEmployees extends IRequest {}

export interface IDeletePspaceEmployeeBulk extends IRequest {
  query: Pick<IdentifierQueries, 'employee'>;
}

export type Employee = {
  uniqueId: string;
  name?: string;
  email?: string;
  role?: PspaceRole;
  phone?: Pick<Phone, 'mobile'>;
};

export type UpdateResidentDto = {
  uniqueId: string;
  name?: string;
  email?: string;
  phone?: Pick<Phone, 'mobile'>;
};

export interface IUpdatePspaceEmployeeBulk extends IRequest {
  body: {
    employees: Employee[];
  };
}

export interface IGetPspaceResidents extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident' | 'currentPage'>;
}

export interface IDeletePspaceResidentBulk extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident'>;
}

export interface IUpdatePspaceResidentBulk extends IRequest {
  body: {
    residents: UpdateResidentDto[];
  };
}

export interface IPatchResidentBlacklist extends IRequest {
  query: IReqQueryCommon & Pick<IdentifierQueries, 'resident'>;
}
