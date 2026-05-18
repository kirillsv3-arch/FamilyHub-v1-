import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import '@/lib/firebase-admin'; // Ensure admin is initialized
import { boostTamagotchi } from '@/lib/tamagotchi-admin';

const db = admin.apps.length ? admin.firestore() : null;

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, count } = body;
    const senderId = decodedToken.uid; // Securely get senderId from token

    if (!receiverId || !count) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const batch = db.batch();

    const senderTotalRef = db.doc(`users/${senderId}/heart_stats/total`);
    const senderMonthRef = db.doc(`users/${senderId}/heart_stats/${currentMonth}`);
    const receiverTotalRef = db.doc(`users/${receiverId}/heart_stats/total`);
    const receiverMonthRef = db.doc(`users/${receiverId}/heart_stats/${currentMonth}`);

    batch.set(senderTotalRef, { sent: admin.firestore.FieldValue.increment(count), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    batch.set(senderMonthRef, { sent: admin.firestore.FieldValue.increment(count), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    batch.set(receiverTotalRef, { received: admin.firestore.FieldValue.increment(count), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    batch.set(receiverMonthRef, { received: admin.firestore.FieldValue.increment(count), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    // Create signal document
    const signalRef = db.collection('heart_signals').doc();
    batch.set(signalRef, {
      senderId,
      receiverId,
      count,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    // Boost Tamagotchi Happiness
    (async () => {
      try {
        const userDoc = await db.doc(`users/${senderId}`).get();
        const familyId = userDoc.data()?.familyId;
        if (familyId) {
          await boostTamagotchi(familyId, 'happiness', 5);
        }
      } catch (err) {
        console.warn('Tama boost error:', err);
      }
    })();

    // Background notification
    (async () => {
      try {
        const [senderDoc, receiverDoc] = await Promise.all([
          db.doc(`users/${senderId}`).get(),
          db.doc(`users/${receiverId}`).get()
        ]);

        const receiverData = receiverDoc.data();
        if (receiverData?.fcmToken) {
          const senderName = senderDoc.exists ? senderDoc.data()?.name : 'Партнер';
          await admin.messaging().send({
            token: receiverData.fcmToken,
            notification: {
              title: 'Новые сердечки! ❤️',
              body: `${senderName} отправил(а) вам ${count} сердечек!`
            },
            data: { type: 'HEARTS', count: count.toString() },
            android: { priority: 'high' },
            apns: { payload: { aps: { contentAvailable: true } } },
          });
        }
      } catch (err) {
        console.warn('Background notification error:', err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending hearts API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
