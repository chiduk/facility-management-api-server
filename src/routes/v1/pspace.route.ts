import express from 'express';
import { auth } from '../../modules/auth';
import catchAsync from '../../modules/utils/catchAsync';
import Actions from '../../config/actions';
import validateMiddleware from '../../modules/validate/validate.middleware';
import * as pspaceController from '../../modules/pspace/pspace.controller';
import {
  deletePspaceEmployeeBulkSchema,
  deletePspaceResidentBulk,
  getDashboardDefectsSchema,
  getDashboardInquirySchema,
  getDashboardUserInflowSchema,
  getPspaceEmployees,
  getPspaceResidentsSchema,
  patchResidentBlacklistSchema,
  updatePspaceEmployeeBulkSchema,
  updatePspaceResidentBulkSchema,
} from '../../modules/pspace/pspace.validation.schema';

const pspaceRouter = express.Router();

pspaceRouter
  .route('/dashboard/inquiry')
  .get(
    auth(Actions.READ_ALL_INQUIRY),
    catchAsync(validateMiddleware(getDashboardInquirySchema)),
    catchAsync(pspaceController.getDashboardInquiry)
  );

pspaceRouter
  .route('/dashboard/userInflow')
  .get(
    auth(Actions.READ_ALL_USER),
    catchAsync(validateMiddleware(getDashboardUserInflowSchema)),
    catchAsync(pspaceController.getDashboardUserInflow)
  );

pspaceRouter
  .route('/dashboard/defectStatistics')
  .get(
    auth(Actions.READ_ALL_DEFECTS),
    catchAsync(validateMiddleware(getDashboardDefectsSchema)),
    catchAsync(pspaceController.getDashboardDefects)
  );

pspaceRouter
  .route('/employees')
  .get(
    auth(Actions.READ_PSPACE_EMPLOYEE),
    catchAsync(validateMiddleware(getPspaceEmployees)),
    catchAsync(pspaceController.getPspaceEmployees)
  )
  .delete(
    auth(Actions.DELETE_PSPACE_EMPLOYEE),
    catchAsync(validateMiddleware(deletePspaceEmployeeBulkSchema)),
    catchAsync(pspaceController.deletePspaceEmployeeBulk)
  )
  .put(
    auth(Actions.UPDATE_PSPACE_EMPLOYEE),
    catchAsync(validateMiddleware(updatePspaceEmployeeBulkSchema)),
    catchAsync(pspaceController.updatePspaceEmployeeBulk)
  );

pspaceRouter
  .route('/residents')
  .get(
    auth(Actions.READ_ALL_USER),
    catchAsync(validateMiddleware(getPspaceResidentsSchema)),
    catchAsync(pspaceController.getPspaceResidents)
  )
  .delete(
    auth(Actions.DELETE_ALL_USER),
    catchAsync(validateMiddleware(deletePspaceResidentBulk)),
    catchAsync(pspaceController.deletePspaceResidentBulk)
  )
  .put(
    auth(Actions.UPDATE_ALL_USER),
    catchAsync(validateMiddleware(updatePspaceResidentBulkSchema)),
    catchAsync(pspaceController.updatePspaceResidentBulk)
  );

pspaceRouter
  .route('/residents/blacklist')
  .patch(
    auth(Actions.BLACKLIST_ALL_USER),
    catchAsync(validateMiddleware(patchResidentBlacklistSchema)),
    catchAsync(pspaceController.patchResidentBlacklist)
  );

export default pspaceRouter;
