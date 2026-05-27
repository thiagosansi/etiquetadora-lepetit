/**
 * Format phone to E.164 for Brazil (+55 + DDD + number).
 * Input: "71999887766" → "+5571999887766"
 */
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
}

/**
 * Mask phone for display: "71999887766" → "(71) 9 9988-7766"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^55/, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Returns position label: 1 → "1º", 2 → "2º", etc.
 */
export function ordinal(n: number): string {
  return `${n}º`;
}

/**
 * Format time string "14:30:00" → "14:30"
 */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}
