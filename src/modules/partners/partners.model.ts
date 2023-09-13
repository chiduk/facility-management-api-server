import { Schema, model } from 'mongoose';
import { IPartnerDoc, IPartnerModel } from './partners.interface';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';

const partnerSchema = new Schema<IPartnerDoc, IPartnerModel>(
  {
    ceo: { type: String, required: true },
    company: { type: String, required: true },
    address: { type: String, required: true },
    email: {
      type: String,
    },
    phone: {
      mobile: {
        countryCode: {
          type: Number,
          required: true,
          default: 82,
        },
        number: {
          type: String,
          required: true,
        },
      },
      office: {
        countryCode: {
          type: Number,
          default: null,
        },
        number: {
          type: Number,
          default: null,
        },
      },
      fax: {
        countryCode: {
          type: Number,
          default: null,
        },
        number: {
          type: String,
          default: null,
        },
      },
    },
    business: {
      number: { type: Number, required: true },
      registration: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

partnerSchema.plugin(toJSON);
partnerSchema.plugin(paginate);

const Partner = model<IPartnerDoc, IPartnerModel>('Partner', partnerSchema, 'PARTNER');

export default Partner;
