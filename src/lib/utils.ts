import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAtmosphereIndex(userEmotions?: any, partnerEmotions?: any) {
  const getIndex = (emotions: any) => {
    if (!emotions) return null;
    const { mood, energy, sleep, stress } = emotions;
    if (mood === undefined || energy === undefined || sleep === undefined || stress === undefined) return null;
    // Index = (Mood + Energy + Sleep + (11 - Stress)) / 4 * 10
    return ((mood + energy + sleep + (11 - stress)) / 4) * 10;
  };

  const userIndex = getIndex(userEmotions);
  const partnerIndex = getIndex(partnerEmotions);

  if (userIndex !== null && partnerIndex !== null) {
    return Math.round((userIndex + partnerIndex) / 2);
  } else if (userIndex !== null) {
    return Math.round(userIndex);
  } else if (partnerIndex !== null) {
    return Math.round(partnerIndex);
  }
  return 0;
}

export function getAtmosphereStatus(index: number) {
  if (index >= 85) return { icon: '☀️', text: 'Ясно и солнечно! Отличный день для совместных планов', color: 'text-yellow-500' };
  if (index >= 65) return { icon: '🌤️', text: 'Хорошая, стабильная атмосфера', color: 'text-blue-400' };
  if (index >= 45) return { icon: '☁️', text: 'В доме пасмурно. Пора заварить чай и обняться', color: 'text-gray-400' };
  if (index >= 25) return { icon: '🌧️', text: 'Дождливо. Кажется, кому-то нужна поддержка', color: 'text-blue-600' };
  return { icon: '⚡', text: 'Гроза. Высокий риск ссоры, обоим нужен отдых', color: 'text-purple-600' };
}
