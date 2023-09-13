import express, { Router } from 'express';
import authRoute from './auth.route';
import docsRoute from './swagger.route';
import residentRoute from './residents.route';
import userRoute from './user.route';
import partnersRouter from './partners';
import config from '../../config/config';
import contractorsRouter from './contractors.route';
import pspaceRouter from './pspace.route';
import { sendPushToFCM } from '../../modules/utils/fcm';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/residents',
    route: residentRoute,
  },
  {
    path: '/partners',
    route: partnersRouter,
  },
  {
    path: '/contractors',
    route: contractorsRouter,
  },
  {
    path: '/pspace',
    route: pspaceRouter,
  },
];

const devIRoute: IRoute[] = [
  // IRoute available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

router.get('/test', async (_req: any, res: any) => {
  const token =
    'e4tYMeJpRSagvuRS9rfrFC:APA91bH2U2H8cGHxVuK-qwk1i_eH5IqNzaUgnnSWVhpn701UYGRH-qUzqm3k9RHF5UC9UBU3S3FMUGhw9Of7D3io2oCRnUPpcoRxpMq1OkNpsvTYZ7GlvadB7KVVMI5o0EhlhSpwjnNC';

  const message = {
    notification: {
      title: 'John Doe',
      body: 'Tom',
    },
    token,
  };

  const result = await sendPushToFCM(message);
  console.log(result);

  return res.status(200).json('ok');
});
export default router;
