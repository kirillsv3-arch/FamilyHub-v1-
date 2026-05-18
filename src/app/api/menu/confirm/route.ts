import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import '@/lib/firebase-admin';
import { boostTamagotchi } from '@/lib/tamagotchi-admin';
import { verifyToken } from '@/lib/auth-server';

const db = admin.apps.length ? admin.firestore() : null;

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
