import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId, emotions, statusTag } = await req.json();

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

    await updateDoc(userRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating emotion state:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
