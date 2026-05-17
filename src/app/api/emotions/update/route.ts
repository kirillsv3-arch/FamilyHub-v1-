import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, emotions, statusTag } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const updateData: any = {};

    if (emotions) {
      updateData.emotions = {
        ...emotions,
        updatedAt: serverTimestamp()
      };
    }

    if (statusTag) {
      updateData.statusTag = {
        ...statusTag,
        updatedAt: serverTimestamp()
      };
    }

    // Using setDoc with merge: true is safer than updateDoc
    await setDoc(userRef, updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating emotion state:', error);
    // Always return a JSON response to prevent frontend fetch hangs
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
