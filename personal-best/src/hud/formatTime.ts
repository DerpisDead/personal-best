// Integer math avoids floating-point errors (section 6).
export const formatTime = (frame: number) => {
  const totalCs = Math.floor((frame * 100) / 30);
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor(totalCs / 100) % 60;
  const cs = totalCs % 100;
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};
