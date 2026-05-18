import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('Firebase Admin keys missing. Push notifications disabled.');
    }
  } catch (error) {
    console.warn('Firebase Admin init error:', error);
  }
}

export async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  if (!admin.apps.length) {
    console.log('Push skipped: Admin not initialized');
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { contentAvailable: true } } },
    });
  } catch (error) {
    console.error('Error sending push:', error);
  }
}
