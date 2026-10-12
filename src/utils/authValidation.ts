/**
 * Password validation utilities for UrbanCare Solution
 * Ensures all registering users (Residents & Vendor Partners) set an 8+ character strong password.
 */

export interface PasswordValidationResult {
  isValid: boolean;
  lengthOk: boolean;
  hasNumberOrSpecial: boolean;
  score: number; // 0 to 4
  strengthLabel: 'Too Short' | 'Weak' | 'Medium' | 'Strong';
}

export function validateStrongPassword(password: string): PasswordValidationResult {
  const lengthOk = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if ((hasUpper && hasLower) || (hasDigit && hasLower)) score++;
  if (hasDigit && hasSpecial) score++;

  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Too Short';
  if (password.length < 8) {
    strengthLabel = 'Too Short';
  } else if (score <= 1) {
    strengthLabel = 'Weak';
  } else if (score === 2) {
    strengthLabel = 'Medium';
  } else {
    strengthLabel = 'Strong';
  }

  return {
    isValid: lengthOk,
    lengthOk,
    hasNumberOrSpecial: hasDigit || hasSpecial,
    score,
    strengthLabel
  };
}
