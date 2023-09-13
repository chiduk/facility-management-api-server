import request from 'supertest';
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import app from '../../app';
import User from '../user/user.model';
import Contractor from '../contractor/contractor.model';
import Defect from '../defect/defect.model';
import Inquiry from '../inquiry/inquiry.model';
import Faq from '../faq/faq.model';
import ApartmentComplex from '../apartmentComplex/apartmentComplex.model';
import ApartmentUnitType from '../apartmentUnitType/apartmentUnitType.model';
import ApartmentUnit from '../apartmentUnit/apartmentUnit.model';
import ContractorPartner from '../contractor_partner/contractor_partner.model';
import Partner from '../partners/partners.model';
import { IUserDoc } from '../user/user.interfaces';
import initializeTest from '../jest/initializeTest';
import { IContractorDoc } from '../contractor/contractor.interface';
import { IPartnerDoc } from '../partners/partners.interface';
import { CreateInquiryBody } from '@/modules/inquiry/inquiry.interface';
import { IApartmentUnitDoc } from '../apartmentUnit/apartmentUnit.interface';
import { IApartmentComplexDoc } from '../apartmentComplex/apartmentComplex.interface';
import { IApartmentUnitTypeDoc } from '../apartmentUnitType/apartmentUnitType.interface';
import { toObjectId, httpStatus } from '../utils';
import { IDefectDoc } from '../defect/defect.interface';

const { Types } = mongoose;

enum InquiryCategoryEnum {
  VIEWER = 'VIEWER',
  APP = 'APP',
  CONTRACTOR = 'CONTRACTOR',
}

initializeTest();

let user: IUserDoc | undefined;
let contractor: IContractorDoc | undefined;
let partner: IPartnerDoc;
let unit: IApartmentUnitDoc | undefined;
let complex: IApartmentComplexDoc | undefined;
let type: IApartmentUnitTypeDoc | undefined;
let newUnit: IApartmentUnitDoc;
let defect: IDefectDoc;
const locations = ['거실', '주방', '침실1', '침실2', '안방', '화장실1', '화장실2', '베란다1', '베란다2', '다목적실'];

