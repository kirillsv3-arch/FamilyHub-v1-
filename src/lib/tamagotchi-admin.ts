import admin from 'firebase-admin';

/**
 * Boost Tamagotchi stats and XP
 */
export async function boostTamagotchi(familyId: string, type: 'satiety' | 'happiness' | 'energy', amount: number = 10) {
  const db = admin.firestore();
  const tamaRef = db.doc(`tamagotchi/${familyId}`);
  const familyRef = db.doc(`families/${familyId}`);

  try {
    const tamaDoc = await tamaRef.get();
    if (!tamaDoc.exists) return;

    const data = tamaDoc.data();
    if (!data) return;

    let newXp = (data.xp || 0) + amount;
    let newLevel = data.level || 1;
    const xpToNext = newLevel * 100;

    if (newXp >= xpToNext) {
      newXp -= xpToNext;
      newLevel += 1;
    }

    // Determine stage based on level
    let stage = data.stage;
    if (newLevel >= 20) stage = 'adult';
    else if (newLevel >= 10) stage = 'junior';
    else if (newLevel >= 4) stage = 'kitten';
    else stage = 'egg';

    const updates: any = {
      xp: newXp,
      level: newLevel,
      stage,
      [type]: admin.firestore.FieldValue.increment(amount),
    };

    // Ensure stats don't exceed 100
    // Note: increment in admin sdk doesn't support max, but we can cap it visually in UI or next check

    await tamaRef.update(updates);

    // Also give family some coins (1 coin per 5 XP)
    const coins = Math.floor(amount / 5);
    if (coins > 0) {
      await familyRef.update({
        currency: admin.firestore.FieldValue.increment(coins)
      });
    }
  } catch (error) {
    console.error('Tamagotchi boost error:', error);
  }
}
