import Joi from 'joi';
import * as commonSchema from '../common/common.validator';
import { baseQuerySchema, uniqueIdSchema } from '../common/common.validator';
import { InquiryCategoryEnum } from '../inquiry/inquiry.interface';
import { DEFECT_CONTRACTOR_STATUS } from '../defect/defect.constant';

export const getContractorDefectsSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    defect: Joi.object()
      .optional()
      .keys({
        statuses: Joi.array()
          .optional()
          .items(Joi.string().valid(...Object.keys(DEFECT_CONTRACTOR_STATUS))),
      }),
    apartment: Joi.object()
      .optional()
      .keys({
        complex: Joi.object()
          .optional()
          .keys({
            uniqueIds: Joi.array().optional().items(uniqueIdSchema),
          }),
        unit: Joi.object()
          .optional()
          .keys({
            dongs: Joi.array().optional().items(Joi.string()),
            hos: Joi.array().optional().items(Joi.number()),
          }),
      }),
    date: Joi.object()
      .optional()
      .keys({
        requested: Joi.object().optional().keys({
          start: Joi.date().optional(),
          end: Joi.date().optional(),
        }),
      }),
    currentPage: Joi.string().optional(),
  }),
};

export const getWorksSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
};

export const getApartmentComplexesSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: Joi.object()
      .optional()
      .keys({
        complex: Joi.object()
          .optional()
          .keys({
            name: Joi.string().optional().trim().allow(''),
          }),
      }),
  }),
};
export const getDropdownDongSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: Joi.object()
      .required()
      .keys({
        complex: commonSchema.identifierSchema,
        unit: Joi.object()
          .optional()
          .keys({
            dong: Joi.string().optional().trim().allow(''),
          }),
      }),
  }),
};

export const getDropdownHoSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: Joi.object()
      .required()
      .keys({
        complex: commonSchema.identifierSchema,
        unit: Joi.object()
          .optional()
          .keys({
            dongs: Joi.array().optional().items(Joi.string()),
            ho: Joi.string().optional().trim().allow(''),
          }),
      }),
  }),
};

export const getPartnerManagingUnitsSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    partner: commonSchema.identifierSchema,
  }),
};

export const postWorkSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
  body: Joi.object()
    .keys({
      work: Joi.object()
        .keys({
          type: Joi.string().required(),
        })
        .required(),
    })
    .required(),
};

export const postWorkDetailSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
  body: Joi.object()
    .required()
    .keys({
      work: Joi.object().required().keys({
        type: Joi.string().required(),
        detail: Joi.string().required(),
      }),
    }),
};

export const assignDutySchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    partner: commonSchema.identifierSchema,
    apartment: commonSchema.apartmentMandatoryFilterSchema,
  }),
  body: Joi.object()
    .required()
    .keys({
      works: Joi.array().required().items(Joi.string()).min(1),
    }),
};

export const deleteDutySchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    partner: commonSchema.identifierSchema,
    duty: commonSchema.identifierSchema,
  }),
};

export const getDutySchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    duty: commonSchema.identifierSchema,
  }),
};

export const getPartnersSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
};

export const getResidentsSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
};

export const createContractorInquirySchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
  body: Joi.object()
    .required()
    .keys({
      inquiry: Joi.object()
        .required()
        .keys({
          title: Joi.string().required(),
          category: Joi.string()
            .required()
            .valid(...Object.values(InquiryCategoryEnum).filter((category) => category !== 'CONTRACTOR')),
          content: Joi.string().required(),
        }),
    }),
};

export const getContractorInquiriesSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
};

export const patchContractorInquirySchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    inquiry: commonSchema.identifierSchema,
  }),
  body: Joi.object().keys({
    inquiry: Joi.object()
      .required()
      .keys({
        answer: Joi.object().required().keys({
          content: Joi.string().required(),
        }),
      }),
  }),
};

export const getContractorInquirySchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
};

export const getDashboardTasksSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    currentPage: Joi.string().optional(),
  }),
};

export const getDashboardDashboardStatisticsSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    currentPage: Joi.string().optional(),
  }),
};

export const getContractorComplexesSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    currentPage: Joi.string().optional(),
  }),
};

export const createContractorComplexSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
  }),
  body: {
    complex: {
      name: Joi.string().required(),
      address: Joi.string().required(),
    },
  },
};

export const updateContractorComplexSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
    },
  }),
  body: {
    complex: {
      name: Joi.string().optional(),
      address: Joi.string().optional(),
    },
  },
};

export const deleteContractorComplexSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
    },
  }),
};

export const getContractorUnitsSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
    },
    currentPage: Joi.string().optional(),
  }),
};

export const getContractorTypesSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
    },
    currentPage: Joi.string().optional(),
  }),
};

export const postContractorUnitTypeSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
    },
  }),
  body: {
    unitType: Joi.object()
      .required()
      .keys({
        name: Joi.string().required(),
        locations: Joi.array().items(Joi.string()),
        viewer: Joi.string().allow(null, ''),
        area: Joi.object().required().keys({
          exclusive: Joi.number().required(),
          common: Joi.number().required(),
          etc: Joi.number().required(),
        }),
      }),
  },
};

export const updateContractorUnitTypeSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
      unitType: commonSchema.identifierSchema,
    },
  }),
  body: {
    updateUnitTypeBody: Joi.object()
      .required()
      .keys({
        name: Joi.string().required(),
        locations: Joi.array().items(Joi.string()),
        viewer: Joi.string().allow(null, ''),
        area: Joi.object().required().keys({
          exclusive: Joi.number().required(),
          common: Joi.number().required(),
          etc: Joi.number().required(),
        }),
      }),
  },
};
export const deleteContractorUnitTypeSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
      unitType: commonSchema.identifierSchema,
    },
  }),
};

export const postContractorUnitSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      complex: commonSchema.identifierSchema,
      unitType: commonSchema.identifierSchema,
    },
  }),
  body: {
    createUnitBody: Joi.object().required().keys({
      dong: Joi.string().required(),
      ho: Joi.number().required(),
    }),
  },
};

export const getSpecificUnitSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      unit: commonSchema.identifierSchema,
    },
  }),
};

export const updateSpecificUnitSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      unit: commonSchema.identifierSchema,
    },
  }),
  body: {
    updateUnitBody: Joi.object()
      .required()
      .keys({
        dong: Joi.string().required(),
        ho: Joi.number().required(),
        resident: {
          uniqueId: Joi.string().required().allow(null),
          name: Joi.string().required().allow(null),
          phone: Joi.object()
            .required()
            .keys({
              mobile: Joi.object()
                .required()
                .keys({
                  countryCode: Joi.number().required().allow(null),
                  number: Joi.string().required().allow(null),
                }),
            }),
        },
        apartment: {
          unitType: commonSchema.identifierSchema,
        },
      }),
  },
};

export const deleteSpecificUnitSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    apartment: {
      unit: commonSchema.identifierSchema,
    },
  }),
};

export const createPartnershipSchema = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    partner: commonSchema.identifierSchema,
  }),
};

export const deletePartnership = {
  query: baseQuerySchema.keys({
    contractor: commonSchema.identifierSchema,
    partner: commonSchema.identifierSchema,
  }),
};
