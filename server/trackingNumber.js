// Generates codes like "SHT-7F3K9Q2" matching the spec's example format:
// 3-letter prefix, dash, 7 alphanumeric characters. Excludes 0/O and 1/I
// to avoid ambiguity when read aloud or typed in by hand.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateTrackingNumber() {
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `SHT-${code}`;
}
