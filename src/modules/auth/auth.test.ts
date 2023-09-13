/* eslint-disable jest/no-commented-out-tests */
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import request from 'supertest';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import moment from 'moment';
import bcrypt from 'bcryptjs';
import { jest } from '@jest/globals';
import app from '../../app';
import setupTestDB from '../jest/setupTestDB';
import User from '../user/user.model';
import config from '../../config/config';
import * as tokenService from '../token/token.service';
import tokenTypes from '../token/token.types';
import Token from '../token/token.model';
import authMiddleware from './auth.middleware';
import ApiError from '../errors/ApiError';
import { NewCreatedResident } from '@/modules/user/user.interfaces';

const userFirstName = faker.name.firstName();
const userLastName = faker.name.lastName();

faker.locale = 'ko';

setupTestDB();

const password = 'P@ssw0rd1123';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);
const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');

const userOne = {
  _id: new mongoose.Types.ObjectId(),
  name: `${faker.name.lastName()}${faker.name.firstName()}`,
  email: faker.internet.email(userFirstName, userLastName).toLowerCase(),
  password,
  role: 'user',
  type: 'resident',
  phone: {
    mobile: {
      countryCode: faker.phone.number('+82'),
      number: faker.phone.number('010-####-####'),
    },
  },
  isEmailVerified: false,
  isActive: true,
};

const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);

const insertUsers = async (users: Record<string, any>[]) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

describe('Auth routes', () => {
  beforeAll(() => {
    config.env = 'test';
  });

  afterAll(() => {
    config.env = 'development';
  });

  describe('POST /api/auth/signup', () => {
    let newUser: NewCreatedResident;
    beforeEach(() => {
      faker.locale = 'en_US';
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      faker.locale = 'ko';
      newUser = {
        name: `${faker.name.lastName()}${faker.name.firstName()}`,
        email: faker.internet.email(firstName, lastName).toLowerCase(),
        password: 'password1',
        type: 'resident',
        role: 'user',
        phone: {
          mobile: {
            countryCode: 82,
            number: faker.phone.number('010-####-####'),
          },
        },
        isActive: true,
        isEmailVerified: false,
      };
    });
    test('신규회원가입. 가입완료 후 201 리턴함', async () => {
      const res = await request(app).post('/api/auth/signup').send(newUser).expect(httpStatus.CREATED);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toEqual({
        uniqueId: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        role: 'user',
        type: 'resident',
        isActive: true,
        isEmailVerified: false,
      });

      const dbUser = await User.findById(res.body.user.uniqueId);
      expect(dbUser).toBeDefined();
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: 'user', isEmailVerified: false });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });
  });
  describe('POST /api/auth/signin', () => {
    test('사용자의 이메일과 비밀번호가 맞으면 200을 리턴함.', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.OK);

      expect(res.body.user).toEqual({
        uniqueId: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        role: userOne.role,
        type: userOne.type,
        isEmailVerified: userOne.isEmailVerified,
        isActive: userOne.isActive,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('없는 이메일 일때 401을 리턴함.', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });

    test('틀린 비밀번호 일때 401을 리턴함.', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });
  });

  describe('POST /api/auth/signout', () => {
    test('Refresh token이 유효하면 204를 리턴함.', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/api/auth/signout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('Request body에 refresh token이 없는 경우 400 에러를 리턴함.', async () => {
      await request(app).post('/api/auth/signout').send().expect(httpStatus.BAD_REQUEST);
    });

    test('Refresh token이 DB에 없으면 404 에러를 리턴함.', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/api/auth/signout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/api/auth/signout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/auth/requestCode/:method', () => {
    test('이메일 인증코드 요청을 보낸 후 200을 리턴함', async () => {
      faker.locale = 'en_US';
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();

      const reqBody = {
        email: faker.internet.email(firstName, lastName),
      };
      await request(app).post('/api/auth/requestCode/email').send(reqBody).expect(httpStatus.OK);
    });
    test('잘못된 형식의 이메일로 인증코드들 요청 후 400 에러를 리턴함', async () => {
      faker.locale = 'en_US';
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();

      const reqBody = {
        email: faker.internet.email(firstName, lastName).concat('#$@!!!'),
      };
      await request(app).post('/api/auth/requestCode/email').send(reqBody).expect(httpStatus.BAD_REQUEST);
    });
    test('휴대전화로 인증코드 요청을 보낸 후 200을 리턴함', async () => {
      const reqBody = {
        phoneNumber: faker.phone.number('+8210########'),
      };
      await request(app).post('/api/auth/requestCode/phone').send(reqBody).expect(httpStatus.OK);
    });
    test('최소길이보다 적은 전화번호를 보내고 400 에러를 리턴함', async () => {
      const reqBody = {
        phoneNumber: faker.phone.number('+####'),
      };
      await request(app).post('/api/auth/requestCode/phone').send(reqBody).expect(httpStatus.BAD_REQUEST);
    });
  });
});

describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user._id).toEqual(userOne._id);
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS, 'invalidSecret');
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUsers([userOne]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await authMiddleware()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await authMiddleware('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: httpStatus.FORBIDDEN, message: 'Forbidden' }));
  });

  test('should call next with no errors if user does not have required rights but userId is in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { user: { uniqueId: userOne._id.toHexString() } },
    });
    const next = jest.fn();

    await authMiddleware('manageSelf')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
