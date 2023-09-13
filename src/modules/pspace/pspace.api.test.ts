import request from 'supertest';
import { faker } from '@faker-js/faker';
import { httpStatus } from '../utils';
import app from '../../app';
import User from '../user/user.model';
import Contractor from '../contractor/contractor.model';
import Defect from '../defect/defect.model';
import ApartmentComplex from '../apartmentComplex/apartmentComplex.model';
import ApartmentUnitType from '../apartmentUnitType/apartmentUnitType.model';
import ApartmentUnit from '../apartmentUnit/apartmentUnit.model';
import ContractorPartner from '../contractor_partner/contractor_partner.model';
import Partner from '../partners/partners.model';
import { IUserDoc } from '../user/user.interfaces';
import initializeTest from '../jest/initializeTest';
import { IContractorDoc } from '../contractor/contractor.interface';
import { IPartnerDoc } from '../partners/partners.interface';
import { IApartmentUnitDoc } from '../apartmentUnit/apartmentUnit.interface';
import { IApartmentComplexDoc } from '../apartmentComplex/apartmentComplex.interface';
import { IApartmentUnitTypeDoc } from '../apartmentUnitType/apartmentUnitType.interface';
// import { IDefectDoc } from '../defect/defect.interface';
// import { DefectStatus } from '../defect/defect.constant';

initializeTest();

let resident: IUserDoc;
let pspaceAdmin: IUserDoc;
// let partnerEngineer: IUserDoc;
// let partnerAdmin: IUserDoc;
// let contractorAdmin: IUserDoc;
let contractor: IContractorDoc;
let partner: IPartnerDoc;
let unit: IApartmentUnitDoc;
let complex: IApartmentComplexDoc;
let type: IApartmentUnitTypeDoc;
// let defect: IDefectDoc;
const locations = ['거실', '주방', '침실1', '침실2', '안방', '화장실1', '화장실2', '베란다1', '베란다2', '다목적실'];

