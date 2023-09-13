import Faq from './faq.model';

export const getFaqDynamic = (categoryFilter: any, regexFilter: any) =>
  Faq.aggregate([
    {
      $match: categoryFilter,
    },
    {
      $unwind: '$qna',
    },
    {
      $match: regexFilter,
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);
