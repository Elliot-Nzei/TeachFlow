// src/firebase/service-account.ts
// CRITICAL SECURITY WARNING:
// 1. Add this file to .gitignore IMMEDIATELY
// 2. NEVER commit this to version control
// 3. For production, use environment variables

export const serviceAccount = {
  type: "service_account",
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: "111515256683160780769",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
  clientX509CertUrl: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studio-985481692-56aea.iam.gserviceaccount.com",
  universeDomain: "googleapis.com"
};
