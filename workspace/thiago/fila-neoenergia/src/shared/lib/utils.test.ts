import { describe, it, expect } from 'vitest';
import { formatPhoneE164, maskPhone, ordinal, formatTime } from './utils';

describe('formatPhoneE164', () => {
  it('adds +55 prefix to 11-digit number', () => {
    expect(formatPhoneE164('71999887766')).toBe('+5571999887766');
  });

  it('adds +55 prefix to 10-digit number', () => {
    expect(formatPhoneE164('7133334444')).toBe('+557133334444');
  });

  it('keeps existing +55 prefix', () => {
    expect(formatPhoneE164('5571999887766')).toBe('+5571999887766');
  });

  it('strips non-digit characters before processing', () => {
    expect(formatPhoneE164('(71) 9 9988-7766')).toBe('+5571999887766');
  });
});

describe('maskPhone', () => {
  it('formats 11-digit phone with mobile format', () => {
    expect(maskPhone('71999887766')).toBe('(71) 9 9988-7766');
  });

  it('formats 10-digit phone with landline format', () => {
    expect(maskPhone('7133334444')).toBe('(71) 3333-4444');
  });

  it('strips +55 prefix before masking', () => {
    expect(maskPhone('+5571999887766')).toBe('(71) 9 9988-7766');
  });
});

describe('ordinal', () => {
  it('formats position as ordinal', () => {
    expect(ordinal(1)).toBe('1º');
    expect(ordinal(10)).toBe('10º');
  });
});

describe('formatTime', () => {
  it('truncates seconds from time string', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
    expect(formatTime('09:05:30')).toBe('09:05');
  });
});
