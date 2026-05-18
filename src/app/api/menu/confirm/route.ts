import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import '@/lib/firebase-admin';
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
  if (!db) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  try {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { familyId, plansCount } = await req.json();
    if (!familyId) return NextResponse.json({ error: 'Missing familyId' }, { status: 400 });

    // Boost Satiety
    await boostTamagotchi(familyId, 'satiety', plansCount * 5);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
