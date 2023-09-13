import request from 'supertest';
import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { httpStatus } from '../utils';
import app from '../../app';
import User from '../user/user.model';
import Contractor from '../contractor/contractor.model';
import Defect from '../defect/defect.model';
import ApartmentComplex from '../apartmentComplex/apartmentComplex.model';
import ApartmentUnitType from '../apartmentUnitType/apartmentUnitType.model';
import ApartmentUnit from '../apartmentUnit/apartmentUnit.model';
import ContractorPartner from '../contractor_partner/contractor_partner.model';
import Partner from './partners.model';
import { IUserDoc } from '../user/user.interfaces';
import initializeTest from '../jest/initializeTest';
import { IContractorDoc } from '../contractor/contractor.interface';
import { IPartnerDoc } from './partners.interface';
import { IApartmentUnitDoc } from '../apartmentUnit/apartmentUnit.interface';
import { IApartmentComplexDoc } from '../apartmentComplex/apartmentComplex.interface';
import { IApartmentUnitTypeDoc } from '../apartmentUnitType/apartmentUnitType.interface';
import { IDefectDoc } from '../defect/defect.interface';
import { DefectStatus } from '../defect/defect.constant';
import { InquiryCategoryEnum } from '../inquiry/inquiry.interface';
import Inquiry from '../inquiry/inquiry.model';
import { CreatePartnerEmployeeDto, IUserPartnerDoc, UpdatePartnerEmployeeDto } from '@/modules/partners/partners.types';
import { PartnerRole, UserRole, UserType } from '../user/user.constants';

initializeTest();

let resident: IUserDoc | undefined;
let partnerEngineer: IUserDoc | undefined;
let partnerAdmin: IUserDoc;
let contractor: IContractorDoc | undefined;
let partner: IPartnerDoc;
let unit: IApartmentUnitDoc | undefined;
let complex: IApartmentComplexDoc | undefined;
let type: IApartmentUnitTypeDoc | undefined;
let defect: IDefectDoc;
const locations = ['거실', '주방', '침실1', '침실2', '안방', '화장실1', '화장실2', '베란다1', '베란다2', '다목적실'];

const residentName = faker.name.fullName();
const residentEmail = faker.internet.email().toLowerCase();
const partnerEngineerName = faker.name.fullName();
const partnerEngineerEmail = faker.internet.email().toLowerCase();
const partnerAdminName = faker.name.fullName();
const partnerAdminEmail = faker.internet.email().toLowerCase();
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
  partnerEngineer = await User.create({
    name: partnerEngineerName,
    email: partnerEngineerEmail,
    password,
    role: 'PARTNER_ENGINEER',
    type: 'PARTNER',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
    },
    partner: {
      uniqueId: partner._id,
    },
  });
  partnerAdmin = await User.create({
    name: partnerAdminName,
    email: partnerAdminEmail,
    password,
    role: 'PARTNER_ADMIN',
    type: 'PARTNER',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
    },
    partner: {
      uniqueId: partner._id,
    },
  });
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
});