const name = faker.name.fullName();
const email = faker.internet.email().toLowerCase();
const password = 'aaaa1111';
beforeAll(async () => {
  user = await User.create({
    name,
    email,
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
      uniqueId: user!._id,
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
  newUnit = await ApartmentUnit.create({
    dong: '103',
    ho: 204,
    apartment: {
      complex: {
        uniqueId: complex!._id,
      },
      unitType: {
        uniqueId: type!._id,
      },
    },
    resident: {
      uniqueId: toObjectId('640edd51ba6785256102e28e'),
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

  defect = await Defect.create({
    apartment: {
      unit: {
        uniqueId: unit._id,
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
      uniqueId: contractor._id,
    },
    resident: {
      uniqueId: user._id,
    },
  });
});

describe('입주민 앱 api supertest', () => {
  let token: string | undefined;

  beforeEach(async () => {
    const logInResult = await request(app).post('/api/auth/signin').send({
      email,
      password,
    });
    token = logInResult.body.tokens.access.token;
  });

  describe('GET /api/residents/address/complexes', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/address/complexes?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });
      test('should return list of complex', async () => {
        const result = await request(app)
          .get(`/api/residents/address/complexes?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.body).toHaveProperty('complexes');
        expect(result.body.complexes).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).get(`/api/residents/address/complexes`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/address/dong', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/address/dong?user[uniqueId]=${user!._id}&apartment[complex][uniqueId]=${complex!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('dongs');
        expect(result.body.dongs).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/residents/address/dong?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/address/ho', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/residents/address/ho?user[uniqueId]=${user!._id}&apartment[complex][uniqueId]=${
              complex!._id
            }&apartment[unit][dong]=${unit!.dong}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('hos');
        expect(result.body.hos).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/residents/address/ho?user[uniqueId]=${user!._id}&apartment[complex][uniqueId]=${complex!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/myApartments', () => {
    describe('성공', () => {
      test('성공 시 200 응답 반환', async () => {
        const result = await request(app)
          .get(`/api/residents/myApartments?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
      });
      test('성공 시  body 내에 units 라는 key로 배열 반환', async () => {
        const result = await request(app)
          .get(`/api/residents/myApartments?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.body).toHaveProperty('units');
        expect(result.body.units).toBeInstanceOf(Array);
      });
    });

    describe('실패', () => {
      test('토큰이 없을 경우 401 응답 반환', async () => {
        const result = await request(app).get(`/api/residents/myApartments?user[uniqueId]=${user!._id}`);
        expect(result.status).toBe(401);
      });
      test('토큰이 변조되었을 경우 401 응답 반환', async () => {
        const result = await request(app)
          .get(`/api/residents/myApartments?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}123`);
        expect(result.status).toBe(401);
      });
    });
  });

  describe('DELETE /api/residents/myApartment', () => {
    let createdUnit: IApartmentUnitDoc | null;
    beforeEach(async () => {
      createdUnit = await ApartmentUnit.create({
        dong: '103',
        ho: 206,
        apartment: {
          complex: {
            uniqueId: complex!._id,
          },
          unitType: {
            uniqueId: type!._id,
          },
        },
        resident: {
          uniqueId: user!._id,
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
    });

    describe('success', () => {
      test('should return 200 if successfully deleted', async () => {
        const result = await request(app)
          .delete(`/api/residents/myApartments?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${createdUnit!._id}`)
          .set('Authorization', `Bearer ${token}`);

        const deletedUnit = await ApartmentUnit.findOne({
          _id: createdUnit!._id,
        });

        expect(result.status).toBe(httpStatus.OK);
        expect(deletedUnit!.resident.uniqueId).toBeNull();
      });
    });
    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .delete(`/api/residents/myApartments?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        const deletedUnit = await ApartmentUnit.findOne({
          _id: createdUnit!._id,
        });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
        expect(deletedUnit!.resident.uniqueId).not.toBeNull();
      });
    });
  });

  describe('GET /residents/myApartments/supportedWorks', () => {
    describe('Success', () => {
      test('API 요청 성공 시 응답 코드 200을 반환해야 한다.', async () => {
        const result = await request(app)
          .get(
            `/api/residents/myApartments/supportedWorks?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('works');
        result.body.works.forEach((work: any) => {
          expect(work).toHaveProperty('type');
          expect(work).toHaveProperty('details');
          expect(work.details).toBeInstanceOf(Array);
        });
      });
    });

    describe('실패', () => {
      test('returns 400 error when required query string is missing', async () => {
        const [missingUnit, missingUser] = await Promise.all([
          request(app)
            .get(`/api/residents/myApartments/supportedWorks?user[uniqueId]=${user!._id}`)
            .set('Authorization', `Bearer ${token}`),
          request(app)
            .get(`/api/residents/myApartments/supportedWorks?apartment[unit][uniqueId]=${unit!._id}`)
            .set('Authorization', `Bearer ${token}`),
        ]);
        expect(missingUnit.status).toBe(httpStatus.BAD_REQUEST);
        expect(missingUser.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/residents/myApartments/default', () => {
    afterAll(async () => {
      user!.default.apartment.unit.uniqueId = null;
      await user!.save();
    });

    describe('success', () => {
      test("The user's default apartment should be changed", async () => {
        const previous = user!.default.apartment.unit.uniqueId;

        const result = await request(app)
          .patch(`/api/residents/myApartments/default?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`);
        const updatedUser = await User.findOne({ _id: user!._id });
        const next = updatedUser!.default.apartment.unit.uniqueId;
        expect(result.status).toBe(httpStatus.OK);
        expect(previous).toBe(null);
        expect(next).toBeInstanceOf(Types.ObjectId);
      });
    });

    describe('실패', () => {
      test('returns 404 error when unit not exist', async () => {
        const result = await request(app)
          .patch(
            `/api/residents/myApartments/default?user[uniqueId]=${
              user!._id
            }&apartment[unit][uniqueId]=640edd51ba6785256102e21f`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });

      test('returns 400 error when required query string is missing', async () => {
        const [missingUnit, missingUser] = await Promise.all([
          request(app)
            .patch(`/api/residents/myApartments/default?user[uniqueId]=${user!._id}`)
            .set('Authorization', `Bearer ${token}`),
          request(app)
            .patch(`/api/residents/myApartments/default?apartment[unit][uniqueId]=${unit!._id}`)
            .set('Authorization', `Bearer ${token}`),
        ]);
        expect(missingUnit.status).toEqual(missingUser.status);
        expect(missingUser.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/myApartments/locations', () => {
    describe('success', () => {
      test('returns 200 if request success', async () => {
        const result = await request(app)
          .get(`/api/residents/myApartments/locations?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('locations');
        expect(result.body.locations).toBeInstanceOf(Array);
        expect(result.body.locations).toEqual(locations);
      });

      test('returns 200 if unit not exist', async () => {
        const result = await request(app)
          .get(
            `/api/residents/myApartments/locations?user[uniqueId]=${
              user!._id
            }&apartment[unit][uniqueId]=640edd51ba6785256102e21f`
          )
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('locations');
        expect(result.body.locations.length).toBe(0);
      });
    });

    describe('failure', () => {
      test('returns 400 error when required query string is missing', async () => {
        const [missingUnit, missingUser] = await Promise.all([
          request(app)
            .get(`/api/residents/myApartments/locations?user[uniqueId]=${user!._id}`)
            .set('Authorization', `Bearer ${token}`),
          request(app)
            .get(`/api/residents/myApartments/locations?apartment[unit][uniqueId]=${unit!._id}`)
            .set('Authorization', `Bearer ${token}`),
        ]);
        expect(missingUnit.status).toEqual(missingUser.status);
        expect(missingUser.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/residents/myApartments/verify', () => {
    describe('success', () => {
      test('returns 200 if success', async () => {
        const result = await request(app)
          .patch(
            `/api/residents/myApartments/verify?user[uniqueId]=${user!._id}&apartment[complex][uniqueId]=${
              unit!.apartment.complex.uniqueId
            }&apartment[unit][dong]=${unit!.dong}&apartment[unit][ho]=${unit!.ho}`
          )
          .set('Authorization', `Bearer ${token}`);
        const updatedUnit = await ApartmentUnit.findOne({ _id: unit!._id });

        expect(result.status).toBe(httpStatus.OK);
        expect(updatedUnit!.isVerified).toBe(true);
      });
    });

    describe('failure', () => {
      test('returns 403 if unit owner not matches', async () => {
        const result = await request(app)
          .patch(
            `/api/residents/myApartments/verify?user[uniqueId]=${user!._id}&apartment[complex][uniqueId]=${
              newUnit.apartment.complex.uniqueId
            }&apartment[unit][dong]=${newUnit.dong}&apartment[unit][ho]=${newUnit.ho}`
          )
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(403);
      });
    });
  });

  describe('POST /api/residents/myDefects', () => {
    describe('success', () => {
      test('return 200 if success', async () => {
        const result = await request(app)
          .post(`/api/residents/myDefects?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'multipart/form-data')
          .field('defect[location]', '거실')
          .field('defect[work][type]', '도배')
          .field('defect[work][detail]', '찢어짐')
          .field('defect[coordinate][x]', 10)
          .field('defect[coordinate][y]', 10)
          .field('defect[coordinate][z]', 10)
          .field('defect[coordinate][latitude]', 10)
          .field('defect[coordinate][longitude]', 10)
          .field('defect[coordinate][imageId]', 10)
          .attach('defect[image][requested]', './defect.jpeg');

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('defect');
        expect(result.body.defect).toHaveProperty('uniqueId');

        const createdDefect = await Defect.findById(toObjectId(result.body.defect.uniqueId));
        expect(createdDefect).not.toBeNull();
      });
    });

    describe('failure', () => {
      test('returns 400 if image not attached', async () => {
        const result = await request(app)
          .post(`/api/residents/myDefects?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'multipart/form-data')
          .field('defect[location]', '거실')
          .field('defect[work][type]', '도배')
          .field('defect[work][detail]', '찢어짐')
          .field('defect[coordinate][x]', 10)
          .field('defect[coordinate][y]', 10)
          .field('defect[coordinate][z]', 10)
          .field('defect[coordinate][latitude]', 10)
          .field('defect[coordinate][longitude]', 10)
          .field('defect[coordinate][imageId]', 10);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/myDefects', () => {
    describe('success', () => {
      test('should return status code 200', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
      });
      test('should return an object that has key name "defects" which is instance of Array', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.body).toHaveProperty('defects');
        expect(result.body.defects).toBeInstanceOf(Array);
      });
      test('should return empty array if defects not exist', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${newUnit._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('defects');
        expect(result.body.defects).toHaveLength(0);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const results = await Promise.all([
          request(app)
            .get(`/api/residents/myDefects?apartment[unit][uniqueId]=${newUnit._id}`)
            .set('Authorization', `Bearer ${token}`),
          request(app).get(`/api/residents/myDefects?user[uniqueId]=${user!._id}`).set('Authorization', `Bearer ${token}`),
          request(app).get(`/api/residents/myDefects`).set('Authorization', `Bearer ${token}`),
        ]);

        results.forEach((result) => expect(result.status).toBe(httpStatus.BAD_REQUEST));
      });

      test('should return 404 if apartment unit is not exist', async () => {
        const randomOid = String(new mongoose.Types.ObjectId());
        const result = await request(app)
          .get(`/api/residents/myDefects?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${randomOid}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });

  describe('GET /api/residents/myDefects/filter', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects/filter?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });

      test('should have property named "defects", which includes "groupedDefects" and "allDefects"', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects/filter?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${unit!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.body).toHaveProperty('defects');
        expect(result.body.defects).toHaveProperty('groupedDefects');
        expect(result.body.defects.groupedDefects).toBeInstanceOf(Array);
        expect(result.body.defects).toHaveProperty('allDefects');
        expect(result.body.defects.allDefects).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 404 if apartment unit not exist', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects/filter?user[uniqueId]=${user!._id}&apartment[unit][uniqueId]=${newUnit!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });

  describe('GET /api/residents/myDefects/specific', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects/specific?user[uniqueId]=${user!._id}&defect[uniqueId]=${defect!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });
      test('should include property named "defect"', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects/specific?user[uniqueId]=${user!._id}&defect[uniqueId]=${defect!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.body).toHaveProperty('defect');
      });
    });
    describe('failure', () => {
      test('should return 404 if defect not exist', async () => {
        const randomOid = String(new mongoose.Types.ObjectId());

        const result = await request(app)
          .get(`/api/residents/myDefects/specific?user[uniqueId]=${user!._id}&defect[uniqueId]=${randomOid}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });

  describe('PATCH /api/residents/myDefects/confirm', () => {
    /**
     * 각 케이스마다 수리완료된 defect 만들기
     */
    let repairedDefect: IDefectDoc;

    beforeEach(async () => {
      repairedDefect = await Defect.create({
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
        location: '침실',
        status: 'REPAIRED',
        work: {
          type: '도배',
          detail: '기타',
          additionalInfo: '썩음',
        },
        date: {
          requested: '2023-04-01',
          repaired: '2023-04-04',
        },
        image: {
          requested: 'some url',
          repaired: 'some url2',
        },
        assignedTo: {
          partner: {
            uniqueId: partner!._id,
          },
        },
        contractor: {
          uniqueId: contractor!._id,
        },
        resident: {
          uniqueId: user!._id,
        },
      });
    });

    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .patch(`/api/residents/myDefects/confirm?user[uniqueId]=${user!._id}&defect[uniqueId]=${repairedDefect._id}`)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('resident[signature]', './defect.jpeg');
        expect(result.status).toBe(httpStatus.OK);
      });

      test('should change status of the defect', async () => {
        await request(app)
          .patch(`/api/residents/myDefects/confirm?user[uniqueId]=${user!._id}&defect[uniqueId]=${repairedDefect._id}`)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('resident[signature]', './defect.jpeg');

        const changedDefect = await Defect.findOne({ _id: repairedDefect._id });

        expect(changedDefect!.status).toEqual('CONFIRMED');
        expect(changedDefect!.date.confirmed).not.toBeNull();
        expect(changedDefect!.resident.signature).not.toBeNull();
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const results = await Promise.all([
          request(app)
            .patch(`/api/residents/myDefects/confirm?defect[uniqueId]=${repairedDefect._id}`)
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'multipart/form-data')
            .attach('resident[signature]', './defect.jpeg'),
          request(app)
            .patch(`/api/residents/myDefects/confirm?user[uniqueId]=${user!._id}`)
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'multipart/form-data')
            .attach('resident[signature]', './defect.jpeg'),
        ]);

        results.forEach((result) => expect(result.status).toBe(httpStatus.BAD_REQUEST));
      });

      test('should return 404 if defect not exist', async () => {
        const randomOid = new mongoose.Types.ObjectId();
        const result = await request(app)
          .patch(`/api/residents/myDefects/confirm?user[uniqueId]=${user!._id}&defect[uniqueId]=${randomOid}`)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('resident[signature]', './defect.jpeg');

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });
  describe('GET /api/residents/faq', () => {
    beforeAll(async () => {
      await Promise.all([
        Faq.create({
          category: 'APP',
          qna: [
            {
              question: '앱 실행이 너무 느려요.',
              answer: '휴대폰 전원을 껐다 켜 보세요.',
            },
            {
              question: '앱 사용법을 잘 모르겠어요.',
              answer: '튜토리얼을 한번 실행해 보세요.',
            },
          ],
        }),
        Faq.create({
          category: 'VIEWER',
          qna: [
            {
              question: '스티커(포인트)가 안 찍혀요.',
              answer: '고객 센터로 문의 바랍니다.',
            },
            {
              question: '사용법을 모르겠어요.',
              answer: '튜토리얼을 한번 실행해 보세요.',
            },
          ],
        }),
        Faq.create({
          category: 'DEFECT',
          qna: [
            {
              question: '용어를 몰라 신청을 못하겠어요.',
              answer: '튜토리얼을 한번 실행해 보세요.',
            },
          ],
        }),
      ]);
    });

    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/faq?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });
      test('should return faqs array', async () => {
        const result = await request(app)
          .get(`/api/residents/faq?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.body).toHaveProperty('faqs');
        expect(result.body.faqs).toBeInstanceOf(Array);
      });
      test('filter should work', async () => {
        const result = await request(app)
          .get(`/api/residents/faq?user[uniqueId]=${user!._id}&faq[category]=APP`)
          .set('Authorization', `Bearer ${token}`);

        const categories = result.body.faqs.map((faq: any) => faq.category);
        expect(categories.every((category: string) => category === 'APP')).toBe(true);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/residents/faq?faq[category]=APP`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/inquiry', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/inquiry?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('inquiries');
      });
      test('inquiries should include answered, unanswered', async () => {
        const result = await request(app)
          .get(`/api/residents/inquiry?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.body.inquiries).toHaveProperty('answered');
        expect(result.body.inquiries.answered).toBeInstanceOf(Array);
        expect(result.body.inquiries).toHaveProperty('unanswered');
        expect(result.body.inquiries.unanswered).toBeInstanceOf(Array);
      });
      test('should return user owned inquiries only', async () => {
        await Promise.all([
          Inquiry.create({
            title: '제목',
            content: '하자 등록했는데 하자가 아니었어요. 어떡하죠?',
            status: 'UNANSWERED',
            category: InquiryCategoryEnum.APP,
            author: {
              uniqueId: user!._id,
              name: 'Tom',
              email: 'username@example.com',
              type: 'RESIDENT',
            },
            answer: {
              content: null,
            },
            defect: {
              uniqueId: null,
            },
          }),
          Inquiry.create({
            title: '제목',
            content: '앱이 맛이 갔어요',
            status: 'UNANSWERED',
            category: InquiryCategoryEnum.APP,
            author: {
              uniqueId: new Types.ObjectId(),
              name: '사람1',
              email: 'username@example.com',
              type: 'RESIDENT',
            },
            answer: {
              content: null,
            },
            defect: {
              uniqueId: null,
            },
          }),
          Inquiry.create({
            title: '제목',
            content: '뷰어 느려요',
            status: 'UNANSWERED',
            category: InquiryCategoryEnum.VIEWER,
            author: {
              uniqueId: user!._id,
              name: 'Tom',
              email: 'username@example.com',
              type: 'RESIDENT',
            },
            answer: {
              content: null,
            },
            defect: {
              uniqueId: null,
            },
          }),
        ]);

        const result = await request(app)
          .get(`/api/residents/inquiry?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        const authors: any[] = [];
        result.body.inquiries.unanswered.forEach((inquiry: any) => authors.push(inquiry.author.uniqueId));

        expect(authors.every((uniqueId: any) => String(uniqueId) === String(user!._id))).toBe(true);
        expect(result.body.inquiries.unanswered.length).toBe(2);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).get(`/api/residents/inquiry`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /api/residents/inquiry', () => {
    describe('success', () => {
      let body = {
        inquiry: {
          category: InquiryCategoryEnum.APP,
          title: '제목임당',
          content: '본문임당',
        } as CreateInquiryBody,
      };

      test('should return 200', async () => {
        const result = await request(app)
          .post(`/api/residents/inquiry?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(body);

        expect(result.status).toBe(httpStatus.OK);
      });
      test('should increase documents count by 1', async () => {
        const previousCount = await Inquiry.count();
        body = {
          inquiry: {
            category: InquiryCategoryEnum.APP,
            title: '제목임당222',
            content: '본문임당222',
          } as CreateInquiryBody,
        };

        await request(app)
          .post(`/api/residents/inquiry?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(body);

        const nextCount = await Inquiry.count();

        expect(previousCount).toBe(nextCount - 1);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .post(`/api/residents/inquiry`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            inquiry: {
              category: 'APP',
              title: '제목임당22',
              content: '본문임당222',
            },
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
      test('should return 400 if send insufficient body params', async () => {
        const result = await request(app)
          .post(`/api/residents/inquiry?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            inquiry: {
              title: '제목임당22',
              content: '본문임당222',
              email: 'yeonjeseo@hotmail.com',
            },
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/myDefects/repaired', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/myDefects/repaired?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('defects');
        expect(result.body.defects).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).get(`/api/residents/myDefects/repaired`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/residents/notifications', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/residents/notifications?user[uniqueId]=${user!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('notifications');
        expect(result.body.notifications).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app).get(`/api/residents/notifications`).set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});
