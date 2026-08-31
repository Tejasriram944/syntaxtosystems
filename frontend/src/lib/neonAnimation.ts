export function neonFrameState(index: number, frame: number) {
  const phaseFrame = frame - index * 45
  return { active: phaseFrame >= 0 && phaseFrame < 45, progress: Math.max(0, Math.min(1, phaseFrame / 44)) }
}
