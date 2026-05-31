import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../config/env.js";

const hasServiceAccount = env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY;

export const firebaseMessaging = () => {
  if (!getApps().length) {
    initializeApp({
      credential: hasServiceAccount
        ? cert({
            projectId: env.FCM_PROJECT_ID,
            clientEmail: env.FCM_CLIENT_EMAIL,
            privateKey: env.FCM_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          })
        : applicationDefault(),
    });
  }
  return getMessaging();
};

export const isFirebaseConfigured = () =>
  Boolean(hasServiceAccount || process.env.GOOGLE_APPLICATION_CREDENTIALS);
