import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import '@/lib/firebase-admin'; // Ensure admin is initialized
import { boostTamagotchi } from '@/lib/tamagotchi-admin';
import { verifyToken, getUserWithFamily } from '@/lib/auth-server';

const db = admin.apps.length ? admin.firestore() : null;

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

    const [senderData, receiverData] = await Promise.all([
      getUserWithFamily(senderId),
      getUserWithFamily(receiverId),
    ]);

    if (!senderData?.familyId || senderData.familyId !== receiverData?.familyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const familyId = senderData.familyId;

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

    // Background operations
    await Promise.allSettled([
      // Boost Tamagotchi Happiness
      (async () => {
        try {
          await boostTamagotchi(familyId, 'happiness', 5);
        } catch (err) {
          console.warn('Tama boost error:', err);
        }
      })(),
      // Background notification
      (async () => {
        try {
          if (receiverData?.fcmToken) {
            const senderName = senderData.name || 'Партнер';
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
      })()
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending hearts API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
