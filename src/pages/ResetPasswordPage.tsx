import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { validatePassword } from '../utils/authValidation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { showToast, setCurrentPage } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  // Check if there is an active recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasRecoverySession(Boolean(session));
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const passwordVal = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordVal.isValid) {
      showToast(passwordVal.message || 'Please enter a valid password', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        showToast(error.message || 'Failed to update password. Please request a new reset link.', 'error');
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      showToast('Your password has been successfully updated.', 'success');
      setTimeout(() => {
        setCurrentPage('home');
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while updating password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-b from-[#f4fbf7] via-[#faf8ff] to-[#f2f3ff]">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#c0c9c2]/50 overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-6 bg-[#003523] text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center mx-auto mb-3 font-bold shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Create New Password</h1>
          <p className="text-xs text-emerald-200 mt-1">
            Choose a strong, unique password for your UrbanCare account
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#003523] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Password Reset Complete!</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                Your password has been securely updated in the database. Redirecting you to home...
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="w-full py-3 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs"
              >
                Go to Home Now
              </button>
            </div>
          ) : hasRecoverySession === false ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-[#131b2e]">Recovery Session Not Found</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                The password recovery link may have expired or is invalid. Please request a new recovery link through the Sign In dialog.
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="w-full py-2.5 rounded-xl bg-[#003523] text-white text-xs font-bold transition-all"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  New Password (Min 8 Characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#707973]">Strength:</span>
                      <span
                        className={`font-bold ${
                          passwordVal.score === 3
                            ? 'text-emerald-700'
                            : passwordVal.score === 2
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {passwordVal.strengthLabel}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex space-x-0.5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordVal.score >= 1
                            ? passwordVal.score === 3
                              ? 'bg-emerald-500 w-1/3'
                              : passwordVal.score === 2
                              ? 'bg-amber-500 w-1/3'
                              : 'bg-red-500 w-1/3'
                            : 'w-0'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordVal.score >= 2
                            ? passwordVal.score === 3
                              ? 'bg-emerald-500 w-1/3'
                              : 'bg-amber-500 w-1/3'
                            : 'w-0'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordVal.score === 3 ? 'bg-emerald-500 w-1/3' : 'w-0'
                        }`}
                      />
                    </div>
                    {passwordVal.message && (
                      <p className="text-[10px] text-red-600 font-medium">{passwordVal.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-red-600 font-medium mt-1">Passwords do not match.</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !passwordVal.isValid || password !== confirmPassword}
                  className="w-full py-3 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  {loading ? (
                    <span>Updating Password...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Set New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
