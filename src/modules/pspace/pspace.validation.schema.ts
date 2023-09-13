import Joi from 'joi';
import * as commonSchema from '../common/common.validator';
import { UserRole } from '../user/user.constants';

const pspaceEmployeeRole = Object.keys(UserRole).filter(
  (key: string) => key === 'PSPACE_WORKER' || key === 'PSPACE_SUB_ADMIN'
);

export const getDashboardInquirySchema = {
  query: commonSchema.baseQuerySchema,
};

export const getDashboardUserInflowSchema = {
  query: commonSchema.baseQuerySchema,
};

export const getDashboardDefectsSchema = { query: commonSchema.baseQuerySchema };

export const getPspaceEmployees = { query: commonSchema.baseQuerySchema };

export const deletePspaceEmployeeBulkSchema = {
  query: commonSchema.baseQuerySchema.keys({
    employee: Joi.object()
      .required()
      .keys({
        uniqueIds: Joi.array().items(commonSchema.uniqueIdSchema),
      }),
  }),
};

export const updatePspaceEmployeeBulkSchema = {
  query: commonSchema.baseQuerySchema,
  body: Joi.object()
    .required()
    .keys({
      employees: Joi.array()
        .min(1)
        .items(
          Joi.object()
            .required()
            .keys({
              uniqueId: commonSchema.uniqueIdSchema,
              name: Joi.string().optional(),
              email: Joi.string().optional(),
              phone: Joi.object()
                .optional()
                .keys({
                  mobile: Joi.object().optional().keys({
                    countryCode: Joi.number().optional(),
                    number: Joi.string().optional(),
                  }),
                }),
              role: Joi.string()
                .optional()
                .valid(...pspaceEmployeeRole),
            })
        ),
    }),
};

export const getPspaceResidentsSchema = {
  query: commonSchema.baseQuerySchema.keys({
    currentPage: commonSchema.currentPage,
    resident: Joi.object()
      .optional()
      .keys({
        name: Joi.string().optional(),
        phone: Joi.object().keys({
          mobile: Joi.object().keys({
            number: Joi.string().optional(),
          }),
        }),
      }),
  }),
};

export const deletePspaceResidentBulk = {
  query: commonSchema.baseQuerySchema.keys({
    resident: Joi.object()
      .required()
      .keys({
        uniqueIds: Joi.array().items(commonSchema.uniqueIdSchema).min(1),
      }),
  }),
};

export const updatePspaceResidentBulkSchema = {
  query: commonSchema.baseQuerySchema,
  body: Joi.object()
    .required()
    .keys({
      residents: Joi.array()
        .min(1)
        .items(
          Joi.object()
            .required()
            .keys({
              uniqueId: commonSchema.uniqueIdSchema,
              name: Joi.string().optional(),
              email: Joi.string().optional(),
              phone: Joi.object()
                .optional()
                .keys({
                  mobile: Joi.object().optional().keys({
                    countryCode: Joi.number().optional(),
                    number: Joi.string().optional(),
                  }),
                }),
            })
        ),
    }),
};

export const patchResidentBlacklistSchema = {
  query: commonSchema.baseQuerySchema.keys({
    resident: commonSchema.identifierSchema,
  }),
};