const residentName = faker.name.fullName();
const residentEmail = faker.internet.email().toLowerCase();
// const partnerEngineerName = faker.name.fullName();
// const partnerEngineerEmail = faker.internet.email().toLowerCase();
// const partnerAdminName = faker.name.fullName();
// const partnerAdminEmail = faker.internet.email().toLowerCase();
// const contractorAdminName = faker.name.fullName();
// const contractorAdminEmail = faker.internet.email().toLowerCase();
const pspaceAdminName = faker.name.fullName();
const pspaceAdminEmail = faker.internet.email().toLowerCase();
const password = 'aaaa1111';
beforeAll(async () => {
  resident = await User.create({
    name: residentName,
    email: residentEmail,
    password,
    role: 'RESIDENT',
    type: 'RESIDENT',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
    },
  });
  pspaceAdmin = await User.create({
    name: pspaceAdminName,
    email: pspaceAdminEmail,
    password,
    role: 'PSPACE_ADMIN',
    type: 'PSPACE',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
    },
  });
  contractor = await Contractor.create({
    ceo: 'John Doe',
    company: '연제 건설',
    address: '서울 특별시 서초구 양재대로',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
      office: {
        countryCode: null,
        number: null,
      },
      fax: {
        countryCode: null,
        number: null,
      },
    },
    business: {
      number: 1049990234,
      registration: null,
    },
    works: [
      {
        type: '도배',
        details: ['곰팡이', '찢어짐', '들뜸', '마감 불량', '기타', '불량', '불량', '불량', '불량'],
      },
      {
        type: '전기',
        details: ['누전', '오작동', '단선', '기타'],
      },
      {
        type: '타일',
        details: ['기타', '파손'],
      },
    ],
  });
  partner = await Partner.create({
    ceo: 'Tom',
    company: '권승 도배',
    address: '서울 특별시 송파구',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
      office: {
        countryCode: null,
        number: null,
      },
      fax: {
        countryCode: null,
        number: null,
      },
    },
    business: {
      number: 1049990234,
    },
    email: 'yjseo@pspace.ai',
  });
  // partnerEngineer = await User.create({
  //   name: partnerEngineerName,
  //   email: partnerEngineerEmail,
  //   password,
  //   role: 'PARTNER_ENGINEER',
  //   type: 'PARTNER',
  //   phone: {
  //     mobile: {
  //       countryCode: 82,
  //       number: faker.phone.number('010-####-####'),
  //     },
  //   },
  //   partner: {
  //     uniqueId: partner._id,
  //   },
  // });
  // partnerAdmin = await User.create({
  //   name: partnerAdminName,
  //   email: partnerAdminEmail,
  //   password,
  //   role: 'PARTNER_ADMIN',
  //   type: 'PARTNER',
  //   phone: {
  //     mobile: {
  //       countryCode: 82,
  //       number: faker.phone.number('010-####-####'),
  //     },
  //   },
  // });
  // contractorAdmin = await User.create({
  //   name: contractorAdminName,
  //   email: contractorAdminEmail,
  //   password,
  //   role: 'CONTRACTOR_ADMIN',
  //   type: 'CONTRACTOR',
  //   phone: {
  //     mobile: {
  //       countryCode: 82,
  //       number: faker.phone.number('010-####-####'),
  //     },
  //   },
  // });
  complex = await ApartmentComplex.create({
    name: '문경 신원아침도시',
    address: '경북 문경시 여중1길',
    contractor: {
      uniqueId: contractor!._id,
    },
    external3DViewer: null,
  });
  type = await ApartmentUnitType.create({
    name: '48평 Type A',
    apartment: {
      complex: {
        uniqueId: complex!._id,
      },
    },
    locations,
    area: {
      exclusive: 50,
      common: 15,
      etc: 20,
    },
    viewer: null,
  });
  unit = await ApartmentUnit.create({
    dong: '103',
    ho: 205,
    apartment: {
      complex: {
        uniqueId: complex!._id,
      },
      unitType: {
        uniqueId: type!._id,
      },
    },
    resident: {
      uniqueId: resident!._id,
      name: 'Tom',
      phone: {
        mobile: {
          countryCode: 82,
          number: faker.phone.number('010-####-####'),
        },
      },
    },
    isVerified: false,
  });
  await ContractorPartner.create({
    contractor: {
      uniqueId: contractor!._id,
    },
    partner: {
      uniqueId: partner!._id,
    },
    apartment: {
      complex: {
        uniqueId: complex!._id,
      },
      unit: {
        uniqueId: unit!._id,
      },
    },
    works: ['도배'],
    status: 'ACCEPTED',
  });
  //   defect = await Defect.create({
  //     apartment: {
  //       unit: {
  //         uniqueId: unit!._id,
  //       },
  //       address: '경북 문경시 여중1길 문경 신원아침도시 103동 205호',
  //     },
  //     coordinate: {
  //       x: 10,
  //       y: 20,
  //       z: 30,
  //       latitude: 40,
  //       longitude: 50,
  //       imageId: 100,
  //     },
  //     location: '안방',
  //     status: 'PARTNER_ASSIGNED',
  //     work: {
  //       type: '도배',
  //       detail: '기타',
  //       additionalInfo: '썩음',
  //     },
  //     image: {
  //       requested: 'some url',
  //     },
  //     assignedTo: {
  //       partner: {
  //         uniqueId: partner._id,
  //       },
  //     },
  //     contractor: {
  //       uniqueId: contractor!._id,
  //     },
  //     resident: {
  //       uniqueId: resident!._id,
  //     },
  //   });
});

