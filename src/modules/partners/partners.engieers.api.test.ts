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

initializeTest();

let resident: IUserDoc | undefined;
let partnerEngineer: IUserDoc | undefined;
let contractor: IContractorDoc | undefined;
let partner: IPartnerDoc;
let unit: IApartmentUnitDoc | undefined;
let complex: IApartmentComplexDoc | undefined;
let type: IApartmentUnitTypeDoc | undefined;
let defect: IDefectDoc;
const locations = ['거실', '주방', '침실1', '침실2', '안방', '화장실1', '화장실2', '베란다1', '베란다2', '다목적실'];

const residentName = faker.name.fullName();
const residentEmail = faker.internet.email().toLowerCase();
const partnerName = faker.name.fullName();
const partnerEmail = faker.internet.email().toLowerCase();
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
    name: partnerName,
    email: partnerEmail,
    password,
    role: 'PARTNER_ENGINEER',
    type: 'PARTNER',
    phone: {
      mobile: {
        countryCode: 82,
        number: faker.phone.number('010-####-####'),
      },
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
      email: partnerEmail,
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
      status: 'SCHEDULED',
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
          engineer: {
            uniqueId: partnerEngineer!._id,
          },
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

  describe('GET /api/partners/engineers/myTasks/complexes', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/complexes?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
      });

      test('should contain array of complex info', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/complexes?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.body).toHaveProperty('complexes');
        expect(result.body.complexes).toBeInstanceOf(Array);
        result.body.complexes.forEach((complexInfo: any) => {
          expect(complexInfo).toHaveProperty('scheduledCount');
          expect(complexInfo).toHaveProperty('uniqueId');
          expect(complexInfo).toHaveProperty('address');
          expect(complexInfo).toHaveProperty('name');
        });
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string  is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/complexes`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/engineers/myTasks/dong', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/myTasks/dong?user[uniqueId]=${partnerEngineer!._id}&apartment[complex][uniqueId]=${
              complex!._id
            }`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
      });

      test('should contains an array of string', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/myTasks/dong?user[uniqueId]=${partnerEngineer!._id}&apartment[complex][uniqueId]=${
              complex!._id
            }`
          )
          .set('Authorization', `Bearer ${token}`);
        expect(result.body).toHaveProperty('dongs');
        expect(result.body.dongs).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should returns 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/dong?apartment[complex][uniqueId]=${complex!._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/engineers/myTasks/defects/specific', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/myTasks/defects/specific?user[uniqueId]=${partnerEngineer!._id}&defect[uniqueId]=${
              defect!._id
            }`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('defect');
      });
    });

    describe('failure', () => {
      test('should return 404 if defect not exist', async () => {
        const randomOid = new Types.ObjectId();
        const result = await request(app)
          .get(
            `/api/partners/engineers/myTasks/defects/specific?user[uniqueId]=${
              partnerEngineer!._id
            }&defect[uniqueId]=${randomOid}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });

      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/defects/specific?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/partners/engineers/myTasks/repaired', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const previousStatus = defect.status;
        const result = await request(app)
          .patch(
            `/api/partners/engineers/myTasks/repaired?user[uniqueId]=${partnerEngineer!._id}&defect[uniqueId]=${defect!._id}`
          )
          .set('Authorization', `Bearer ${token}`)
          .attach('defect[image][completed]', './defect.jpeg');

        const currentStatus = (await Defect.findById(defect!._id))!.status;
        expect(result.status).toBe(httpStatus.OK);
        expect(previousStatus).not.toEqual(currentStatus);
        expect(currentStatus).toEqual(DefectStatus.REPAIRED);
      });
    });
    describe('failure', () => {
      test('should return 400 if not attach image file', async () => {
        const result = await request(app)
          .patch(
            `/api/partners/engineers/myTasks/repaired?user[uniqueId]=${partnerEngineer!._id}&defect[uniqueId]=${defect!._id}`
          )
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .patch(`/api/partners/engineers/myTasks/repaired?defect[uniqueId]=${defect!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .attach('defect[image][completed]', './defect.jpeg');
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/partners/engineers/myTasks/reject', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .patch(
            `/api/partners/engineers/myTasks/reject?user[uniqueId]=${partnerEngineer!._id}&defect[uniqueId]=${defect!._id}`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            defect: {
              rejected: {
                reason: 'dddd',
              },
            },
          });

        const updatedDefect = await Defect.findById({ _id: defect!._id });
        expect(result.status).toBe(httpStatus.OK);
        expect(updatedDefect!.status).toBe(DefectStatus.REJECTED);
        expect(updatedDefect!.rejected.reason).toEqual('dddd');
      });
    });

    describe('failure', () => {
      test('should not allow execution if defect status is not "SCHEDULED" or not owned by engineer.', async () => {
        const [newDefect, partnerAssignedDefect] = await Promise.all([
          Defect.create({
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
            status: 'SCHEDULED',
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
                engineer: {
                  uniqueId: new Types.ObjectId(),
                },
              },
            },
            contractor: {
              uniqueId: contractor!._id,
            },
            resident: {
              uniqueId: resident!._id,
            },
          }),
          Defect.create({
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
                engineer: {
                  uniqueId: partnerEngineer!._id,
                },
              },
            },
            contractor: {
              uniqueId: contractor!._id,
            },
            resident: {
              uniqueId: resident!._id,
            },
          }),
        ]);

        const results = await Promise.all([
          request(app)
            .patch(
              `/api/partners/engineers/myTasks/reject?user[uniqueId]=${partnerEngineer!._id}&defect[uniqueId]=${
                newDefect!._id
              }`
            )
            .set('Authorization', `Bearer ${token}`)
            .send({
              defect: {
                rejected: {
                  reason: 'dddd',
                },
              },
            }),
          request(app)
            .patch(
              `/api/partners/engineers/myTasks/reject?user[uniqueId]=${partnerEngineer!._id}&defect[uniqueId]=${
                partnerAssignedDefect!._id
              }`
            )
            .set('Authorization', `Bearer ${token}`)
            .send({
              defect: {
                rejected: {
                  reason: 'dddd',
                },
              },
            }),
        ]);

        expect(results.map((result: any) => result.status)).toEqual([httpStatus.NOT_FOUND, httpStatus.METHOD_NOT_ALLOWED]);
      });
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .patch(`/api/partners/engineers/myTasks/reject?defect[uniqueId]=${defect!._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            defect: {
              rejected: {
                reason: 'dddd',
              },
            },
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
      test('should return 404 if defect is not exist.', async () => {
        const result = await request(app)
          .patch(
            `/api/partners/engineers/myTasks/reject?user[uniqueId]=${
              partnerEngineer!._id
            }&defect[uniqueId]=${new Types.ObjectId()}`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            defect: {
              rejected: {
                reason: 'dddd',
              },
            },
          });

        expect(result.status).toBe(httpStatus.NOT_FOUND);
      });
    });
  });

  describe(`/api/partners/engineers/myTasks/history`, () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/history?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('complexes');
        expect(result.body.complexes).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/history`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('/api/partners/engineers/myTasks/history/detail', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/myTasks/history/detail?user[uniqueId]=${
              partnerEngineer!._id
            }&apartment[complex][uniqueId]=${complex!._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('dongs');
        expect(result.body.dongs).toBeInstanceOf(Array);
        result.body.dongs.forEach((dong: any) => {
          expect(dong).toHaveProperty('units');
          expect(dong).toHaveProperty('dong');
          expect(dong).toHaveProperty('count');
          expect(dong.count).toHaveProperty('notProcessed');
          expect(dong.count).toHaveProperty('completed');
          expect(dong.count).toHaveProperty('rejected');
        });
      });
    });

    describe('failure', () => {
      test('should return 400 is required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/myTasks/history/detail?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/engineers/search/complex', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/search/complexes?user[uniqueId]=${partnerEngineer!._id}&partner[uniqueId]=${
              partner!._id
            }`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('complexes');
        expect(result.body.complexes).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing.', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/search/complexes?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/engineers/search/dong', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/search/dong?user[uniqueId]=${partnerEngineer!._id}&apartment[complex][uniqueId]=${
              complex!._id
            }`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('dongs');
        result.body.dongs.forEach((dong: any) => expect(typeof dong).toEqual('string'));
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/search/dong?user[uniqueId]=${partnerEngineer!._id}
            }`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/partners/engineers/search/ho', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/partners/engineers/search/ho?user[uniqueId]=${partnerEngineer!._id}&apartment[complex][uniqueId]=${
              complex!._id
            }`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('hos');
        result.body.hos.forEach((ho: any) => expect(typeof ho).toEqual('number'));
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/partners/engineers/search/ho?user[uniqueId]=${partnerEngineer!._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});
