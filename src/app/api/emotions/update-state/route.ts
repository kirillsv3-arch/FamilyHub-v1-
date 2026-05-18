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

    const userId = decodedToken.uid; // Securely get userId from token
    const body = await req.json();
    const { emotions, statusTag } = body;

    const userRef = db.doc(`users/${userId}`);
    const updateData: any = {};

    if (emotions) {
      updateData.emotions = {
        ...emotions,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
    }

    if (statusTag) {
      updateData.statusTag = {
        ...statusTag,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'No data to update' });
    }

    await userRef.set(updateData, { merge: true });

    // Boost Tamagotchi Happiness on state update
    (async () => {
      try {
        const userDoc = await db.doc(`users/${userId}`).get();
        const familyId = userDoc.data()?.familyId;
        if (familyId) {
          await boostTamagotchi(familyId, 'happiness', 2);
        }
      } catch (err) {
        console.warn('Tama boost error:', err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating emotion state:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
