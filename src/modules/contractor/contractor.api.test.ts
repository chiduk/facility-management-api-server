import request from 'supertest';
import { faker } from '@faker-js/faker';
import { httpStatus } from '../utils';
import app from '../../app';
import User from '../user/user.model';
import Contractor from './contractor.model';
import Defect from '../defect/defect.model';
import ApartmentComplex from '../apartmentComplex/apartmentComplex.model';
import ApartmentUnitType from '../apartmentUnitType/apartmentUnitType.model';
import ApartmentUnit from '../apartmentUnit/apartmentUnit.model';
import ContractorPartner from '../contractor_partner/contractor_partner.model';
import Partner from '../partners/partners.model';
import { IUserDoc } from '../user/user.interfaces';
import initializeTest from '../jest/initializeTest';
import { IContractorDoc } from './contractor.interface';
import { IPartnerDoc } from '../partners/partners.interface';
import { IApartmentUnitDoc } from '../apartmentUnit/apartmentUnit.interface';
import { IApartmentComplexDoc } from '../apartmentComplex/apartmentComplex.interface';
import { IApartmentUnitTypeDoc } from '../apartmentUnitType/apartmentUnitType.interface';
import Inquiry from '../inquiry/inquiry.model';
import { InquiryCategoryEnum, InquiryStatusEnum } from '../inquiry/inquiry.interface';

initializeTest();

let resident: IUserDoc;

let contractorAdmin: IUserDoc;
let contractor: IContractorDoc;
let partner: IPartnerDoc;
let unit: IApartmentUnitDoc;
let complex: IApartmentComplexDoc;
let type: IApartmentUnitTypeDoc;
const locations = ['거실', '주방', '침실1', '침실2', '안방', '화장실1', '화장실2', '베란다1', '베란다2', '다목적실'];

const residentName = faker.name.fullName();
const residentEmail = faker.internet.email().toLowerCase();

