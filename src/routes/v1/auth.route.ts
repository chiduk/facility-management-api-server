import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { authValidation, authController, auth } from '../../modules/auth';
import Actions from '../../config/actions';
import { decodeMiddleware } from '../../modules/auth/auth.middleware';
import { uploadContractorBusinessRegistration } from '../../modules/multer/upload.middlewares';

const router: Router = express.Router();

router.post('/signup', validate(authValidation.createResident), authController.createResident);
router.post(
  '/signup/admin/:type',
  uploadContractorBusinessRegistration,
  validate(authValidation.createCompanyAdminSchema),
  authController.createContractorAndAdmin
);
router.post('/signin', validate(authValidation.signin), authController.login);
router.post('/signin/code', validate(authValidation.signinCode), authController.loginWithCode);
router.post('/signin/admin', authController.backofficeLogin);
router.post('/signout', auth(Actions.SIGN_OUT), validate(authValidation.signout), authController.signout);

router.get('/me', auth(), authController.getMe);

router.post('/refreshToken', decodeMiddleware, validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/requestCode/:method', validate(authValidation.requestCode), authController.requestCode);
router.post('/verifyCode/:method', validate(authValidation.verifyCode), authController.verifyCode);
router.post('/wakeUp/:method', /* auth(), */ validate(authValidation.wakeUserUp), authController.wakeUserUp);
router.get('/findEmail', validate(authValidation.findEmailSchema), authController.findEmail);
router.delete('/withdrawUser', auth(), authController.withdrawUser);
router.patch('/password', validate(authValidation.patchPasswordSchema), authController.patchPassword);
router
  .route('/deviceTokens')
  .get(auth(), validate(authValidation.getDeviceTokenSchema), authController.getDeviceToken)
  .post(auth(), validate(authValidation.postDeviceTokenSchema), authController.postDeviceTokens);

/**
 * @deprecated
 */
router.post('/resetPassword/:method', validate(authValidation.resetPasswordSchema), authController.resetPassword);
/**
 * @deprecated
 */
router.post('/forgotPassword', validate(authValidation.forgotPassword), authController.forgotPassword);
/**
 * @deprecated
 */
router.post('/sendVerificationEmail', auth(), authController.sendVerificationEmail);
/**
 * @deprecated
 */
router.post('/verifyEmail', validate(authValidation.verifyEmail), authController.verifyEmail);
export default router;