describe('평행공간 웹 api supertest', () => {
  let token: string | undefined;

  beforeEach(async () => {
    const logInResult = await request(app).post('/api/auth/signin').send({
      email: pspaceAdminEmail,
      password,
    });
    token = logInResult.body.tokens.access.token;
  });

  afterEach(async () => {
    await Defect.deleteMany({});
  });

  describe('GET /api/pspace/dashboard/inquiry', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/pspace/dashboard/inquiry?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });
    });
    describe('failure', () => {
      test('should return 400', async () => {
        const result = await request(app).get(`/api/pspace/dashboard/inquiry`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/pspace/dashboard/userInflow', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/pspace/dashboard/userInflow?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is mission', async () => {
        const result = await request(app).get(`/api/pspace/dashboard/userInflow`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/pspace/dashboard/defectStatistics', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/pspace/dashboard/defectStatistics?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });
    });
    describe('failure', () => {
      test('should return 400', async () => {
        const result = await request(app)
          .get(`/api/pspace/dashboard/defectStatistics`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/pspace/employees', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/pspace/employees?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
      });
    });
    describe('failure', () => {
      test('should return 400', async () => {
        const result = await request(app).get(`/api/pspace/employees`).set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('DELETE /api/pspace/empoyees', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const createdWorker = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_WORKER',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const createSubAdmin = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_SUB_ADMIN',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });

        const previousUserCount = await User.count();

        const result = await request(app)
          .delete(
            `/api/pspace/employees?user[uniqueId]=${pspaceAdmin._id}&employee[uniqueIds][]=${createdWorker._id}&employee[uniqueIds][]=${createSubAdmin._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        const currentUserCount = await User.count();
        const shouldBeNull = await User.findById(createSubAdmin._id);
        expect(result.status).toBe(httpStatus.OK);
        expect(previousUserCount).toEqual(currentUserCount + 2);
        expect(shouldBeNull).toBeNull();
      });
    });
    describe('failure', () => {
      test('should return 400', async () => {
        const createdWorker = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_WORKER',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const createSubAdmin = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_SUB_ADMIN',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });

        const previousUserCount = await User.count();

        const result = await request(app)
          .delete(
            `/api/pspace/employees?employee[uniqueIds][]=${createdWorker._id}&employee[uniqueIds][]=${createSubAdmin._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        const currentUserCount = await User.count();
        const shouldNotBeNull = await User.findById(createSubAdmin._id);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
        expect(previousUserCount).toEqual(currentUserCount);
        expect(shouldNotBeNull).not.toBeNull();
      });
    });
  });

  describe(`PUT /api/pspace/employees`, () => {
    describe('success', () => {
      test(`should return 200`, async () => {
        const createdWorker = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_WORKER',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const changedName = 'Yeonje Seo';
        const changedEmail = 'syj6350@nate.com';
        const changedPhone = {
          mobile: {
            countryCode: 82,
            number: '01000000000',
          },
        };
        const updateEmployeeDto = [
          {
            uniqueId: createdWorker._id,
            name: changedName,
            email: changedEmail,
            phone: changedPhone,
            role: 'PSPACE_SUB_ADMIN',
          },
        ];

        const result = await request(app)
          .put(`/api/pspace/employees?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ employees: updateEmployeeDto });

        const updatedUser = await User.findById(createdWorker._id);
        expect(result.status).toBe(httpStatus.OK);
        expect(updatedUser!.name).toEqual(changedName);
        expect(updatedUser!.email).toEqual(changedEmail);
        expect(updatedUser!.phone).toEqual(changedPhone);
        expect(updatedUser!.role).toEqual('PSPACE_SUB_ADMIN');
      });

      test('should not change property if input field is empty', async () => {
        const createdWorker = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_WORKER',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const changedName = 'Yeonje Seo';
        const changedEmail = 'syj63502@nate.com';
        const changedPhone = {
          mobile: {
            countryCode: 82,
            number: faker.phone.number('010-####-####'),
          },
        };
        const updateEmployeeDto = [
          {
            uniqueId: createdWorker._id,
            email: changedEmail,
            phone: changedPhone,
          },
        ];

        const result = await request(app)
          .put(`/api/pspace/employees?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ employees: updateEmployeeDto });

        const updatedUser = await User.findById(createdWorker._id);
        expect(result.status).toBe(httpStatus.OK);
        expect(updatedUser!.name).not.toEqual(changedName);
        expect(updatedUser!.name).toEqual(createdWorker.name);
        expect(updatedUser!.email).toEqual(changedEmail);
        expect(updatedUser!.phone).toEqual(changedPhone);
        expect(updatedUser!.role).toEqual('PSPACE_WORKER');
      });
    });

    describe('failure', () => {
      test(`should return 400`, async () => {
        const createdWorker = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'PSPACE_WORKER',
          type: 'PSPACE',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const changedName = 'Yeonje Seo';
        const changedEmail = 'syj63501@nate.com';
        const changedPhone = {
          mobile: {
            countryCode: 82,
            number: '01000000000',
          },
        };
        const updateEmployeeDto = [
          {
            uniqueId: createdWorker._id,
            name: changedName,
            email: changedEmail,
            phone: changedPhone,
            role: 'PSPACE_SUB_ADMIN',
          },
        ];

        const result = await request(app)
          .put(`/api/pspace/employees`)
          .set('Authorization', `Bearer ${token}`)
          .send({ employees: updateEmployeeDto });

        const updatedUser = await User.findById(createdWorker._id);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
        expect(updatedUser!.name).not.toEqual(changedName);
        expect(updatedUser!.email).not.toEqual(changedEmail);
        expect(updatedUser!.phone).not.toEqual(changedPhone);
        expect(updatedUser!.role).not.toEqual('PSPACE_SUB_ADMIN');
      });
    });
  });

  describe('GET /api/pspace/residents', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/pspace/residents?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('residents');
        expect(result.body.residents).toBeInstanceOf(Array);
        expect(result.body).toHaveProperty('totalCount');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).get(`/api/pspace/residents`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('DELETE /api/pspace/residents', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const createdUser = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'RESIDENT',
          type: 'RESIDENT',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const userCount = await User.count();

        const result = await request(app)
          .delete(`/api/pspace/residents?user[uniqueId]=${pspaceAdmin._id}&resident[uniqueIds][]=${createdUser._id}`)
          .set('Authorization', `Bearer ${token}`);

        const decreasedUserCount = await User.count();

        const deletedUser = await User.findById(createdUser._id);

        expect(result.status).toBe(httpStatus.OK);
        expect(userCount).toEqual(decreasedUserCount + 1);
        expect(deletedUser).toBeNull();
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const createdUser = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'RESIDENT',
          type: 'RESIDENT',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });
        const userCount = await User.count();

        const result = await request(app)
          .delete(`/api/pspace/residents?resident[uniqueIds][]=${createdUser._id}`)
          .set('Authorization', `Bearer ${token}`);

        const decreasedUserCount = await User.count();

        const deletedUser = await User.findById(createdUser._id);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
        expect(userCount).toEqual(decreasedUserCount);
        expect(deletedUser).not.toBeNull();
      });
    });
  });

  describe('PUT /api/pspace/residents', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const createdUser = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'RESIDENT',
          type: 'RESIDENT',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });

        const result = await request(app)
          .put(`/api/pspace/residents?user[uniqueId]=${pspaceAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            residents: [
              {
                uniqueId: createdUser._id,
                name: '변경된 이름',
                email: 'yeonjeseo@hotmail.com',
              },
            ],
          });

        const updatedUser = await User.findById(createdUser._id);

        expect(result.status).toBe(httpStatus.OK);
        expect(updatedUser!.name).toEqual('변경된 이름');
        expect(updatedUser!.email).toEqual('yeonjeseo@hotmail.com');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const createdUser = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'RESIDENT',
          type: 'RESIDENT',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });

        const result = await request(app)
          .put(`/api/pspace/residents`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            residents: [
              {
                uniqueId: createdUser._id,
                name: '변경된 이름',
                email: 'yeonjeseo@hotmail.com',
              },
            ],
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/pspace/residents/blacklist', () => {
    describe('success', () => {
      test(`should return 200`, async () => {
        const createdUser = await User.create({
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password,
          role: 'RESIDENT',
          type: 'RESIDENT',
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number('010-####-####'),
            },
          },
        });

        const toTrueResult = await request(app)
          .patch(`/api/pspace/residents/blacklist?user[uniqueId]=${pspaceAdmin._id}&resident[uniqueId]=${createdUser._id}`)
          .set('Authorization', `Bearer ${token}`);

        const blockedUser = await User.findById(createdUser._id);

        expect(toTrueResult.status).toBe(httpStatus.OK);
        expect(blockedUser!.isBlacklisted).toEqual(true);

        const toFalseResult = await request(app)
          .patch(`/api/pspace/residents/blacklist?user[uniqueId]=${pspaceAdmin._id}&resident[uniqueId]=${createdUser._id}`)
          .set('Authorization', `Bearer ${token}`);
        const unBlockedUser = await User.findById(createdUser._id);
        expect(toFalseResult.status).toBe(httpStatus.OK);
        expect(unBlockedUser!.isBlacklisted).toEqual(false);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).patch(`/api/pspace/residents/blacklist`).set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});
