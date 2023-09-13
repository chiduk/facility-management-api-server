import { Schema, model } from 'mongoose';
import { IContractorDoc, IContractorModel } from './contractor.interface';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';

const contractorSchema = new Schema<IContractorDoc, IContractorModel>(
  {
    ceo: { type: String, required: true },
    company: { type: String, required: true },
    address: { type: String, required: true },
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
          type: String,
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
      registration: { type: String, default: null },
      _id: false,
    },
    works: [
      {
        type: {
          type: String,
        },
        details: [String],
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

contractorSchema.plugin(toJSON);
contractorSchema.plugin(paginate);

const Contractor = model<IContractorDoc, IContractorModel>('Contractor', contractorSchema, 'CONTRACTOR');

export default Contractor;
