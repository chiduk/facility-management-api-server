import Joi from 'joi';
import * as commonSchema from '../common/common.validator';
import { baseQuerySchema } from '../common/common.validator';
import { PartnerRole } from '../user/user.constants';

export const getPartnerEmployeesSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
  }),
};

export const createPartnerEmployeeSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
  }),
  body: {
    employee: Joi.object().required().keys({
      code: Joi.string().required(),
    }),
    password: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.object().keys({
      mobile: commonSchema.phoneComponent,
    }),
    role: Joi.string().valid(...Object.values(PartnerRole)),
  },
};

export const getDefectsByPartnerSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    apartment: commonSchema.apartmentMultiFilterSchema,
  }),
};

export const repairDefectSchema = {
  query: baseQuerySchema.keys({
    defect: commonSchema.identifierSchema,
  }),
  body: {
    defect: {
      rejected: {
        reason: Joi.string().required(),
      },
    },
  },
};

export const assignTaskSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    defect: commonSchema.identifierSchema,
  }),
  body: Joi.object()
    .keys({
      engineer: commonSchema.identifierSchema,
    })
    .required(),
};

export const getSpecificDefectSchema = {
  query: baseQuerySchema.keys({
    defect: commonSchema.identifierSchema,
  }),
};

export const patchDefectRejectSchema = {
  query: baseQuerySchema.keys({
    defect: commonSchema.identifierSchema,
    partner: commonSchema.identifierSchema,
  }),
};

export const getAllTasksDynamicSchema = {
  query: baseQuerySchema.keys({
    apartment: commonSchema.apartmentMultiFilterSchema,
  }),
};

export const getEngineerDefectsByComplex = {
  query: baseQuerySchema.keys({
    apartment: Joi.object().required().keys({
      complex: commonSchema.identifierSchema,
    }),
  }),
};

export const getAssignedApartments = {
  query: baseQuerySchema,
};

export const getAllTasksOfOneComplexSchema = {
  query: baseQuerySchema.keys({
    apartment: Joi.object()
      .required()
      .keys({
        complex: commonSchema.identifierSchema,
        unit: Joi.object()
          .keys({
            dongs: Joi.array().optional(),
            hos: Joi.array().optional(),
          })
          .optional(),
      }),
  }),
};

export const getComplexesByNameSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    apartment: Joi.object()
      .optional()
      .keys({
        complex: Joi.object()
          .optional()
          .keys({
            name: Joi.string().optional().allow(null, ''),
          }),
      }),
  }),
};

export const getDongsByComplexSchema = {
  query: baseQuerySchema.keys({
    apartment: Joi.object().required().keys({
      complex: commonSchema.identifierSchema,
    }),
  }),
};

export const getHosByComplexSchema = {
  query: baseQuerySchema.keys({
    apartment: Joi.object()
      .required()
      .keys({
        complex: commonSchema.identifierSchema,
        unit: Joi.object().optional().keys({
          dongs: Joi.array().optional(),
        }),
      }),
  }),
};

export const getPartnerContractorsSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
  }),
};

export const getAllDefectsByUnitSchema = {
  query: baseQuerySchema.keys({
    apartment: Joi.object().required().keys({
      unit: commonSchema.identifierSchema,
    }),
    partner: commonSchema.identifierSchema,
  }),
};

export const getDashboardNoticesSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    currentPage: Joi.number().optional(),
  }),
};

export const getDefectStatisticsSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
  }),
};

export const deletePartnerEmployeeSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    employee: commonSchema.identifierSchema,
  }),
};

export const updatePartnerEmployeeSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    employee: commonSchema.identifierSchema,
  }),
  body: {
    employee: Joi.object().required().keys({
      code: Joi.string().required(),
    }),
    password: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.object().keys({
      mobile: commonSchema.phoneComponent,
    }),
    role: Joi.string().valid(...Object.values(PartnerRole)),
  },
};

export const getPartnerEmployeeEngineersSchema = {
  query: baseQuerySchema.keys({
    partner: commonSchema.identifierSchema,
    currentPage: Joi.string().optional(),
    employee: Joi.object().keys({
      code: Joi.string().optional(),
    }),
    name: Joi.string().optional(),
    phone: {
      mobile: {
        number: Joi.string().optional(),
      },
    },
  }),
};
