import { supabase } from './supabase';

/**
 * Checks whether SMS OTP authentication is enabled via environment variables.
 * Defaults to false per security and cost controls until licensed gateway is configured.
 */
export const isOtpEnabled = (): boolean => {
  return import.meta.env.VITE_OTP_ENABLED === 'true';
};

export interface OtpResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Request an SMS One-Time Password for phone authentication.
 * Gated behind VITE_OTP_ENABLED.
 */
export const requestOtp = async (phone: string): Promise<OtpResponse> => {
  if (!isOtpEnabled()) {
    return {
      success: false,
      message: 'SMS OTP authentication is currently disabled. Please sign in with your email and password.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to dispatch verification code.',
      };
    }

    return {
      success: true,
      message: 'Verification code dispatched to your mobile number.',
      data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error sending OTP';
    return {
      success: false,
      message: msg,
    };
  }
};

/**
 * Verify an SMS OTP token for phone authentication.
 * Gated behind VITE_OTP_ENABLED.
 */
export const verifyOtp = async (phone: string, token: string): Promise<OtpResponse> => {
  if (!isOtpEnabled()) {
    return {
      success: false,
      message: 'SMS OTP authentication is currently disabled.',
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Invalid or expired verification code.',
      };
    }

    return {
      success: true,
      message: 'Mobile number verified successfully.',
      data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error verifying OTP';
    return {
      success: false,
      message: msg,
    };
  }
};
