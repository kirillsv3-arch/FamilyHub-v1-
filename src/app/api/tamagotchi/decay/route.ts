import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import '@/lib/firebase-admin';
import { verifyToken, getUserWithFamily } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userData = await getUserWithFamily(decodedToken.uid);
    const familyId = userData?.familyId;
    if (!familyId) return NextResponse.json({ error: 'No family' }, { status: 403 });

    const db = admin.firestore();
    const tamaRef = db.doc(`tamagotchi/${familyId}`);
    const tamaDoc = await tamaRef.get();

    if (!tamaDoc.exists) return NextResponse.json({ success: true });

    const data = tamaDoc.data()!;
    // Using lastChecked field which exists in our schema based on exploration
    const lastChecked = data.lastChecked?.toMillis() || Date.now();
    const hoursPassed = (Date.now() - lastChecked) / (1000 * 60 * 60);

    // Throttle decay to once per 30 mins
    if (hoursPassed < 0.5) return NextResponse.json({ success: true, skipped: true });

    const decay = Math.min(Math.floor(hoursPassed), 24); // max 24h at once

    if (decay > 0) {
      await tamaRef.update({
        satiety: admin.firestore.FieldValue.increment(-decay * 2),
        happiness: admin.firestore.FieldValue.increment(-decay * 2),
        energy: admin.firestore.FieldValue.increment(-decay * 2),
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
       // Just update lastChecked if less than 1 hour but more than 30 mins passed
       await tamaRef.update({
         lastChecked: admin.firestore.FieldValue.serverTimestamp(),
       });
    }

    return NextResponse.json({ success: true, decayHours: decay });
  } catch (error: any) {
    console.error('Decay API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
