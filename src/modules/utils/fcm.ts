// eslint-disable-next-line import/no-extraneous-dependencies
import fcmAdmin from 'firebase-admin';
import config from '../../config/config';

fcmAdmin.initializeApp({
  credential: fcmAdmin.credential.cert({
    projectId: config.FCM_RESIDENT_PROJECT_ID,
    privateKey: config.FCM_RESIDENT_PRIVATE_KEY,
    clientEmail: config.FCM_RESIDENT_CLIENT_EMAIL,
  }),
});
export interface IPushNotification {
  title: string;
  body: string;
}

export interface IPushMessage {
  notification: IPushNotification;
  token: string;
}

export const sendPushToFCM = (message: IPushMessage) => fcmAdmin.messaging().send(message);
