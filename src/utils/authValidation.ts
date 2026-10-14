/**
 * Authentication and credential validation utilities.
 * Enforces strict password criteria, blocked password lists, and Indian phone standards (+91).
 */

export const BLOCKED_PASSWORDS = new Set([
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '1234567890',
  'admin123',
  'resident123',
  'welcome123',
  'pindcare123',
  'urbancare123',
  // Compromised legacy demo passwords:
  'opslead@2026',
  'techpass@101',
  'malwapass@2026',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0: Invalid/Too short, 1: Weak, 2: Medium, 3: Strong
  strengthLabel: 'Too Short' | 'Weak' | 'Medium' | 'Strong' | 'Blocked';
  message?: string;
}

/**
 * Validates a password against length rules, blocked password lists, and calculates strength.
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const trimmed = password.trim();

  if (trimmed.length < 8) {
    return {
      isValid: false,
      score: 0,
      strengthLabel: 'Too Short',
      message: 'Password must be at least 8 characters long.',
    };
  }

  if (BLOCKED_PASSWORDS.has(trimmed.toLowerCase())) {
    return {
      isValid: false,
      score: 0,
      strengthLabel: 'Blocked',
      message: 'This password is too common or compromised. Please choose a stronger password.',
    };
  }

  let score = 1;
  const hasUppercase = /[A-Z]/.test(trimmed);
  const hasLowercase = /[a-z]/.test(trimmed);
  const hasNumbers = /[0-9]/.test(trimmed);
  const hasSpecial = /[^A-Za-z0-9]/.test(trimmed);

  const characterVariety = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;

  if (trimmed.length >= 10 && characterVariety >= 3) {
    score = 3;
  } else if (trimmed.length >= 8 && characterVariety >= 2) {
    score = 2;
  } else {
    score = 1;
  }

  const label = score === 3 ? 'Strong' : score === 2 ? 'Medium' : 'Weak';

  return {
    isValid: true,
    score,
    strengthLabel: label,
    message: score === 1 ? 'Tip: Add uppercase, numbers, and symbols to make it stronger.' : undefined,
  };
};

export interface StrongPasswordValidationResult extends PasswordValidationResult {
  lengthOk: boolean;
  hasNumberOrSpecial: boolean;
}

/**
 * Validates a password and exposes convenience flags (lengthOk, hasNumberOrSpecial).
 */
export const validateStrongPassword = (password: string): StrongPasswordValidationResult => {
  const res = validatePassword(password);
  const trimmed = password.trim();
  const hasNumbers = /[0-9]/.test(trimmed);
  const hasSpecial = /[^A-Za-z0-9]/.test(trimmed);

  return {
    ...res,
    lengthOk: trimmed.length >= 8,
    hasNumberOrSpecial: hasNumbers || hasSpecial,
  };
};

/**
 * Validates an Indian mobile number.
 * Must be 10 digits starting with 6, 7, 8, or 9.
 * Standardizes to "+91 XXXXX XXXXX" or "+91XXXXXXXXXX".
 */
export const validateIndianPhone = (phone: string): { isValid: boolean; formatted: string; message?: string } => {
  const digitsOnly = phone.replace(/\D/g, '');

  let tenDigits = digitsOnly;
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    tenDigits = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    tenDigits = digitsOnly.slice(1);
  }

  if (tenDigits.length !== 10) {
    return {
      isValid: false,
      formatted: phone,
      message: 'Please enter a valid 10-digit mobile number.',
    };
  }

  if (!/^[6-9]/.test(tenDigits)) {
    return {
      isValid: false,
      formatted: phone,
      message: 'Indian mobile numbers must start with 6, 7, 8, or 9.',
    };
  }

  return {
    isValid: true,
    formatted: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`,
  };
};

/**
 * Validates email format.
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};
