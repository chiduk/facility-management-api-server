import { Schema, model } from 'mongoose';
import { IFaqDoc, IFaqModel } from './faq.interface';

const faqSchema = new Schema<IFaqDoc, IFaqModel>(
  {
    category: {
      type: String,
      required: true,
      enum: ['VIEWER', 'APP', 'DEFECT'],
    },
    qna: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const Faq = model<IFaqDoc, IFaqModel>('Faq', faqSchema, 'FAQ');

export default Faq;
