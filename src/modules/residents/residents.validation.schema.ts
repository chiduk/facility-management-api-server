import Joi from 'joi';
import * as commonSchema from '../common/common.validator';
import { InquiryCategoryEnum } from '../inquiry/inquiry.interface';
import { baseQuerySchema, identifierSchema } from '../common/common.validator';

export const findMyApartmentUnitLocationsSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object().required().keys({
      unit: commonSchema.identifierSchema,
    }),
  },
};

export const getHosByComplexDongSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object()
      .keys({
        complex: identifierSchema,
        unit: Joi.object().required().keys({
          dong: Joi.string().required(),
        }),
      })
      .required(),
  },
};

export const findMyApartmentUnitSchema = {
  query: {
    user: commonSchema.identifierSchema,
    currentPage: Joi.string().optional(),
  },
};

export const deleteResidentFromUnitSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object().required().keys({
      unit: identifierSchema,
    }),
  },
};

export const findMyApartmentComplexesSchema = {
  query: baseQuerySchema,
};

export const createMyDefectsSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object().required().keys({
      unit: commonSchema.identifierSchema,
    }),
  },
  body: {
    defect: Joi.object()
      .required()
      .keys({
        location: Joi.string().required(),
        image: Joi.object()
          .allow(null, '')
          .keys({
            requested: Joi.string().allow(null, ''),
          }),
        work: Joi.object().keys({
          type: Joi.string().required(),
          detail: Joi.string().required(),
          additionalInfo: Joi.string().allow(null, ''),
        }),
        coordinate: Joi.object().required().keys({
          x: Joi.number().required(),
          y: Joi.number().required(),
          z: Joi.number().required(),
          latitude: Joi.number().required(),
          longitude: Joi.number().required(),
          imageId: Joi.number().required(),
        }),
      }),
  },
};

export const verifyMyApartmentSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: commonSchema.apartmentMandatoryFilterSchema,
  },
};

export const getSupportedWorksSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object().required().keys({
      unit: commonSchema.identifierSchema,
    }),
  },
};

export const setDefaultApartmentSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object().required().keys({
      unit: commonSchema.identifierSchema,
    }),
  },
};

export const findMyFilteredDefects = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object().required().keys({
      unit: commonSchema.identifierSchema,
    }),
    defect: Joi.object()
      .keys({
        status: Joi.array().items(Joi.string()).allow(null, ''),
        location: Joi.array().items(Joi.string()).allow(null, ''),
        work: Joi.object()
          .allow(null, '')
          .keys({
            type: Joi.array().items(Joi.string()).allow(null, ''),
          }),
      })
      .allow(null, ''),
  },
};

export const postInquirySchema = {
  query: {
    user: commonSchema.identifierSchema,
  },
  body: Joi.object()
    .required()
    .keys({
      inquiry: Joi.object()
        .required()
        .keys({
          title: Joi.string().required(),
          category: Joi.string()
            .required()
            .valid(...Object.values(InquiryCategoryEnum)),
          content: Joi.string().required(),
          to: Joi.when('category', {
            is: Joi.string().valid(InquiryCategoryEnum.CONTRACTOR),
            then: Joi.object().required().keys({
              contractor: commonSchema.identifierSchema,
            }),
            otherwise: Joi.forbidden(),
          }),
        }),
    }),
};

export const getMyInquiriesSchema = {
  query: {
    user: commonSchema.identifierSchema,
  },
};

export const findMyDefectsWithinUnitSchema = {
  query: Joi.object()
    .required()
    .keys({
      user: commonSchema.identifierSchema,
      apartment: Joi.object().required().keys({
        unit: commonSchema.identifierSchema,
      }),
    }),
};

export const getComplexesByAddressOrNameSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object()
      .keys({
        complex: Joi.object()
          .allow(null, '')
          .keys({
            keyword: Joi.string().allow(null, ''),
          }),
      })
      .allow(null, ''),
  },
};

export const getDongsByComplexSchema = {
  query: {
    user: commonSchema.identifierSchema,
    apartment: Joi.object()
      .keys({
        complex: identifierSchema,
      })
      .required(),
  },
};

export const findSpecificDefectSchema = {
  query: {
    user: commonSchema.identifierSchema,
    defect: commonSchema.identifierSchema,
  },
};

export const confirmMyDefectSchema = {
  query: {
    defect: commonSchema.identifierSchema,
    user: commonSchema.identifierSchema,
  },
};

export const getFaqSchema = {
  query: {
    user: commonSchema.identifierSchema,
    faq: Joi.object()
      .allow(null, '')
      .keys({
        category: Joi.string().allow(null, ''),
        qna: Joi.object()
          .allow(null, '')
          .keys({
            question: Joi.string().allow(null, ''),
          }),
      }),
  },
};

export const getNotificationSchema = {
  query: {
    user: commonSchema.identifierSchema,
  },
};

export const getRepairedDefectsSchema = {
  query: {
    user: commonSchema.identifierSchema,
  },
};

export const getPartnerInquiriesSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
  }),
};
