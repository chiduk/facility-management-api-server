// eslint-disable-next-line import/no-extraneous-dependencies
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import config from '../../config/config';

const path = config.env === 'test' ? 'uploads_test' : 'uploads';
const createMulterMiddleware = (fieldName: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const uploadSingle = multer({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, path);
        },
        filename: (_req, file, callback) => {
          callback(null, `${Date.now()}_${file.originalname}`);
        },
      }),
    }).single(fieldName);

    uploadSingle(req, _res, (err) => {
      if (err) {
        return next(err);
      }
      req.body = JSON.parse(JSON.stringify(req.body));
      return next();
    });
  };
};

export const uploadDefectConfirmSignatureMiddleware = createMulterMiddleware('resident[signature]');
export const uploadDefectRegistrationMiddleware = createMulterMiddleware('defect[image][requested]');
export const uploadDefectRepairedMiddleware = createMulterMiddleware('defect[image][completed]');
export const uploadContractorBusinessRegistration = createMulterMiddleware('createCompanyBody[business][registration]');
