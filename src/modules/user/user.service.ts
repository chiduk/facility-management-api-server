import mongoose, { Aggregate } from 'mongoose';
import User from './user.model';
import { ApiError } from '../errors';
import { IOptions, QueryResult } from '../paginate/paginate';
import { EmployeeIdentifier, IUserDoc, NewCreatedResident, UpdateUserBody } from './user.interfaces';
import { toObjectId, httpStatus, moment, bcrypt } from '../utils';
import { ApartmentQuery, EmployeeQuery, Identifier, ResidentIdentifier } from '@/modules/common/common.interfaces';
import { UserRole, UserType } from './user.constants';
import { Employee } from '@/modules/pspace/pspace.interface';
import { DEFAULT_PAGINATION } from '../common/common.constants';
import { LoginUser } from '@/modules/user/user.types';
import { CreatePartnerEmployeeDto, UpdatePartnerEmployeeDto } from '@/modules/partners/partners.types';

const { encrypted } = bcrypt;

export const createUser = (createUserDto: any) => User.create(createUserDto);

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryUsers = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserById = async (id: mongoose.Types.ObjectId): Promise<IUserDoc | null> => User.findById(id);

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmail = async (email: string): Promise<IUserDoc | null> => User.findOne({ email });

/**
 * Get user by email and mobile phone number
 * @param {object} phone
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmailAndMobilePhoneNumber = async (phone: object): Promise<IUserDoc | null> => User.findOne({ phone });

/**
 * Create a user
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const createResident = async (userBody: NewCreatedResident): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = userBody;
  return User.create(user);
};

/**
 * Update user by id
 * @param {mongoose.Types.ObjectId} userId
 * @param {UpdateUserBody} updateBody
 * @returns {Promise<IUserDoc | null>}
 */
export const updateUserById = async (
  userId: mongoose.Types.ObjectId,
  updateBody: UpdateUserBody
): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IUserDoc | null>}
 */
export const deleteUserById = async (userId: mongoose.Types.ObjectId): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 * @description
 * 이메일로 회원 찾고, 기본 설정 거주지 join
 */
export const findUserByEmailLookupDefaultApartment = (email: string): Aggregate<Array<LoginUser>> =>
  User.aggregate([
    {
      $match: {
        email,
      },
    },
    {
      $lookup: {
        from: 'APT_UNIT',
        foreignField: '_id',
        localField: 'default.apartment.unit.uniqueId',
        as: 'default.apartment.unit',
      },
    },
    {
      $unwind: {
        path: '$default.apartment.unit',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'APT_COMPLEX',
        foreignField: '_id',
        localField: 'default.apartment.unit.apartment.complex.uniqueId',
        as: 'default.apartment.complex',
      },
    },
    {
      $unwind: {
        path: '$default.apartment.complex',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        name: 1,
        email: 1,
        password: 1,
        phone: 1,
        role: 1,
        type: 1,
        isEmailVerified: 1,
        isActive: 1,
        isReceivePush: 1,
        'default.apartment.unit.uniqueId': {
          $ifNull: ['$default.apartment.unit._id', null],
        },
        'default.apartment.unit.dong': {
          $ifNull: ['$default.apartment.unit.dong', null],
        },
        'default.apartment.unit.ho': {
          $ifNull: ['$default.apartment.unit.ho', null],
        },
        'default.apartment.complex.uniqueId': {
          $ifNull: ['$default.apartment.complex._id', null],
        },
        'default.apartment.complex.name': {
          $ifNull: ['$default.apartment.complex.name', null],
        },
        'default.apartment.complex.address': {
          $ifNull: ['$default.apartment.complex.name', null],
        },
      },
    },
  ]);

export const setUserDefaultAptUnit = (resident: Identifier, apartment: ApartmentQuery) =>
  User.updateOne(
    {
      _id: toObjectId(resident.uniqueId),
    },
    {
      'default.apartment.unit.uniqueId': toObjectId(apartment.unit.uniqueId),
    }
  );

export const findNewUserGroupByDateType = () =>
  User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: moment().add(-7, 'days').toDate(),
        },
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        type: 1,
        createdAt: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          createdAt: '$createdAt',
        },
        users: {
          $push: '$uniqueId',
        },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id.type',
        createdAt: '$_id.createdAt',
        inflowCount: {
          $size: '$users',
        },
      },
    },
  ]);

export const findPspaceEmployees = () =>
  User.aggregate([
    {
      $match: {
        type: {
          $eq: UserType.PSPACE,
        },
      },
    },
    {
      $project: {
        uniqueId: '$_id',
        _id: 0,
        name: 1,
        email: 1,
        phone: {
          mobile: 1,
        },
        role: 1,
      },
    },
  ]);

export const updateUserRole = (user: Identifier, role: Partial<UserRole>) =>
  User.updateOne(
    {
      _id: toObjectId(user.uniqueId),
    },
    {
      role,
    }
  );

export const deleteBulkPspaceEmployee = (employee: EmployeeQuery) =>
  User.deleteMany({
    _id: {
      $in: employee.uniqueIds.map((uniqueId) => toObjectId(uniqueId)),
    },
    type: UserType.PSPACE,
  });

