import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchCustomerBookingSecret } from '../../services/supabaseService';
import { KeyRound, AlertCircle, Loader2 } from 'lucide-react';

interface CustomerOtpDisplayProps {
  requestId: string;
  status: string;
  bookingUserId?: string;
  customerPhone?: string;
  className?: string;
}

// Terminal statuses where completion OTP is no longer needed
const TERMINAL_STATUSES = ['COMPLETED', 'CUSTOMER CONFIRMED', 'CLOSED', 'CANCELLED'];

// Helper to extract the last 10 digits of an Indian phone number
const normalizePhoneDigits = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const CustomerOtpDisplay: React.FC<CustomerOtpDisplayProps> = ({
  requestId,
  status,
  bookingUserId,
  customerPhone,
  className = ''
}) => {
  const { currentRole, currentUser, authProfile } = useApp();
  const [otp, setOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // SECURITY CHECK 1: Never show in technician or vendor portals (pros must ask resident on-site)
  if (currentRole === 'employee' || currentRole === 'technician' || currentRole === 'vendor') {
    return null;
  }

  // SECURITY CHECK 2: Do not show for terminal statuses (already completed, closed, or cancelled)
  if (TERMINAL_STATUSES.includes((status || '').toUpperCase())) {
    return null;
  }

  // SECURITY CHECK 3: Show only to the verified booking owner (by user_id or 10-digit normalized phone)
  const userPhone10 = normalizePhoneDigits(currentUser?.phone || authProfile?.phone);
  const bookingPhone10 = normalizePhoneDigits(customerPhone);
  const isPhoneMatch = Boolean(userPhone10 && bookingPhone10 && userPhone10 === bookingPhone10);

  const isOwner = Boolean(
    (authProfile?.id && bookingUserId && authProfile.id === bookingUserId) ||
    (currentUser?.user_id && bookingUserId && currentUser.user_id === bookingUserId) ||
    (currentUser?.id && bookingUserId && currentUser.id === bookingUserId) ||
    isPhoneMatch ||
    // Resident viewing their own account profile where booking was queued/synced
    (authProfile?.role === 'customer' && (!bookingUserId || bookingUserId === authProfile.id))
  );

  if (!isOwner) {
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchCustomerBookingSecret(requestId)
      .then((secret) => {
        if (!isMounted) return;
        if (secret && secret.customerOtp) {
          setOtp(secret.customerOtp);
        } else {
          setError('Code not available, contact support');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Code not available, contact support');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  if (loading) {
    return (
      <div
        className={`p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center space-x-2 text-xs text-emerald-900 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-[#003523] shrink-0" />
        <span>Loading verification code...</span>
      </div>
    );
  }

  if (error || !otp) {
    return (
      <div
        className={`p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center space-x-2 text-xs text-amber-900 ${className}`}
      >
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="font-medium">Code not available, contact support</span>
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-xl bg-[#f4fbf7] border border-[#b6efd1] text-[#003523] space-y-1.5 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-[#003523]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#003523]">
            Completion Code
          </span>
        </div>
        <span className="font-mono text-base font-black tracking-widest bg-white text-[#003523] px-2.5 py-0.5 rounded-md border border-[#b6efd1] shadow-inner">
          {otp}
        </span>
      </div>
      <p className="text-[11px] font-semibold text-[#144d37] leading-snug">
        Share this code with the technician only when the job is finished.
      </p>
    </div>
  );
};
