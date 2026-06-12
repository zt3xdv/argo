export function hexToRgb(hex) {
  const start = hex.charCodeAt(0) === 35 ? 1 : 0;
  const num = parseInt(hex.slice(start), 16);

  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}
