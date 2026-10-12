import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  X,
  Download,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Phone,
  HelpCircle,
  Send,
  Building,
  Clock
} from 'lucide-react';

export const DPDPDataRightsModal: React.FC = () => {
  const {
    isDPDPDataRightsOpen,
    setIsDPDPDataRightsOpen,
    currentUser,
    requests,
    exportPersonalData,
    dpdpNominee,
    updateDPDPNominee,
    dpdpGrievances,
    fileDPDPGrievance,
    requestDataErasure
  } = useApp();

  const [activeTab, setActiveTab] = useState<'access' | 'erasure' | 'nominee' | 'grievance'>('access');

  // Nominee form state
  const [nomineeName, setNomineeName] = useState(dpdpNominee?.fullName || '');
  const [nomineeRel, setNomineeRel] = useState(dpdpNominee?.relationship || 'Spouse');
  const [nomineePhone, setNomineePhone] = useState(dpdpNominee?.phone || '');
  const [nomineeEmail, setNomineeEmail] = useState(dpdpNominee?.email || '');
  const [nomineeSaved, setNomineeSaved] = useState(false);

  // Grievance form state
  const [grvType, setGrvType] = useState<
    'RIGHT_TO_ACCESS' | 'RIGHT_TO_CORRECTION' | 'RIGHT_TO_ERASURE' | 'CONSENT_WITHDRAWAL' | 'UNAUTHORIZED_PROCESSING' | 'GENERAL_PRIVACY'
  >('GENERAL_PRIVACY');
  const [grvName, setGrvName] = useState(currentUser?.name || '');
  const [grvPhone, setGrvPhone] = useState(currentUser?.phone || '');
  const [grvDescription, setGrvDescription] = useState('');
  const [grvSubmittedTicket, setGrvSubmittedTicket] = useState<string | null>(null);

  // Erasure form state
  const [erasureConfirm, setErasureConfirm] = useState('');
  const [erasureSuccess, setErasureSuccess] = useState(false);

  if (!isDPDPDataRightsOpen) return null;

  const handleDownloadData = () => {
    const dataJson = exportPersonalData();
    const blob = new Blob([dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urbancare_dpdp_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveNominee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeName || !nomineePhone) return;

    updateDPDPNominee({
      fullName: nomineeName,
      relationship: nomineeRel,
      phone: nomineePhone,
      email: nomineeEmail,
      updatedAt: new Date().toISOString()
    });
    setNomineeSaved(true);
    setTimeout(() => setNomineeSaved(false), 2500);
  };

  const handleFileGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grvDescription || !grvPhone) return;

    const newTicket = fileDPDPGrievance({
      userName: grvName || 'UrbanCare Customer',
      userPhone: grvPhone,
      type: grvType,
      description: grvDescription
    });

    setGrvSubmittedTicket(newTicket.ticketNo);
    setGrvDescription('');
  };

  const handleExecuteErasure = () => {
    if (erasureConfirm.toLowerCase() !== 'delete my data') return;
    requestDataErasure('User requested permanent erasure under DPDP Section 12');
    setErasureSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl border border-[#c0c9c2]/60 flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#002114] text-white flex items-center justify-between border-b border-[#144d37]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#b6efd1] text-[#002114] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#003523]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">DPDP Data Rights Center</h2>
              <p className="text-[11px] text-[#b6efd1]">
                Sections 11, 12, 13 & 14 of the Digital Personal Data Protection Act, 2023
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDPDPDataRightsOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-2 bg-[#f2f3ff] border-b border-[#c0c9c2]/40 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('access')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'access' ? 'bg-[#003523] text-white' : 'text-[#404943] hover:text-[#131b2e]'
            }`}
          >
            Right to Access (Sec 11)
          </button>
          <button
            onClick={() => setActiveTab('nominee')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'nominee' ? 'bg-[#003523] text-white' : 'text-[#404943] hover:text-[#131b2e]'
            }`}
          >
            Nomination (Sec 14)
          </button>
          <button
            onClick={() => setActiveTab('grievance')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'grievance' ? 'bg-[#003523] text-white' : 'text-[#404943] hover:text-[#131b2e]'
            }`}
          >
            Grievance Redressal (Sec 13)
          </button>
          <button
            onClick={() => setActiveTab('erasure')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'erasure' ? 'bg-[#ba1a1a] text-white' : 'text-[#ba1a1a] hover:bg-[#ba1a1a]/10'
            }`}
          >
            Data Erasure (Sec 12)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-[#131b2e]">

          {/* TAB 1: ACCESS */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#c0edd3]/25 border border-[#b6efd1] flex items-start space-x-2.5">
                <FileText className="w-4 h-4 text-[#003523] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#002114]">
                  Under <strong>Section 11 of the DPDP Act 2023</strong>, you have the statutory right to obtain a summary of your personal data being processed, third parties with whom data has been shared, and any other relevant information.
                </div>
              </div>

              <div className="border border-[#c0c9c2]/50 rounded-xl p-3.5 space-y-3 bg-[#faf8ff]">
                <h4 className="font-bold text-xs text-[#003523]">Personal Profile Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#707973] block">Resident Name:</span>
                    <span className="font-semibold">{currentUser?.name || 'Guest / Active Resident'}</span>
                  </div>
                  <div>
                    <span className="text-[#707973] block">Phone Number:</span>
                    <span className="font-semibold">{currentUser?.phone || '+91 98882 10452'}</span>
                  </div>
                  <div>
                    <span className="text-[#707973] block">Total Bookings Recorded:</span>
                    <span className="font-semibold">{requests.length} Requests</span>
                  </div>
                  <div>
                    <span className="text-[#707973] block">Data Storage Jurisdiction:</span>
                    <span className="font-semibold">Supabase PostgreSQL (India / Asia-South Region)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#c0c9c2]/40 text-[11px] text-[#404943]">
                  <strong>Third-Party Sharing Disclosure:</strong> We share your service address only with the single vetted artisan assigned to your ticket to execute doorstep work. We do not sell or monetize personal records.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#003523]/30 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="font-bold text-xs text-[#003523] block">Download Machine-Readable Copy (JSON)</span>
                  <span className="text-[11px] text-[#707973]">
                    Includes bookings, timestamps, consent ledger, and profile data.
                  </span>
                </div>
                <button
                  onClick={handleDownloadData}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-[#fe932c]" />
                  <span>Download Data Export</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NOMINEE */}
          {activeTab === 'nominee' && (
            <form onSubmit={handleSaveNominee} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 text-[11px] text-[#404943] leading-relaxed">
                <strong>Section 14 Statutory Right to Nominate:</strong> A Data Principal shall have the right to nominate, in the event of death or incapacity, another individual to exercise their rights in accordance with the provisions of this Act.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#404943] block mb-1">Nominee Full Name *</label>
                  <input
                    type="text"
                    required
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
                    placeholder="e.g. Jaspreet Kaur"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#404943] block mb-1">Relationship *</label>
                    <select
                      value={nomineeRel}
                      onChange={(e) => setNomineeRel(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child (Adult)</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Legal Representative">Legal Representative</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#404943] block mb-1">Nominee Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={nomineePhone}
                      onChange={(e) => setNomineePhone(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
                      placeholder="+91 98XXX XXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#404943] block mb-1">Nominee Email Address (Optional)</label>
                  <input
                    type="email"
                    value={nomineeEmail}
                    onChange={(e) => setNomineeEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
                    placeholder="nominee@example.com"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {nomineeSaved ? (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#003523] bg-[#c0edd3] px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#003523]" />
                    <span>Nominee Registered under Section 14!</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#707973]">
                    Can be updated anytime with zero fees.
                  </span>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#fe932c]" />
                  <span>Save Nominee Record</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GRIEVANCE REDRESSAL */}
          {activeTab === 'grievance' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 text-[11px] text-[#404943] leading-relaxed space-y-1">
                <div className="font-bold text-[#003523] flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-[#003523]" />
                  <span>Data Protection Officer (DPO) Office</span>
                </div>
                <p>
                  Mr. Gurpreet Singh · UrbanCare Solution, SCF 14, Sector 125, Sunny Enclave, Kharar, Punjab 140301. Contact: +91 98882 10452 | grievance@urbancaresolution.in.
                </p>
                <div className="flex items-center space-x-1 text-[10px] text-[#003523] font-bold pt-1">
                  <Clock className="w-3 h-3" />
                  <span>Turnaround Guarantee: Response within 7 business days under Section 13(2).</span>
                </div>
              </div>

              {grvSubmittedTicket ? (
                <div className="p-4 rounded-xl bg-[#c0edd3]/30 border border-[#b6efd1] text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#003523] mx-auto" />
                  <h4 className="font-bold text-sm text-[#003523]">Grievance Logged Successfully</h4>
                  <p className="text-xs text-[#131b2e]">
                    Your statutory DPDP Tracking Ticket Number is: <strong className="font-mono text-sm">{grvSubmittedTicket}</strong>
                  </p>
                  <p className="text-[11px] text-[#404943]">
                    Our Data Protection Officer has received your submission and will investigate your request. You can also appeal to the Data Protection Board of India if unresolved.
                  </p>
                  <button
                    onClick={() => setGrvSubmittedTicket(null)}
                    className="mt-2 px-3 py-1.5 rounded-lg border border-[#003523] text-[#003523] font-bold text-xs"
                  >
                    File Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFileGrievance} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#404943] block mb-1">Grievance Category *</label>
                    <select
                      value={grvType}
                      onChange={(e) => setGrvType(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold bg-white"
                    >
                      <option value="GENERAL_PRIVACY">General Privacy / Notice Inquiry</option>
                      <option value="RIGHT_TO_ACCESS">Inquiry on Data Held or Shared</option>
                      <option value="RIGHT_TO_CORRECTION">Correction of Inaccurate Personal Record</option>
                      <option value="RIGHT_TO_ERASURE">Request Complete Data Erasure</option>
                      <option value="CONSENT_WITHDRAWAL">Issue with Consent Withdrawal</option>
                      <option value="UNAUTHORIZED_PROCESSING">Report Unauthorized Contact / Processing</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#404943] block mb-1">Your Name</label>
                      <input
                        type="text"
                        value={grvName}
                        onChange={(e) => setGrvName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#404943] block mb-1">Your Phone (+91) *</label>
                      <input
                        type="text"
                        required
                        value={grvPhone}
                        onChange={(e) => setGrvPhone(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs"
                        placeholder="Mobile for ticket updates"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#404943] block mb-1">Description of Grievance *</label>
                    <textarea
                      required
                      rows={3}
                      value={grvDescription}
                      onChange={(e) => setGrvDescription(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs"
                      placeholder="Please specify the issue, relevant booking ID, or data item..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-[#fe932c]" />
                    <span>Submit Grievance to DPO</span>
                  </button>
                </form>
              )}

              {/* Recent grievances list if any */}
              {dpdpGrievances.length > 0 && (
                <div className="pt-3 border-t border-[#c0c9c2]/40 space-y-2">
                  <h4 className="font-bold text-xs text-[#404943]">Your Logged Grievance Tickets</h4>
                  {dpdpGrievances.map((g) => (
                    <div key={g.id} className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 text-[11px] flex justify-between items-center">
                      <div>
                        <div className="font-mono font-bold text-[#131b2e]">{g.ticketNo}</div>
                        <div className="text-[10px] text-[#707973]">{g.type.replace(/_/g, ' ')} · {new Date(g.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffdcc3] text-[#904d00]">
                        {g.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ERASURE */}
          {activeTab === 'erasure' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/40 text-[11px] text-[#93000a] space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-[#ba1a1a]" />
                  <span>Right to Erasure under Section 12(3)</span>
                </div>
                <p>
                  You have the right to request erasure of your personal data when the purpose for which it was collected is no longer served, or upon withdrawal of consent, unless retention is required by applicable law (such as tax/GST invoicing).
                </p>
              </div>

              {erasureSuccess ? (
                <div className="p-4 rounded-xl bg-[#c0edd3]/30 border border-[#b6efd1] text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#003523] mx-auto" />
                  <h4 className="font-bold text-sm text-[#003523]">Erasure Request Logged</h4>
                  <p className="text-xs text-[#131b2e]">
                    Your session personal identifiers have been purged from browser storage, and an audit ticket has been queued to purge server records outside mandatory warranty & tax periods.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#404943]">
                    To confirm erasure of your personal details (name, saved delivery addresses, contact logs), please type <strong className="text-[#ba1a1a]">delete my data</strong> below:
                  </p>
                  <input
                    type="text"
                    value={erasureConfirm}
                    onChange={(e) => setErasureConfirm(e.target.value)}
                    placeholder="delete my data"
                    className="w-full p-2.5 rounded-lg border border-[#ba1a1a]/60 text-xs font-semibold focus:ring-1 focus:ring-[#ba1a1a]"
                  />

                  <button
                    type="button"
                    onClick={handleExecuteErasure}
                    disabled={erasureConfirm.toLowerCase() !== 'delete my data'}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                      erasureConfirm.toLowerCase() === 'delete my data'
                        ? 'bg-[#ba1a1a] text-white hover:bg-[#93000a] cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Erase My Personal Data</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#faf8ff] border-t border-[#c0c9c2]/40 text-center text-[10px] text-[#707973]">
          UrbanCare Solution complies with the Ministry of Electronics & IT (MeitY) Data Protection Guidelines.
        </div>

      </div>
    </div>
  );
};
