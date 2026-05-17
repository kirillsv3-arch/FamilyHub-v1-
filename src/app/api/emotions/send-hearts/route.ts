import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { sendPushNotification } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, count } = await req.json();

    if (!senderId || !receiverId || !count) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Update stats using setDoc with merge: true to avoid crashes if doc doesn't exist
    const updateStats = async (uid: string, docId: string, field: string) => {
      const ref = doc(db, 'users', uid, 'heart_stats', docId);
      await setDoc(ref, {
        [field]: increment(count),
        updatedAt: serverTimestamp()
      }, { merge: true });
    };

    await Promise.all([
      updateStats(senderId, 'total', 'sent'),
      updateStats(senderId, currentMonth, 'sent'),
      updateStats(receiverId, 'total', 'received'),
      updateStats(receiverId, currentMonth, 'received')
    ]);

    // Get sender name for the push notification
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    const senderName = senderDoc.exists() ? senderDoc.data().name : 'Партнер';

    // Create signal for real-time animation
    await addDoc(collection(db, 'heart_signals'), {
      senderId,
      receiverId,
      count,
      timestamp: serverTimestamp()
    });

    // Send Push Notification if receiver has a token
    const receiverDoc = await getDoc(doc(db, 'users', receiverId));
    if (receiverDoc.exists()) {
      const receiverData = receiverDoc.data();
      if (receiverData.fcmToken) {
        await sendPushNotification(
          receiverData.fcmToken,
          'Новые сердечки! ❤️',
          `${senderName} отправил(а) вам ${count} сердечек!`,
          { type: 'HEARTS', count: count.toString() }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending hearts:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
