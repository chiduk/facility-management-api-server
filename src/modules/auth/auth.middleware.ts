import { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
import { httpStatus } from '../utils';
import passport from './passport';
import { ApiError } from '../errors';
import roleRights from '../../config/roles';
import { IUserDoc } from '../user/user.interfaces';
import { IRequest, IResponse } from '@/modules/common/common.interfaces';

const { TokenExpiredError } = pkg;

/**
 * router 에서 auth('manageSelf')로 미들웨어 호출 -> 이게 node process 시작할 때 실행됨.
 * ...requiredRights 로 받음 ['manageSelf']
 * promise 객체 생성
 * passport strategy 호출
 *
 * app.ts 에서 패스포트 미들웨어 선언, passport.use('jwt', ...)
 * 따라서 passport.ts -> jwtStrategy 실행
 * strategy 에서 검사하는 것
 * 토큰 자체 유효성
 * decode 후 sub 으로 user 조회
 *
 * 그 뒤에 verifyCallback 이동
 * requiredRights 가 네 번째 매개변수로 들어옴
 * requiredRights 는 개발자가 정하는 권한
 * req.user 에 user 심음
 * requiredRights 에 뭔가 있으면  roleRights.get('USER') -> ['manageSelf']
 * 만약 없으면 에러
 * 있으면 매개변수 배열 순회해서 두 개 배열 전부 일치하는지 비교
 * 하나라도 다르거나, query 로 들어온 user id 랑 조회 결과 id 랑 같은지 비교
 * 조건문이 좀 이상한데?
 *
 * Authorization
 * The auth middleware can also be used to require certain rights/permissions to access a route.
 *
 * const express = require('express');
 * const auth = require('../../middlewares/auth');
 * const userController = require('../../controllers/user.controller');
 *
 * const router = express.Router();
 *
 * router.post('/users', auth('manageUsers'), userController.createUser);
 * In the example above, an authenticated user can access this route only if that user has the manageUsers permission.
 *
 * The permissions are role-based. You can view the permissions/rights of each role in the src/config/roles.js file.
 *
 * If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.
 */
const verifyCallback =
  (req: Request, resolve: any, reject: any, requiredRights: string[]) => async (err: Error, user: IUserDoc, info: any) => {
    try {
      if (err || info || !user) {
        if (info instanceof TokenExpiredError) return reject(new ApiError(httpStatus.NOT_ACCEPTABLE, 'Token expired'));
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }
      req.user = user;

      if (!user.isActive) return reject(new ApiError(httpStatus.PARTIAL_CONTENT, '비활성 계정입니다.'));
      if (requiredRights.length) {
        const userRights = roleRights.get(user.role);
        if (!userRights) return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
        const hasRequiredRights = requiredRights.every((requiredRight: string) => userRights.includes(requiredRight));
        if (!hasRequiredRights && req.query['user.uniqueId'] !== user.id) {
          return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
        }
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  };

const authMiddleware =
  (...requiredRights: string[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    new Promise<void>((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));

export const decodeMiddleware = async (req: IRequest, _res: IResponse, next: NextFunction): Promise<void> => {
  try {
    passport.authenticate('jwtExpiration', { session: false }, (_error, user, _info) => {
      if (_error || _info) throw new ApiError(httpStatus.FORBIDDEN, 'Invalid Token');
      req.user = user;
      next();
    })(req, _res);
  } catch (e) {
    next(e);
  }
};

export default authMiddleware;
