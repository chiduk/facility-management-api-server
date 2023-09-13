import { inquiryService } from '../inquiry';
import { userService } from '../user';
import { defectService } from '../defect';
import { EmployeeQuery, ResidentIdentifier } from '@/modules/common/common.interfaces';
import { Employee, UpdateResidentDto } from '@/modules/pspace/pspace.interface';
import { DEFAULT_PAGINATION } from '../common/common.constants';
import { UserType } from '../user/user.constants';
import { toObjectId, httpStatus } from '../utils';
import { ApiError } from '../errors';

export const findDashboardInquiry = (currentPage: number) => inquiryService.findInquiriesPagination(currentPage);

export const findUserInflow = () => userService.findNewUserGroupByDateType();

export const findDefectStatistics = () => defectService.findAndGroupRecent7days();

export const getPspaceEmployees = () => userService.findPspaceEmployees();

export const deleteBulkPspaceEmployees = (employee: EmployeeQuery) => userService.deleteBulkPspaceEmployee(employee);

export const updatePspaceEmployees = async (employees: Employee[]) => {
  const promises = employees.map((employee) => {
    const update: any = {
      ...(employee.name && { name: employee.name }),
      ...(employee.email && { email: employee.email }),
      ...(employee.role && { role: employee.role }),
      ...(employee.phone?.mobile?.countryCode && { 'phone.mobile.countryCode': employee.phone.mobile.countryCode }),
      ...(employee.phone?.mobile?.number && { 'phone.mobile.number': employee.phone.mobile.number }),
    };

    return userService.updateEmployee(employee, update);
  });
  await Promise.all(promises);
};

export const getAllResidentsPagination = async (resident: ResidentIdentifier, currentPage: string | undefined) => {
  const defaultCurrentPage = Number(currentPage) || 1;
  const filter: any = {
    type: UserType.RESIDENT,
  };
  if (resident?.name) filter.name = { $regex: resident.name };
  if (resident?.phone?.mobile?.number)
    filter['phone.mobile.number'] = { $regex: new RegExp(resident.phone.mobile.number, 'i') };
  const [residents, totalCount] = await Promise.all([
    userService.findAllResidents(filter, defaultCurrentPage),
    userService.countTotalResidentsPage(filter),
  ]);

  return { residents, totalCount: totalCount.length === 0 ? 0 : Math.ceil(totalCount[0].totalCount / DEFAULT_PAGINATION) };
};

export const deleteBulkPspaceResident = (resident: ResidentIdentifier) => userService.deleteBulkResidents(resident);

export const updatePspaceResidents = async (residents: UpdateResidentDto[]) => {
  const promises = residents.map((resident) => {
    const update: any = {
      ...(resident.name && { name: resident.name }),
      ...(resident.email && { email: resident.email }),
      ...(resident.phone?.mobile?.countryCode && { 'phone.mobile.countryCode': resident.phone.mobile.countryCode }),
      ...(resident.phone?.mobile?.number && { 'phone.mobile.number': resident.phone.mobile.number }),
    };

    return userService.updateEmployee(resident, update);
  });
  await Promise.all(promises);
};

export const toggleUserBlacklist = async (resident: ResidentIdentifier): Promise<void> => {
  const user = await userService.getUserById(toObjectId(resident.uniqueId));
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, '사용자를 찾을 수 없습니다');
  user.isBlacklisted = !user.isBlacklisted;
  await user.save();
};
