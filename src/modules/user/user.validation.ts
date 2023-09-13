import Joi from 'joi';
import { password, objectId } from '../validate/custom.validation';

// const createResidentBody: Record<keyof NewCreatedResident, any> = {
//   name: Joi.string().required(),
//   email: Joi.string().required().email(),
//   password: Joi.string().required().custom(password),
//   phone: Joi.object().required(),
//   role: Joi.string().required().valid('user', 'admin'),
//   type: Joi.string().required(),
//   isEmailVerified: Joi.boolean(),
//   date: Joi.date(),
// };
//
// export const createResident = {
//   body: Joi.object().keys(createResidentBody),
// };

export const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

export const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
