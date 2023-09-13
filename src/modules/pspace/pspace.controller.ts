import { httpStatus } from '../utils';
import { IResponse } from '@/modules/common/common.interfaces';
import {
  IDeletePspaceEmployeeBulk,
  IDeletePspaceResidentBulk,
  IGetDashboardDefects,
  IGetDashboardInquiry,
  IGetDashboardUserInflow,
  IGetPspaceEmployees,
  IGetPspaceResidents,
  IPatchResidentBlacklist,
  IUpdatePspaceEmployeeBulk,
  IUpdatePspaceResidentBulk,
} from '@/modules/pspace/pspace.interface';
import * as pspaceService from './pspace.service';

export const getDashboardInquiry = async (req: IGetDashboardInquiry, res: IResponse) => {
  const { currentPage = 1 } = req.query;
  const inquiries = await pspaceService.findDashboardInquiry(Number(currentPage));
  return res.status(httpStatus.OK).json({ inquiries });
};

export const getDashboardUserInflow = async (_req: IGetDashboardUserInflow, res: IResponse) => {
  const users = await pspaceService.findUserInflow();
  return res.status(httpStatus.OK).json({ users });
};

export const getDashboardDefects = async (_req: IGetDashboardDefects, res: IResponse) => {
  const defects = await pspaceService.findDefectStatistics();
  return res.status(httpStatus.OK).json({ defects });
};

export const getPspaceEmployees = async (_req: IGetPspaceEmployees, res: IResponse) => {
  const employees = await pspaceService.getPspaceEmployees();
  return res.status(httpStatus.OK).json({ employees });
};

export const deletePspaceEmployeeBulk = async (req: IDeletePspaceEmployeeBulk, res: IResponse) => {
  const { employee } = req.query;
  await pspaceService.deleteBulkPspaceEmployees(employee);
  return res.status(httpStatus.OK).json('ok');
};

export const updatePspaceEmployeeBulk = async (req: IUpdatePspaceEmployeeBulk, res: IResponse) => {
  const { employees } = req.body;
  await pspaceService.updatePspaceEmployees(employees);
  return res.status(httpStatus.OK).json('ok');
};

export const getPspaceResidents = async (req: IGetPspaceResidents, res: IResponse) => {
  const { resident, currentPage } = req.query;

  const result = await pspaceService.getAllResidentsPagination(resident, currentPage);
  return res.status(httpStatus.OK).json(result);
};

export const deletePspaceResidentBulk = async (req: IDeletePspaceResidentBulk, res: IResponse) => {
  const { resident } = req.query;
  await pspaceService.deleteBulkPspaceResident(resident);
  return res.status(httpStatus.OK).json('ok');
};

export const updatePspaceResidentBulk = async (req: IUpdatePspaceResidentBulk, res: IResponse) => {
  const { residents } = req.body;
  await pspaceService.updatePspaceResidents(residents);
  return res.status(httpStatus.OK).json('ok');
};

export const patchResidentBlacklist = async (req: IPatchResidentBlacklist, res: IResponse): Promise<IResponse> => {
  const { resident } = req.query;
  await pspaceService.toggleUserBlacklist(resident);
  return res.status(httpStatus.OK).json('ok');
};
