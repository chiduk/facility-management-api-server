import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach } from '@jest/globals';
import { httpStatus, moment, bcrypt } from '../utils';
import { UserRole, UserType } from '../user/user.constants';
import { NewCreatedUser } from '../user/user.interfaces';
import app from '../../app';
import initializeTest from '../jest/initializeTest';
import User from '../user/user.model';
import config from '../../config/config';
import * as tokenService from '../token/token.service';
import tokenTypes from '../token/token.types';
import { getValue, setVerificationCode } from '../radish/radish.service';

const { encryptSync } = bcrypt;

initializeTest();

const userFirstName = faker.name.firstName();
const userLastName = faker.name.lastName();

faker.locale = 'ko';

const password = 'aaaa1111';
const hashedPassword = encryptSync(password);
const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');

const userOne = {
  _id: new mongoose.Types.ObjectId(),
  name: `${faker.name.lastName()}${faker.name.firstName()}`,
  email: faker.internet.email(userFirstName, userLastName).toLowerCase(),
  password,
  role: UserRole.RESIDENT,
  type: UserType.RESIDENT,
  phone: {
    mobile: {
      countryCode: 82,
      number: faker.phone.number('010-####-####'),
    },
  },
  isEmailVerified: false,
  isActive: true,
  isReceivePush: false,
};

const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);

const insertUsers = async (users: Record<string, any>[]) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

