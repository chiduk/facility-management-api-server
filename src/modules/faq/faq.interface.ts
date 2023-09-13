import { Document, Model } from 'mongoose';

export interface IFaq {
  category: string;
  qna: [
    {
      question: string;
      answer: string;
    }
  ];
}

export interface IFaqDoc extends IFaq, Document {}
export type IFaqModel = Model<IFaqDoc>;

export enum CategoryEnum {
  VIEWER = 'VIEWER',
  DEFECT = 'DEFECT',
  APP = 'APP',
}

export interface ICategoryFilter {
  category?: CategoryEnum;
}

export interface IRegexFilter {
  'qna.question'?: {
    $regex?: string;
  };
}
