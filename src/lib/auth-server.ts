import admin from 'firebase-admin';
import { NextRequest } from 'next/server';

export async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function getUserWithFamily(uid: string) {
  const db = admin.firestore();
  const userDoc = await db.doc(`users/${uid}`).get();
  if (!userDoc.exists) return null;
  return userDoc.data() as { familyId: string | null; [key: string]: any };
}