const contractorAdminName = faker.name.fullName();
const contractorAdminEmail = faker.internet.email().toLowerCase();
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

  contractorAdmin = await User.create({
    name: contractorAdminName,
    email: contractorAdminEmail,
    password,
    role: 'CONTRACTOR_ADMIN',
    type: 'CONTRACTOR',
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

describe('시공사 웹 api supertest', () => {
  let token: string | undefined;

  beforeEach(async () => {
    const logInResult = await request(app).post('/api/auth/signin').send({
      email: contractorAdminEmail,
      password,
    });
    token = logInResult.body.tokens.access.token;
  });

  afterEach(async () => {
    await Defect.deleteMany({});
  });

  describe('GET /api/contractors/search/complex', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/search/complex?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('complexes');
        expect(result.body.complexes).toBeInstanceOf(Array);
      });
    });

    describe('failure', () => {
      test('should return 400', async () => {
        const result = await request(app)
          .get(`/api/contractors/search/complex?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /apo/contractors/search/dong', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/search/dong?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&apartment[complex][uniqueId]=${complex._id}`
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
          .get(`/api/contractors/search/dong?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/contractors/search/ho', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/search/ho?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&apartment[complex][uniqueId]=${complex._id}&apartment[unit][dong]=${unit.dong}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('hos');
        expect(result.body.hos).toBeInstanceOf(Array);
        result.body.hos.forEach((ho: any) => expect(typeof ho).toEqual('number'));
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/search/ho?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&apartment[unit][dong]=${unit.dong}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/contractors/works', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/contractors/works?contractor[uniqueId]=${contractor._id}&user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('works');
        expect(result.body.works).toBeInstanceOf(Array);
        result.body.works.forEach((work: any) => {
          expect(work).toHaveProperty('type');
          expect(typeof work.type).toEqual('string');
          expect(work).toHaveProperty('details');
          expect(work.details).toBeInstanceOf(Array);
        });
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/contractors/works?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /api/contractors/works', () => {
    const workType = '연제';

    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .post(`/api/contractors/works?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            work: {
              type: workType,
            },
          });

        const updatedContractor = await Contractor.findById(contractor._id);
        const isWorkExist = updatedContractor!.works.some((work: any) => work.type === workType);

        expect(result.status).toBe(httpStatus.OK);
        expect(isWorkExist).toBe(true);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .post(`/api/contractors/works?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            work: {
              type: workType,
            },
          });
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });

      test('should return 400 if required body parameter is missing', async () => {
        const result = await request(app)
          .post(`/api/contractors/works?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            work: {},
          });
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/contractors/partners', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/contractors/partners?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('partners');
        expect(result.body.partners).toBeInstanceOf(Array);
        result.body.partners.forEach((partnerInfo: any) => {
          expect(partnerInfo).toHaveProperty('uniqueId');
          expect(partnerInfo).toHaveProperty('company');
        });
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/contractors/partners?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/contractors/partners/managingUnits', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/partners/managingUnits?user[uniqueId]=${contractorAdmin._id}&partner[uniqueId]=${partner._id}&contractor[uniqueId]=${contractor._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('units');
        expect(result.body.units).toBeInstanceOf(Array);
        result.body.units.forEach((managingUnit: any) => {
          expect(managingUnit).toHaveProperty('apartment');
          expect(managingUnit).toHaveProperty('uniqueId');
          expect(managingUnit).toHaveProperty('works');
        });
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/partners/managingUnits?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('POST /api/contractors/partners/duties', () => {
    describe('success', () => {
      let newUnit: IApartmentUnitDoc;

      beforeEach(async () => {
        newUnit = await ApartmentUnit.create({
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
      });

      test('should return 200', async () => {
        const result = await request(app)
          .post(
            `/api/contractors/partners/duties?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&partner[uniqueId]=${partner._id}&apartment[complex][uniqueId]=${complex.id}&apartment[unit][dong]=103&apartment[unit][ho]=206`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            works: ['미장', '청소'],
          });
        const [association] = await ContractorPartner.find({
          'apartment.unit.uniqueId': newUnit._id,
        });
        expect(result.status).toBe(httpStatus.OK);
        expect(association).not.toBeNull();
        expect(association!.contractor.uniqueId).toEqual(contractor._id);
        expect(association!.partner.uniqueId).toEqual(partner._id);
      });
    });

    describe('failure', () => {
      test('should return 400', async () => {
        const result = await request(app)
          .post(
            `/api/contractors/partners/duties?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&partner[uniqueId]=${partner._id}&apartment[complex][uniqueId]=${complex.id}&apartment[unit][dong]=103`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            works: ['미장', '청소'],
          });
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
  describe('GET /api/contractors/residents', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/contractors/residents?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`)
          .set(`Authorization`, `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('residents');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/contractors/residents?user[uniqueId]=${contractorAdmin._id}`)
          .set(`Authorization`, `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/contractors/defects', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(`/api/contractors/defects?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('units');
      });
    });

    describe('failure', () => {
      test('should return 400', async () => {
        const result = await request(app)
          .get(`/api/contractors/defects?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /api/contractors/inquiry/contractor', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .get(
            `/api/contractors/inquiry/contractor?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`
          )
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.OK);
        expect(result.body).toHaveProperty('inquiries');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .get(`/api/contractors/inquiry/contractor?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PATCH /api/contractors/inquiry/contractor', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const createdInquiry = await Inquiry.create({
          category: InquiryCategoryEnum.CONTRACTOR,
          title: '제목',
          content: '내용',
          author: {
            uniqueId: resident._id,
            name: resident.name,
            email: resident.email,
            type: resident.type,
          },
          to: {
            contractor: {
              uniqueId: contractor._id,
            },
          },
        });
        const result = await request(app)
          .patch(
            `/api/contractors/inquiry/contractor?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&inquiry[uniqueId]=${createdInquiry._id}`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            inquiry: {
              answer: {
                content: '답변답변답변',
              },
            },
          });

        const answeredInquiry = await Inquiry.findById(createdInquiry._id);
        expect(result.status).toBe(httpStatus.OK);
        expect(answeredInquiry!.status).toBe(InquiryStatusEnum.ANSWERED);
        expect(answeredInquiry!.answer.content).toEqual('답변답변답변');
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string or body property is missing', async () => {
        const createdInquiry = await Inquiry.create({
          category: InquiryCategoryEnum.CONTRACTOR,
          title: '제목',
          content: '내용',
          author: {
            uniqueId: resident._id,
            name: resident.name,
            email: resident.email,
            type: resident.type,
          },
          to: {
            contractor: {
              uniqueId: contractor._id,
            },
          },
        });
        const results = await Promise.all([
          request(app)
            .patch(
              `/api/contractors/inquiry/contractor?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`
            )
            .set('Authorization', `Bearer ${token}`)
            .send({
              inquiry: {
                answer: {
                  content: '답변답변답변',
                },
              },
            }),
          request(app)
            .patch(
              `/api/contractors/inquiry/contractor?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}&inquiry[uniqueId]=${createdInquiry._id}`
            )
            .set('Authorization', `Bearer ${token}`)
            .send({
              inquiry: {
                answer: {},
              },
            }),
        ]);

        results.forEach((result) => expect(result.status).toBe(httpStatus.BAD_REQUEST));
      });
    });
  });

  describe('POST /api/contractors/inquiry/pspace', () => {
    describe('success', () => {
      test('should return 200', async () => {
        const result = await request(app)
          .post(
            `/api/contractors/inquiry/pspace?user[uniqueId]=${contractorAdmin._id}&contractor[uniqueId]=${contractor._id}`
          )
          .set('Authorization', `Bearer ${token}`)
          .send({
            inquiry: {
              title: '평행공간으로 보내는 문의',
              content: '으아아아아',
              category: InquiryCategoryEnum.APP,
            },
          });

        expect(result.status).toBe(httpStatus.OK);
      });
    });

    describe('failure', () => {
      test('should return 400 if required query string is missing', async () => {
        const result = await request(app)
          .post(`/api/contractors/inquiry/pspace?user[uniqueId]=${contractorAdmin._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            inquiry: {
              title: '평행공간으로 보내는 문의',
              content: '으아아아아',
              category: InquiryCategoryEnum.APP,
            },
          });

        expect(result.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});
