import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { validateIndianPhone, validateEmail, validatePassword } from '../../utils/authValidation';
import { X, UserPlus, Key, ShieldCheck, Copy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({ isOpen, onClose }) => {
  const { currentRole, employees, vendors, showToast } = useApp();

  const [targetRole, setTargetRole] = useState<'technician' | 'vendor' | 'ops_manager'>('technician');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    email: string;
    role: string;
    temporaryPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentRole === 'admin';

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'PindCare#';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!';
    setTemporaryPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      showToast('Please enter a valid work email address', 'error');
      return;
    }

    const phoneVal = validateIndianPhone(phone);
    if (!phoneVal.isValid) {
      showToast(phoneVal.message || 'Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    if (temporaryPassword && temporaryPassword.trim()) {
      const passVal = validatePassword(temporaryPassword);
      if (!passVal.isValid) {
        showToast(passVal.message || 'Temporary password does not meet security criteria', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      // Call secure Supabase Edge Function with caller's authenticated session
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: {
          email: email.trim().toLowerCase(),
          role: targetRole,
          fullName: fullName.trim(),
          phone: phoneVal.formatted,
          temporaryPassword: temporaryPassword.trim() || undefined,
          entityId: selectedEntityId || undefined,
        },
      });

      if (error || !data?.success) {
        const errorMsg = error?.message || data?.error || 'Failed to provision staff account';
        showToast(errorMsg, 'error');
        setLoading(false);
        return;
      }

      setCreatedResult({
        email: data.email,
        role: data.role,
        temporaryPassword: data.temporaryPassword,
      });
      showToast(`Staff account created for ${fullName} (${targetRole})!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error invoking create-staff-user function';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `UrbanCare Solution Staff Account:\nRole: ${createdResult.role}\nEmail: ${createdResult.email}\nTemporary Password: ${createdResult.temporaryPassword}\n\nPlease change your password immediately upon first sign-in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Credentials copied to clipboard', 'info');
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setTemporaryPassword('');
    setSelectedEntityId('');
    setCreatedResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Provision Staff & Partner Account</h2>
              <p className="text-[11px] text-emerald-200">Secure Edge Function provisioning with role enforcement</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {createdResult ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm">Staff Account Successfully Created</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                The account has been created with <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">must_change_password = true</code>. Provide these temporary credentials to the staff member:
              </p>
              
              <div className="p-3.5 bg-white rounded-xl border border-emerald-200 font-mono text-[11px] space-y-1.5 select-all">
                <div><span className="text-gray-500">Email:</span> <span className="font-bold text-gray-900">{createdResult.email}</span></div>
                <div><span className="text-gray-500">Role:</span> <span className="font-bold text-[#003523] uppercase">{createdResult.role}</span></div>
                <div><span className="text-gray-500">Temp Password:</span> <span className="font-bold text-red-700 bg-red-50 px-1 py-0.5 rounded border border-red-200">{createdResult.temporaryPassword}</span></div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-white text-gray-700 font-semibold cursor-pointer"
                >
                  Create Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-gray-900 mb-1.5">Staff Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('technician')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      targetRole === 'technician'
                        ? 'border-[#003523] bg-[#003523]/5 ring-1 ring-[#003523] font-bold text-[#003523]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    Field Technician
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('vendor')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      targetRole === 'vendor'
                        ? 'border-[#003523] bg-[#003523]/5 ring-1 ring-[#003523] font-bold text-[#003523]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    Trade Partner
                  </button>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setTargetRole('ops_manager')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      !isAdmin
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                        : targetRole === 'ops_manager'
                        ? 'border-[#003523] bg-[#003523]/5 ring-1 ring-[#003523] font-bold text-[#003523] cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer'
                    }`}
                    title={!isAdmin ? 'Only full administrators can provision ops managers' : undefined}
                  >
                    Ops Manager {!isAdmin && '(Admin only)'}
                  </button>
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jaswinder Singh"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Mobile Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98889 00122"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block font-bold text-gray-900 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="technician@urbancaresolution.in"
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                />
              </div>

              {/* Link to Existing Entity Profile (Optional) */}
              {targetRole === 'technician' && (
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Link to Employee Record (Optional)</label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  >
                    <option value="">-- Create without pre-linked employee profile --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode || emp.id}) · {emp.skills.slice(0, 2).join(', ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetRole === 'vendor' && (
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Link to Vendor Partner Profile (Optional)</label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  >
                    <option value="">-- Create without pre-linked vendor partner profile --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.businessName} ({v.ownerName}) · {v.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Temporary Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-900">
                    Temporary Password (Optional / Auto-generated)
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#003523] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    placeholder="Leave blank to generate randomly"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 font-mono text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  The staff member must change this password on their first login. It will never be printed in server logs.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  {loading ? (
                    <span>Provisioning via Edge Function...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Provision Staff Account ({targetRole})</span>
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
