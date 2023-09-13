import Joi from 'joi';
import { password } from '../validate/custom.validation';
import { PHONE } from '../utils/length';
import * as commonSchema from '../common/common.validator';
import { identifierSchema } from '../common/common.validator';

export const createResident = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    phone: Joi.object().keys({
      mobile: Joi.object().keys({
        countryCode: Joi.number().required(),
        number: Joi.string().required(),
      }),
    }),
  }),
};

export const signin = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

export const signinCode = {
  body: Joi.object()
    .required()
    .keys({
      employee: Joi.object().required().keys({
        code: Joi.string().required(),
      }),
      password: Joi.string().required(),
    }),
};

export const signout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const refreshTokens = {
  query: commonSchema.baseQuerySchema,
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const resetPassword = {
  body: Joi.object().keys({
    resident: Joi.object().keys({
      uniqueId: Joi.string().required(),
      password: Joi.string().required().custom(password),
    }),
  }),
};

export const resetPasswordSchema = {
  params: Joi.object().keys({
    method: Joi.string().required().valid('email', 'phone'),
  }),
  body: {
    user: Joi.alternatives().try(
      Joi.object({
        phone: Joi.object().keys({
          mobile: Joi.object().keys({
            countryCode: Joi.number(),
            number: Joi.string(),
          }),
        }),
      }),
      Joi.object({ email: Joi.string().email() })
    ),
  },
};

export const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export const requestCode = {
  params: Joi.object().keys({
    method: Joi.string().required().valid('email', 'phone'),
  }),
  body: Joi.object()
    .keys({
      phoneNumber: Joi.string().min(PHONE.MIN),
      email: Joi.string().email(),
    })
    .or('phoneNumber', 'email'),
};

export const verifyCode = {
  params: Joi.object().keys({
    method: Joi.string().required(),
  }),
  body: Joi.alternatives(
    Joi.object({ email: Joi.string().email(), code: Joi.number() }),
    Joi.object({ phoneNumber: Joi.string(), code: Joi.number() })
  ),
};

export const wakeUserUp = {
  params: Joi.object().keys({
    method: Joi.string().required().valid('email', 'phone'),
  }),
  body: Joi.object().keys({
    resident: Joi.object().keys({
      uniqueId: Joi.string().required(),
      method: Joi.object()
        .required()
        .keys({
          email: Joi.string().optional().email(),
          phone: Joi.object()
            .keys({
              mobile: Joi.object().keys({
                countryCode: Joi.number(),
                number: Joi.string(),
              }),
            })
            .allow(null, ''),
        }),
    }),
  }),
};

export const findEmailSchema = {
  query: {
    currentPage: Joi.string().optional(),
    resident: Joi.object()
      .required()
      .keys({
        phone: Joi.object()
          .required()
          .keys({
            mobile: Joi.object().required().keys({
              countryCode: Joi.number().required(),
              number: Joi.string().required(),
            }),
          }),
      }),
  },
};

export const patchPasswordSchema = {
  query: Joi.object().keys({
    email: Joi.string().required(),
  }),
  body: {
    password: Joi.string().required(),
    confirmPassword: Joi.string().required(),
  },
};

export const postDeviceTokenSchema = {
  body: {
    user: commonSchema.identifierSchema.keys({
      isReceivePush: Joi.boolean().required(),
    }),
    device: Joi.object()
      .required()
      .keys({
        token: Joi.string().required().allow('', null),
        platform: Joi.string().required(),
      }),
  },
};

export const getDeviceTokenSchema = {
  query: {
    user: identifierSchema,
    token: Joi.string().required(),
  },
};

export const createCompanyAdminSchema = {
  params: {
    type: Joi.string().required().valid('partner', 'contractor'),
  },
  body: {
    createCompanyBody: Joi.object()
      .required()
      .keys({
        ceo: Joi.string().required(),
        company: Joi.string().required(),
        address: Joi.string().required(),
        phone: Joi.object()
          .required()
          .keys({
            mobile: Joi.object().required().keys({
              number: Joi.string().required(),
            }),
            office: Joi.object().required().keys({
              number: Joi.string().required(),
            }),
            fax: Joi.object().required().keys({
              number: Joi.string().required(),
            }),
          }),
        business: Joi.object()
          .required()
          .keys({
            number: Joi.string().required().length(10),
          }),
      }),
    user: Joi.object()
      .required()
      .keys({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        phone: Joi.object()
          .required()
          .keys({
            mobile: Joi.object().required().keys({
              number: Joi.string().required(),
            }),
          }),
      }),
  },
};
