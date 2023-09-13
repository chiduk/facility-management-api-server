import Joi from 'joi';

export const uniqueIdSchema = Joi.string().hex().length(24).required();
export const currentPage = Joi.string().optional();
export const identifierSchema = Joi.object()
  .keys({
    uniqueId: uniqueIdSchema,
  })
  .required();

export const apartmentMultiFilterSchema = Joi.object()
  .allow(null, '')
  .keys({
    unit: Joi.object()
      .allow(null, '')
      .keys({
        dongs: Joi.array().allow(null, ''),
        hos: Joi.array().allow(null, ''),
        dong: Joi.string().allow(null, ''),
        ho: Joi.string().allow(null, ''),
      }),
    complex: Joi.object()
      .allow(null, '')
      .keys({
        uniqueId: uniqueIdSchema.optional().allow(null, ''),
        uniqueIds: Joi.array().optional().allow(null, ''),
      }),
  });

export const apartmentMandatoryFilterSchema = Joi.object()
  .required()
  .keys({
    unit: Joi.object().required().keys({
      dong: Joi.string().required(),
      ho: Joi.string().required(),
    }),
    complex: identifierSchema,
  });

export const baseQuerySchema = Joi.object().required().keys({
  user: identifierSchema,
});

export const phoneComponent = Joi.object().keys({
  countryCode: Joi.number().required(),
  number: Joi.string().required(),
});
