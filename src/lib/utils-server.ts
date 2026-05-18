export function calculateAtmosphereIndexServer(emotions: { mood: number; energy: number; sleep: number; stress: number }) {
  const { mood, energy, sleep, stress } = emotions;
  // Index = (Mood + Energy + Sleep + (11 - Stress)) / 4 * 10
  return ((mood + energy + sleep + (11 - stress)) / 4) * 10;
}