describe('Auth routes', () => {
  describe('POST /api/auth/signup', () => {
    let newUser: NewCreatedUser;
    beforeEach(() => {
      faker.locale = 'en_US';
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      faker.locale = 'ko';
      newUser = {
        name: `${faker.name.lastName()}${faker.name.firstName()}`,
        email: faker.internet.email(firstName, lastName).toLowerCase(),
        password: 'password1',
        phone: {
          mobile: {
            countryCode: 82,
            number: faker.phone.number('010-####-####'),
          },
        },
      };
    });

    describe('success', () => {
      test('신규회원가입. 가입완료 후 201 리턴함', async () => {
        const result = await request(app).post('/api/auth/signup').send(newUser);
        expect(result.status).toBe(httpStatus.CREATED);
      });
    });

    describe('failure', () => {
      test('should return 400 if required body is missing', async () => {
        delete newUser.email;
        const result = await request(app).post('/api/auth/signup').send(newUser);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /api/auth/signin', () => {
    describe('success', () => {
      test('사용자의 이메일과 비밀번호가 맞으면 200을 리턴함.', async () => {
        await insertUsers([userOne]);
        const loginCredentials = {
          email: userOne.email,
          password: userOne.password,
        };

        const result = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.OK);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('user');
        expect(result.body).toHaveProperty('tokens');
        expect(result.body.tokens).toEqual({
          access: { token: expect.anything(), expires: expect.anything() },
          refresh: { token: expect.anything(), expires: expect.anything() },
        });
      });
    });

    describe('failure', () => {
      test('should return 401 if email is not exist.', async () => {
        const loginCredentials = {
          email: faker.internet.email().toLowerCase(),
          password: userOne.password,
        };

        const result = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

        expect(result.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
      });
      test('틀린 비밀번호 일때 401을 리턴함.', async () => {
        const loginCredentials = {
          email: userOne.email,
          password: 'wrongPassword1',
        };

        const result = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

        expect(result.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
      });
    });
  });

  describe('POST /api/auth/signout', () => {
    describe('success', () => {
      test('should return 204', async () => {
        const loginCredentials = {
          email: userOne.email,
          password: userOne.password,
        };
        const loginResult = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.OK);

        const accessToken = loginResult.body.tokens.access.token;
        const refreshToken = loginResult.body.tokens.refresh.token;

        const signoutResult = await request(app)
          .post('/api/auth/signout')
          .send({ refreshToken })
          .set('Authorization', `Bearer ${accessToken}`);

        expect(signoutResult.status).toBe(httpStatus.NO_CONTENT);
      });
    });

    describe('failure', () => {
      test('Request body에 refresh token이 없는 경우 400 에러를 리턴함.', async () => {
        const loginCredentials = {
          email: userOne.email,
          password: userOne.password,
        };
        const loginResult = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.OK);

        const accessToken = loginResult.body.tokens.access.token;

        const signoutResult = await request(app).post('/api/auth/signout').set('Authorization', `Bearer ${accessToken}`);

        expect(signoutResult.status).toBe(httpStatus.BAD_REQUEST);
      });

      test('should return 404 if token not exist in database', async () => {
        const loginCredentials = {
          email: userOne.email,
          password: userOne.password,
        };
        const loginResult = await request(app).post('/api/auth/signin').send(loginCredentials).expect(httpStatus.OK);

        const accessToken = loginResult.body.tokens.access.token;

        const signoutResult = await request(app)
          .post('/api/auth/signout')
          .send({ refreshToken: 'token_not_exist' })
          .set('Authorization', `Bearer ${accessToken}`);

        expect(signoutResult.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });

  describe('POST /api/refreshToken', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const loginCredentials = {
          email: userOne.email,
          password: userOne.password,
        };

        const logInResult = await request(app).post('/api/auth/signin').send(loginCredentials);

        const result = await request(app)
          .post(`/api/auth/refreshToken?user[uniqueId]=${userOne._id}`)
          .send({
            refreshToken: logInResult.body.tokens.refresh.token,
          })
          .set('Authorization', `Bearer ${logInResult.body.tokens.access.token}`);
        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).not.toHaveProperty('user');
        expect(result.body).toHaveProperty('access');
        expect(result.body.access).toHaveProperty('expires');
        expect(result.body.access).toHaveProperty('token');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const loginCredentials = {
          email: userOne.email,
          password: userOne.password,
        };

        const logInResult = await request(app).post('/api/auth/signin').send(loginCredentials);

        const result = await request(app)
          .post(`/api/auth/refreshToken`)
          .send({
            refreshToken: logInResult.body.tokens.refresh.token,
          })
          .set('Authorization', `Bearer ${logInResult.body.tokens.access.token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /api/auth/requestCode/:method', () => {
    describe('success', () => {
      test('이메일 인증코드 요청을 보낸 후 200을 리턴함', async () => {
        faker.locale = 'en_US';
        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();

        const reqBody = {
          email: faker.internet.email(firstName, lastName),
        };
        const result = await request(app).post('/api/auth/requestCode/email').send(reqBody);
        expect(result.status).toBe(httpStatus.OK);
      });

      test('휴대전화로 인증코드 요청을 보낸 후 200을 리턴함', async () => {
        const reqBody = {
          phoneNumber: faker.phone.number('+8210########'),
        };
        await request(app).post('/api/auth/requestCode/phone').send(reqBody).expect(httpStatus.OK);
      });
    });
    describe('failure', () => {
      test('잘못된 형식의 이메일로 인증코드들 요청 후 400 에러를 리턴함', async () => {
        faker.locale = 'en_US';
        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();

        const reqBody = {
          email: faker.internet.email(firstName, lastName).concat('#$@!!!'),
        };
        await request(app).post('/api/auth/requestCode/email').send(reqBody).expect(httpStatus.BAD_REQUEST);
      });

      test('최소길이보다 적은 전화번호를 보내고 400 에러를 리턴함', async () => {
        const reqBody = {
          phoneNumber: faker.phone.number('+####'),
        };
        await request(app).post('/api/auth/requestCode/phone').send(reqBody).expect(httpStatus.BAD_REQUEST);
      });

      test('should return 400 if method and body property not matches', async () => {
        const emailBody = {
          email: faker.internet.email().toLowerCase(),
        };
        const phoneBody = {
          phoneNumber: faker.phone.number('+####'),
        };
        const results = await Promise.all([
          request(app).post('/api/auth/requestCode/phone').send(emailBody),
          request(app).post('/api/auth/requestCode/email').send(phoneBody),
        ]);

        results.forEach((result) => expect(result.status).toBe(httpStatus.BAD_REQUEST));
      });
    });
  });

  describe('POST /api/auth/verifyCode/:method', () => {
    const verificationCode = 123456;
    const userPhone = '821049990234';
    const userEmail = 'username@example.com';
    beforeEach(async () => {
      await Promise.all([
        setVerificationCode(userPhone, verificationCode),
        setVerificationCode(userEmail, verificationCode),
      ]);
    });
    describe('success', () => {
      test('should return 204', async () => {
        const results = await Promise.all([
          request(app).post('/api/auth/verifyCode/email').send({
            email: 'username@example.com',
            code: verificationCode,
          }),
          request(app).post('/api/auth/verifyCode/phone').send({
            phoneNumber: '821049990234',
            code: verificationCode,
          }),
        ]);
        results.forEach((result) => expect(result.status).toBe(httpStatus.NO_CONTENT));
      });

      test('should delete stored code after verification success', async () => {
        await Promise.all([
          request(app).post('/api/auth/verifyCode/email').send({
            email: 'username@example.com',
            code: verificationCode,
          }),
          request(app).post('/api/auth/verifyCode/phone').send({
            phoneNumber: '821049990234',
            code: verificationCode,
          }),
        ]);

        const [storedEmailCode, storedPhoneCode] = await Promise.all([getValue(userEmail), getValue(userPhone)]);

        expect(storedEmailCode).toBeNull();
        expect(storedPhoneCode).toBeNull();
      });
    });

    describe('failure', () => {
      test('should return 400 if method and body property not match', async () => {
        const results = await Promise.all([
          request(app).post('/api/auth/verifyCode/email').send({
            phoneNumber: '821049990234',
            code: verificationCode,
          }),
          request(app).post('/api/auth/verifyCode/phone').send({
            email: 'username@example.com',
            code: verificationCode,
          }),
        ]);

        results.forEach((result) => expect(result.status).toBe(httpStatus.BAD_REQUEST));
      });

      test('should return 406 if verification code is incorrect', async () => {
        const result = await request(app).post('/api/auth/verifyCode/email').send({
          email: 'username@example.com',
          code: '193284',
        });
        expect(result.status).toBe(httpStatus.NOT_ACCEPTABLE);
      });
    });
  });

  describe('POST /api/auth/wakeUp/:method', () => {
    let reqBody: any;

    beforeEach(async () => {
      await User.updateOne(
        { _id: userOne._id },
        {
          isActive: false,
        }
      );

      reqBody = {
        resident: {
          uniqueId: userOne._id,
          method: {
            email: userOne.email,
            phone: {
              mobile: {
                countryCode: userOne.phone.mobile.countryCode,
                number: userOne.phone.mobile.number,
              },
            },
          },
        },
      };
    });

    describe('성공', () => {
      test('이메일로 휴면 계정 활성화 성공 시 200 응답', async () => {
        const previousUser = await User.findById(userOne._id);

        const result = await request(app)
          .post('/api/auth/wakeUp/email')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(reqBody);

        expect(result.status).toBe(httpStatus.OK);
        const updatedUser = await User.findById(userOne._id);
        expect(previousUser!.isActive).not.toEqual(updatedUser!.isActive);
        expect(updatedUser!.isActive).toEqual(true);
        expect(previousUser!.isActive).toEqual(false);
      });

      test('전화번호로 휴면 계정 활성화 성공 시 200 응답', async () => {
        await request(app)
          .post('/api/auth/wakeUp/phone')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(reqBody)
          .expect(httpStatus.OK);
      });
    });

    describe('실패', () => {
      test('request body 포맷이 맞지 않으면 400 에러를 리턴함', async () => {
        reqBody = {
          resident: {
            uniqueId: userOne._id,
          },
        };
        const result = await request(app)
          .post('/api/auth/wakeUp/email')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(reqBody);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });

      test('존재하지 않는 회원일 경우, 404 에러를 리턴함', async () => {
        reqBody = {
          resident: {
            uniqueId: faker.database.mongodbObjectId(),
            method: {
              email: userOne.email,
            },
          },
        };

        await request(app)
          .post('/api/auth/wakeUp/email')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(reqBody)
          .expect(httpStatus.NOT_FOUND);
      });

      test('should return 400 if method and body property not match(email)', async () => {
        delete reqBody.resident.method.email;
        const result = await request(app)
          .post('/api/auth/wakeUp/email')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(reqBody);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });

      test('should return 400 if method and body property not match(phone)', async () => {
        delete reqBody.resident.method.phone;
        const result = await request(app)
          .post('/api/auth/wakeUp/phone')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(reqBody);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/auth/findEmail', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app).get(
          `/api/auth/findEmail?resident[phone][mobile][number]=${userOne.phone.mobile.number}&resident[phone][mobile][countryCode]=${userOne.phone.mobile.countryCode}`
        );

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('emails');
        expect(result.body).toHaveProperty('page');
        expect(result.body).toHaveProperty('limit');
        expect(result.body).toHaveProperty('totalPages');
        expect(result.body).toHaveProperty('totalResults');
        expect(result.body.emails.length).toEqual(result.body.totalResults);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).get(
          `/api/auth/findEmail?resident[phone][mobile][countryCode]=${userOne.phone.mobile.countryCode}`
        );

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('DELETE /api/auth/withdrawUser', () => {
    const createdUser = {
      _id: new mongoose.Types.ObjectId(),
      name: `${faker.name.lastName()}${faker.name.firstName()}`,
      email: faker.internet.email(userFirstName, userLastName).toLowerCase(),
      password,
      role: UserRole.RESIDENT,
      type: UserType.RESIDENT,
      phone: {
        mobile: {
          countryCode: 82,
          number: faker.phone.number('010-####-####'),
        },
      },
      isEmailVerified: false,
      isActive: true,
    };

    let createdUserToken: any;

    beforeEach(async () => {
      await insertUsers([createdUser]);
      createdUserToken = tokenService.generateToken(createdUser._id, moment().add(1, 'days'), 'access');
    });

    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .delete(`/api/auth/withdrawUser`)
          .set('Authorization', `Bearer ${createdUserToken}`);

        expect(result.status).toBe(httpStatus.OK);
      });
    });

    describe('faiulre', () => {
      test('should return 401 if token not sent', async () => {
        const result = await request(app).delete(`/api/auth/withdrawUser`);

        expect(result.status).toBe(httpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('POST /api/auth/signin/code', () => {
    let partnerWorker: any;
    const employeeCode = '000001';
    const engineerPassword = 'aaaa1111';
    beforeAll(async () => {
      partnerWorker = await User.create({
        name: '협력사 직원',
        email: 'engineer@partner.com',
        employee: {
          code: employeeCode,
        },
        role: UserRole.PARTNER_ENGINEER,
        type: UserType.PARTNER,
        password: engineerPassword,
        phone: {
          mobile: {
            countryCode: 82,
            number: faker.phone.number('010-####-####'),
          },
        },
        isEmailVerified: false,
        isActive: true,
      });
    });

    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .post(`/api/auth/signin/code`)
          .send({
            employee: {
              code: partnerWorker.employee.code,
            },
            password: engineerPassword,
          });
        expect(result.status).toBe(httpStatus.OK);
      });
    });

    describe('failure', () => {
      test('should return 400 if required body property is missing', async () => {
        const result = await request(app)
          .post(`/api/auth/signin/code`)
          .send({
            employee: {
              code: partnerWorker.employee.code,
            },
          });
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/auth/password', () => {
    describe('success', () => {
      test('should return 200 when using email', async () => {
        const changedPassword = 'test1234';
        const result = await request(app).patch(`/api/auth/password?email=${userOne.email}`).send({
          password: changedPassword,
          confirmPassword: changedPassword,
        });

        const loginResult = await request(app).post(`/api/auth/signin`).send({
          email: userOne.email,
          password: changedPassword,
        });
        expect(result.status).toBe(httpStatus.OK);
        expect(loginResult.status).toBe(httpStatus.OK);
      });
    });
    describe('failure', () => {
      test('should return 400 if both email and phone are included in query string', async () => {
        const result = await request(app)
          .patch(
            `/api/auth/password?user[uniqueId]=${userOne._id}&email=${userOne.email}&phone[mobile][countryCode]=${userOne.phone.mobile.countryCode}&phone[mobile][number]=${userOne.phone.mobile.number}`
          )
          .send({
            password: 'test1234',
            confirmPassword: 'test1234',
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });

      test('should return 400 if password and confirmPassword are not the same', async () => {
        const result = await request(app)
          .patch(`/api/auth/password?user[uniqueId]=${userOne._id}&email=${userOne.email}`)
          .send({
            password: 'test1234',
            confirmPassword: 'test12341',
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});
