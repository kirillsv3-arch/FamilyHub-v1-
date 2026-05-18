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

    const { taskId, completed } = await req.json();
    if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

    const taskRef = db.doc(`tasks/${taskId}`);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    await taskRef.update({ completed });

    if (completed) {
      const familyId = taskDoc.data()?.familyId;
      if (familyId) {
        await boostTamagotchi(familyId, 'energy', 10);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