export const updateEmployee = (employee: Employee, update: any) =>
  User.updateOne(
    {
      _id: toObjectId(employee.uniqueId),
    },
    {
      $set: update,
    }
  );

export const findAllResidents = (filter: any, currentPage: number) =>
  User.aggregate([
    {
      $match: filter,
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        name: 1,
        email: 1,
        phone: 1,
        isActive: 1,
        isEmailVerified: 1,
      },
    },
    {
      $limit: DEFAULT_PAGINATION,
    },
    {
      $skip: (currentPage - 1) * DEFAULT_PAGINATION,
    },
  ]);

export const countTotalResidentsPage = (filter: any) =>
  User.aggregate([
    {
      $match: filter,
    },
    {
      $project: {
        _id: 0,
        totalCount: {
          $sum: 1,
        },
      },
    },
  ]);

export const deleteBulkResidents = (resident: ResidentIdentifier) =>
  User.deleteMany({
    _id: {
      $in: resident.uniqueIds!.map((uniqueId) => toObjectId(uniqueId)),
    },
    type: UserType.RESIDENT,
  });

export const deleteUser = (user: IUserDoc) => User.deleteOne({ _id: user._id });

export const findUserByEmployeeCode = (employee: EmployeeIdentifier): Aggregate<Array<any>> =>
  User.aggregate([
    {
      $match: {
        'employee.code': employee.code,
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        name: 1,
        email: 1,
        password: 1,
        phone: 1,
        role: 1,
        category: 1,
        isEmailVerified: 1,
        isActive: 1,
        partner: 1,
      },
    },
  ]);

export const findUserByEmailOrPhone = (filter: any) => User.findOne(filter);

export const updateUserIsReceivePushToTrue = (user: Identifier) =>
  User.updateOne(
    { _id: toObjectId(user.uniqueId) },
    {
      isReceivePush: true,
    }
  );

export const createPartnerEmployee = async (partner: Identifier, createPartnerEmployeeDto: CreatePartnerEmployeeDto) =>
  User.create({
    ...createPartnerEmployeeDto,
    partner: {
      uniqueId: toObjectId(partner.uniqueId),
    },
    type: UserType.PARTNER,
  });

export const deletePartnerEmployee = async (partner: Identifier, employee: Identifier) =>
  User.deleteOne({
    _id: toObjectId(employee.uniqueId),
    partner: {
      uniqueId: toObjectId(partner.uniqueId),
    },
  });

export const findAndUpdatePartnerEmployee = async (
  partner: Identifier,
  employee: Identifier,
  updatePartnerEmployeeDto: UpdatePartnerEmployeeDto
) => {
  const foundEmployee = await User.findOne({
    _id: toObjectId(employee.uniqueId),
    partner: {
      uniqueId: toObjectId(partner.uniqueId),
    },
  });

  if (!foundEmployee) throw new ApiError(httpStatus.NOT_FOUND, '존재하지 않는 직원입니다.');

  const encryptedPassword = await encrypted(updatePartnerEmployeeDto.password);

  await User.updateOne(
    {
      _id: toObjectId(employee.uniqueId),
      partner: {
        uniqueId: toObjectId(partner.uniqueId),
      },
    },
    {
      ...updatePartnerEmployeeDto,
      password: encryptedPassword,
    }
  );
};

export const findFilteredEngineers = async (partner: Identifier, filter: any, currentPage: number) => {
  const engineersPromise = User.aggregate([
    {
      $match: {
        partner: {
          uniqueId: toObjectId(partner.uniqueId),
        },
        ...filter,
        role: UserRole.PARTNER_ENGINEER,
      },
    },
    {
      $limit: DEFAULT_PAGINATION,
    },
    {
      $skip: (currentPage - 1) * DEFAULT_PAGINATION,
    },
    {
      $project: {
        _id: 0,
        uniqueId: '$_id',
        employee: 1,
        name: 1,
        'phone.mobile.number': 1,
        totalCount: 1,
      },
    },
  ]);

  const totalCountPromise = User.count({
    partner: {
      uniqueId: toObjectId(partner.uniqueId),
    },
    ...filter,
    role: UserRole.PARTNER_ENGINEER,
  });

  const [engineers, totalCount] = await Promise.all([engineersPromise, totalCountPromise]);

  const totalPage = Math.ceil(totalCount / DEFAULT_PAGINATION);

  return { engineers, totalCount, totalPage };
};

export const checkIfUserExistByEmail = async (email: string) => {
  const foundUser = await User.findOne({
    email,
  });

  if (!foundUser) throw new ApiError(httpStatus.NOT_FOUND, '존재하지 않는 회원입니다.');
};

export const checkIfUserExistByPhone = async (phoneNumber: string) => {
  const foundUser = await User.findOne({
    'phone.mobile.number': phoneNumber,
  });

  if (!foundUser) throw new ApiError(httpStatus.NOT_FOUND, '존재하지 않는 회원입니다.');
};