describe('협력사 앱 api supertest', () => {
  let token: string | undefined;

  beforeEach(async () => {
    const logInResult = await request(app).post('/api/auth/signin').send({
      email: partnerAdminEmail,
      password,
    });
    token = logInResult.body.tokens.access.token;

    defect = await Defect.create({
      apartment: {
        unit: {
          uniqueId: unit!._id,
        },
        address: '경북 문경시 여중1길 문경 신원아침도시 103동 205호',
      },
      coordinate: {
        x: 10,
        y: 20,
        z: 30,
        latitude: 40,
        longitude: 50,
        imageId: 100,
      },
      location: '안방',
      status: 'PARTNER_ASSIGNED',
      work: {
        type: '도배',
        detail: '기타',
        additionalInfo: '썩음',
      },
      image: {
        requested: 'some url',
      },
      assignedTo: {
        partner: {
          uniqueId: partner._id,
        },
      },
      contractor: {
        uniqueId: contractor!._id,
      },
      resident: {
        uniqueId: resident!._id,
      },
    });
  });

  afterEach(async () => {
    await Defect.deleteMany({});
  });

  describe('GET /api/partners/admin/employees', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${partner!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('employees');
        expect(result.body.employees).toBeInstanceOf(Array);
        result.body.employees.forEach((employee: any) => {
          expect(employee).not.toHaveProperty('password');
        });
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });

      test('should return 403 if session user has no authority', async () => {
        const engineer = await request(app).post('/api/auth/signin').send({
          email: partnerEngineerEmail,
          password,
        });
        const newToken = engineer.body.tokens.access.token;

        const result = await request(app)
          .get(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${partner!._id}`)
          .set('Authorization', `Bearer ${newToken}`);

        expect(result.status).toBe(httpStatus.FORBIDDEN);
      });
    });
  });

  describe('GET /api/partners/admin/defects', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/defects?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${partner!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('apartments');
        expect(result.body.apartments).toBeInstanceOf(Array);
        result.body.apartments.forEach((apartment: any) => {
          expect(apartment.defects).toBeInstanceOf(Array);
        });
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/defects?user[uniqueId]=${partnerAdmin!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(400);
      });
    });
  });

  describe('PATCH /api/partners/admin/defects/assign', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .patch(
            `/api/partners/admin/defects/assign?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${
              partner!._id
            }&defect[uniqueId]=${defect!._id}`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            engineer: {
              uniqueId: partnerEngineer!._id,
            },
          });

        expect(result.status).toBe(httpStatus.OK);

        const currentDefect = await Defect.findById(defect!._id);
        expect(defect.status).not.toEqual(currentDefect!.status);
        expect(currentDefect!.status).toEqual(DefectStatus.SCHEDULED);
        expect(currentDefect!.assignedTo.partner.engineer.uniqueId).toEqual(partnerEngineer!._id);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .patch(`/api/partners/admin/defects/assign?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${partner!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            engineer: {
              uniqueId: partnerEngineer!._id,
            },
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/partners/admin/defects/reject', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .patch(
            `/api/partners/admin/defects/reject?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${
              partner!._id
            }&defect[uniqueId]=${defect!._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        const currentDefect = await Defect.findById(defect!._id);
        expect(result.status).toBe(httpStatus.OK);
        expect(currentDefect!.status).toEqual(DefectStatus.REJECTED);
        expect(defect!.status).not.toEqual(currentDefect!.status);
        expect(currentDefect!.assignedTo.partner.engineer.uniqueId).toBe(null);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .patch(`/api/partners/admin/defects/reject?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${partner!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
      test('should return 404 if defect not exist', async () => {
        const result = await request(app)
          .patch(
            `/api/partners/admin/defects/reject?user[uniqueId]=${partnerAdmin!._id}&partner[uniqueId]=${
              partner!._id
            }&defect[uniqueId]=${new Types.ObjectId()}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });

  describe('POST /api/partners/admin/inquiry', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const body = {
          inquiry: {
            title: '협력사 문의 제목',
            category: InquiryCategoryEnum.APP,
            content: '협력사에서 평행공간으로 문의하는 제목입니다.',
          },
        };
        const result = await request(app)
          .post(`/api/partners/admin/inquiry?user[uniqueId]=${partnerAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(body);

        const [createdInquiry] = await Inquiry.find();
        expect(result.status).toBe(httpStatus.OK);
        expect(createdInquiry!.author.uniqueId).toEqual(partnerAdmin._id);
        expect(createdInquiry!.author.partner.uniqueId).toEqual(partnerAdmin.partner.uniqueId);
      });
    });

    describe('failure', () => {
      test('should return 400 if send wrong request body or required query string is missing', async () => {
        const body = {
          inquiry: {
            title: '협력사 문의 제목',
            content: '협력사에서 평행공간으로 문의하는 제목입니다.',
          },
        };
        const results = await Promise.all([
          request(app)
            .post(`/api/partners/admin/inquiry?user[uniqueId]=${partnerAdmin._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(body),
          request(app)
            .post(`/api/partners/admin/inquiry`)
            .set('Authorization', `Bearer ${token}`)
            .send({
              inquiry: {
                title: '협력사 문의 제목',
                content: '협력사에서 평행공간으로 문의하는 제목입니다.',
                category: InquiryCategoryEnum.APP,
              },
            }),
        ]);

        results.forEach((result) => expect(result.status).toBe(httpStatus.BAD_REQUEST));
      });
    });
  });

  describe('GET /api/partners/admin/inquiry', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/inquiry?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('inquiries');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/inquiry?user[uniqueId]=${partnerAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/admin/dashboard/notices', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/dashboard/notices?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('notices');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/dashboard/notices?user[uniqueId]=${partnerAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/admin/dashboard/statistics', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/admin/dashboard/statistics?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('defect');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/dashboard/notices?user[uniqueId]=${partnerAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /api/partners/admin/employees', () => {
    afterAll(async () => {
      // TODO should empty all employees after this test suite finishes
    });
    describe('success', () => {
      test('should return 200', async () => {
        const createPartnerEmployee: CreatePartnerEmployeeDto = {
          employee: {
            code: 'abcd1234',
          },
          password: 'aaaa1111',
          name: '이상우',
          email: faker.internet.email(),
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number(),
            },
          },
          role: PartnerRole.PARTNER_ENGINEER,
        };

        const beforeCount = await User.count();

        const result = await request(app)
          .post(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}`)
          .send(createPartnerEmployee)
          .set('Authorization', `Bearer ${token}`);

        const afterCount = await User.count();

        expect(result.status).toBe(httpStatus.OK);
        expect(afterCount).toBe(beforeCount + 1);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const createPartnerEmployee: CreatePartnerEmployeeDto = {
          employee: {
            code: 'abcd1234',
          },
          password: 'aaaa1111',
          name: '이상우',
          email: faker.internet.email(),
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number(),
            },
          },
          role: PartnerRole.PARTNER_ENGINEER,
        };

        const beforeCount = await User.count();

        const result = await request(app)
          .post(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin._id}`)
          .send(createPartnerEmployee)
          .set('Authorization', `Bearer ${token}`);

        const afterCount = await User.count();

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
        expect(beforeCount).toBe(afterCount);
      });
    });
  });

  describe('DELETE /api/partners/admin/employees', () => {
    let employee: IUserPartnerDoc;
    beforeEach(async () => {
      employee = (await User.create({
        employee: {
          code: faker.random.words(10),
        },
        name: faker.name.fullName(),
        phone: {
          mobile: {
            countryCode: 82,
            number: faker.phone.number(),
          },
        },
        password: 'aaaa1111',
        email: faker.internet.email(),
        role: UserRole.PARTNER_ENGINEER,
        type: UserType.PARTNER,
        partner: {
          uniqueId: partner._id,
        },
      })) as IUserPartnerDoc;
    });

    describe('success', () => {
      test('should return 200', async () => {
        const beforeCount = await User.count();

        const result = await request(app)
          .delete(
            `/api/partners/admin/employees?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}&employee[uniqueId]=${employee._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        const afterCount = await User.count();

        expect(result.status).toBe(httpStatus.OK);
        expect(afterCount).toBe(beforeCount - 1);
      });
    });

    describe('failure', () => {
      test('should return 400 is required query string is missing', async () => {
        const beforeCount = await User.count();

        const result = await request(app)
          .delete(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin._id}&employee[uniqueId]=${employee._id}`)
          .set('Authorization', `Bearer ${token}`);

        const afterCount = await User.count();

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
        expect(afterCount).toBe(beforeCount);
      });

      test('should return 401 if partner uniqueId is not matching', async () => {
        const beforeCount = await User.count();

        const result = await request(app)
          .delete(
            `/api/partners/admin/employees?user[uniqueId]=${
              partnerAdmin._id
            }&partner[uniqueId]=${new Types.ObjectId()}&employee[uniqueId]=${employee._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        const afterCount = await User.count();

        expect(result.status).toBe(httpStatus.FORBIDDEN);
        expect(afterCount).toBe(beforeCount);
      });
    });
  });

  describe('PUT /api/partners/admin/employee', () => {
    let employee: IUserPartnerDoc;
    beforeAll(async () => {
      employee = (await User.create({
        employee: {
          code: faker.random.words(10),
        },
        name: faker.name.fullName(),
        phone: {
          mobile: {
            countryCode: 82,
            number: faker.phone.number(),
          },
        },
        password: 'aaaa1111',
        email: faker.internet.email(),
        role: UserRole.PARTNER_ENGINEER,
        type: UserType.PARTNER,
        partner: {
          uniqueId: partner._id,
        },
      })) as IUserPartnerDoc;
    });

    describe('success', () => {
      test('should return 200', async () => {
        const targetEmployeeCode = faker.random.words(10);

        const updatePartnerEmployeeDto: UpdatePartnerEmployeeDto = {
          employee: {
            code: targetEmployeeCode,
          },
          password: 'aaaa1111',
          name: '이상우',
          email: faker.internet.email(),
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number(),
            },
          },
          role: PartnerRole.PARTNER_ENGINEER,
        };

        const result = await request(app)
          .put(
            `/api/partners/admin/employees?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}&employee[uniqueId]=${employee._id}`
          )
          .set('Authorization', `Bearer ${token}`)
          .send(updatePartnerEmployeeDto);

        const updatedEmployee = await User.findOne({ _id: employee._id });
        const updatedEmployeeCode = updatedEmployee!.employee!.code;

        expect(result.status).toBe(httpStatus.OK);
        expect(updatedEmployeeCode).toEqual(targetEmployeeCode);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const targetEmployeeCode = faker.random.words(10);

        const updatePartnerEmployeeDto: UpdatePartnerEmployeeDto = {
          employee: {
            code: targetEmployeeCode,
          },
          password: 'aaaa1111',
          name: '이상우',
          email: faker.internet.email(),
          phone: {
            mobile: {
              countryCode: 82,
              number: faker.phone.number(),
            },
          },
          role: PartnerRole.PARTNER_ENGINEER,
        };

        const result = await request(app)
          .put(`/api/partners/admin/employees?user[uniqueId]=${partnerAdmin._id}&partner[uniqueId]=${partner._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updatePartnerEmployeeDto);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/admin/employees/engineers', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/employees/engineers?partner[uniqueId]=${partner._id}&user[uniqueId]=${partnerAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('totalCount');
        expect(result.body).toHaveProperty('totalPage');
        expect(result.body).toHaveProperty('engineers');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/admin/employees/engineers?user[uniqueId]=${partnerAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});
