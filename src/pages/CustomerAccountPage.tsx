import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronRight,
  HardHat,
  User,
  ShieldCheck,
  Lock,
  Sliders,
  UserCheck,
  Download,
  Trash2,
  UserPlus,
  FileText,
  Building,
  PhoneCall,
  Bell,
  Sparkles
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const {
    requests,
    projectRequests,
    setActiveTrackingRequestId,
    currentLocality,
    currentUser,
    setIsAuthModalOpen,
    logoutCustomer,
    dpdpConsent,
    dpdpNominee,
    dpdpGrievances,
    exportPersonalData,
    setIsDPDPNoticeOpen,
    setIsDPDPConsentManagerOpen,
    setIsDPDPDataRightsOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bookings' | 'projects' | 'addresses' | 'dpdp'>('bookings');

  // Customer initials
  const initials = currentUser
    ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : 'PB';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
      {/* Account Header */}
      <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#003523] text-white flex items-center justify-center font-bold text-lg">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#131b2e]">
                {currentUser ? currentUser.name : 'Guest Resident'}
              </h1>
              {currentUser && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c0edd3] text-[#003523]">
                  {currentUser.status || 'ACTIVE'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#707973]">
              {currentUser ? `${currentUser.phone} · ${currentUser.locality || currentLocality}` : `Not logged in · ${currentLocality}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#c0c9c2]/60 hover:bg-[#f2f3ff] text-[#131b2e] transition-colors"
              >
                Switch Account
              </button>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#003523] bg-[#c0edd3]/25 px-3 py-1.5 rounded-xl border border-[#b6efd1]">
                <ShieldCheck className="w-4 h-4 text-[#003523]" />
                <span>Verified Resident</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-xs transition-colors"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#c0c9c2]/40 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'bookings'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          My Service Bookings ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'projects'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          Home Projects ({projectRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'addresses'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          Saved Addresses (3)
        </button>
        <button
          onClick={() => setActiveTab('dpdp')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'dpdp'
              ? 'bg-[#003523] text-white'
              : 'text-[#003523] bg-[#c0edd3]/30 hover:bg-[#c0edd3]/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DPDP Privacy & Rights</span>
        </button>
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#c0c9c2]/40 text-xs text-[#707973]">
              No service requests yet.
            </div>
          ) : (
            requests.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 hover:border-[#003523] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#131b2e]">#{order.id}</span>
                    <span className="text-[11px] text-[#707973]">· {order.createdAt}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        order.status === 'NEW'
                          ? 'bg-[#ffdcc3] text-[#904d00]'
                          : order.status === 'UNDER REVIEW'
                          ? 'bg-[#eaedff] text-[#003523]'
                          : order.status === 'ASSIGNED'
                          ? 'bg-[#c0edd3] text-[#003523]'
                          : order.status === 'IN PROGRESS'
                          ? 'bg-[#fe932c] text-[#002114]'
                          : 'bg-[#c0edd3] text-[#003523]'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-[#131b2e]">
                    {order.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                  </div>

                  <div className="text-[11px] text-[#707973]">
                    {order.address} · Preferred Slot: {order.preferredTimeSlot}
                  </div>

                  {order.assignedTo && (
                    <div className="text-[11px] text-[#003523] font-semibold pt-0.5">
                      Assigned Pro: {order.assignedTo.name} ({order.assignedTo.phone})
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#c0c9c2]/30">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#707973] block">Total</span>
                    <span className="text-sm font-black text-[#003523]">₹{order.total}</span>
                  </div>

                  <button
                    onClick={() => setActiveTrackingRequestId(order.id)}
                    className="px-3.5 py-2 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <span>View Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projectRequests.map((prj) => (
            <div
              key={prj.id}
              className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-2 text-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[11px] font-bold text-[#707973]">{prj.id}</span>
                  <h3 className="font-bold text-sm text-[#131b2e]">{prj.projectType}</h3>
                  <div className="text-[#003523] font-semibold">
                    {prj.locality} · {prj.approxAreaSqFt} sq.ft ({prj.propertyType})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eaedff] text-[#003523]">
                  {prj.status}
                </span>
              </div>
              <p className="text-[#404943] text-xs">{prj.description}</p>
              <div className="pt-2 border-t border-[#c0c9c2]/40 flex justify-between text-[#707973]">
                <span>Budget: {prj.budgetRange}</span>
                <span>Timeline: {prj.preferredStartDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 bg-white rounded-xl border border-[#003523] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#003523]">Primary Residence (Sector 104)</span>
              <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-1.5 py-0.5 rounded font-bold">
                DEFAULT
              </span>
            </div>
            <p className="text-[#131b2e]">Villa 42, The Terraces, Sector 104, Mohali</p>
            <div className="text-[11px] text-[#707973]">Landmark: Emaar Mohali Hills Luxury Belt</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 space-y-2">
            <span className="font-bold text-[#131b2e]">Apartment (Sector 110)</span>
            <p className="text-[#131b2e]">Tower 4, Flat 602, Wellington Heights, TDI City, Sector 110, Mohali</p>
            <div className="text-[11px] text-[#707973]">Landmark: TDI Wellington Park Gate</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 space-y-2">
            <span className="font-bold text-[#131b2e]">Office / Commercial (Sector 111)</span>
            <p className="text-[#131b2e]">SCO 18, TDI Connaught Place, Sector 111, Mohali</p>
            <div className="text-[11px] text-[#707973]">Landmark: Landran–Banur Road Junction</div>
          </div>
        </div>
      )}

      {/* DPDP Act 2023 Privacy & Data Rights Tab */}
      {activeTab === 'dpdp' && (
        <div className="space-y-4">
          {/* Statutory Preamble Banner */}
          <div className="p-4 rounded-2xl bg-[#002114] text-white border border-[#144d37] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#b6efd1] text-[#002114] flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#003523]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">DPDP Act 2023 Compliance Center</h3>
                  <span className="text-[10px] bg-[#fe932c] text-[#002114] font-black px-1.5 py-0.5 rounded uppercase">
                    Law of India
                  </span>
                </div>
                <p className="text-xs text-[#b6efd1] leading-relaxed">
                  UrbanCare Solution acts as a verified Data Fiduciary in Kharar & Mohali. We process personal data solely for home repair execution and 30-day workmanship warranty fulfillment.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDPDPNoticeOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#b6efd1] hover:bg-[#85bda1] text-[#002114] font-bold text-xs whitespace-nowrap shadow-xs transition-all flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#003523]" />
              <span>Read Section 5 Notice (EN/ਪੰਜਾਬੀ/HI)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Right to Access Information (Section 11) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#003523]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Right to Access Information (Sec 11)</h4>
                </div>
                <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-2 py-0.5 rounded-full font-bold">
                  Machine-Readable
                </span>
              </div>
              <p className="text-xs text-[#404943] leading-relaxed">
                Obtain a complete portable summary of personal records held, including booking logs, timestamps, technician dispatch assignments, and consent history.
              </p>
              <button
                onClick={() => {
                  const dataJson = exportPersonalData();
                  const blob = new Blob([dataJson], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `urbancare_dpdp_data_${Date.now()}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2 px-3 rounded-lg border border-[#003523] text-[#003523] hover:bg-[#c0edd3]/25 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export My Data File (JSON)</span>
              </button>
            </div>

            {/* Card 2: Purpose-Bound Consent Management (Section 6) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#003523]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Purpose & Consent Controls (Sec 6)</h4>
                </div>
                <span className="text-[10px] bg-[#eaedff] text-[#003523] px-2 py-0.5 rounded-full font-bold">
                  {dpdpConsent.version}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-[#404943]">
                  <span>Doorstep Service Fulfillment:</span>
                  <span className="font-bold text-[#003523]">Active (Essential)</span>
                </div>
                <div className="flex justify-between items-center text-[#404943]">
                  <span>Technician Call Masking:</span>
                  <span className={`font-bold ${dpdpConsent.callMasking ? 'text-[#003523]' : 'text-[#ba1a1a]'}`}>
                    {dpdpConsent.callMasking ? 'Shielded' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#404943]">
                  <span>WhatsApp / SMS ETA Alerts:</span>
                  <span className={`font-bold ${dpdpConsent.dispatchUpdates ? 'text-[#003523]' : 'text-[#707973]'}`}>
                    {dpdpConsent.dispatchUpdates ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#404943]">
                  <span>Seasonal Maintenance Reminders:</span>
                  <span className={`font-bold ${dpdpConsent.promotionalMarketing ? 'text-[#003523]' : 'text-[#707973]'}`}>
                    {dpdpConsent.promotionalMarketing ? 'Opted-in' : 'Default OFF'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDPDPConsentManagerOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-[#fe932c]" />
                <span>Manage & Withdraw Consents</span>
              </button>
            </div>

            {/* Card 3: Statutory Right to Nominate (Section 14) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#fe932c]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Right to Nominate (Sec 14)</h4>
                </div>
                <span className="text-[10px] bg-[#ffdcc3] text-[#904d00] px-2 py-0.5 rounded-full font-bold">
                  Statutory Protection
                </span>
              </div>
              <p className="text-xs text-[#404943] leading-relaxed">
                Nominate an individual to exercise your digital personal data rights in the event of death or incapacity.
              </p>
              {dpdpNominee ? (
                <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/50 text-[11px] space-y-0.5">
                  <div className="font-bold text-[#003523]">{dpdpNominee.fullName} ({dpdpNominee.relationship})</div>
                  <div className="text-[#707973]">{dpdpNominee.phone}</div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-gray-50 text-[11px] text-gray-500 italic">
                  No nominee appointed yet.
                </div>
              )}
              <button
                onClick={() => setIsDPDPDataRightsOpen(true)}
                className="w-full py-2 px-3 rounded-lg border border-[#c0c9c2] hover:bg-gray-50 text-[#131b2e] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#003523]" />
                <span>{dpdpNominee ? 'Update Nominee' : 'Appoint Nominee'}</span>
              </button>
            </div>

            {/* Card 4: Grievance Redressal & Data Protection Officer (Section 13) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-[#003523]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Data Protection Officer (Sec 13)</h4>
                </div>
                <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-2 py-0.5 rounded-full font-bold">
                  7-Day SLA
                </span>
              </div>
              <div className="text-xs text-[#404943] space-y-1">
                <p><strong>Grievance Officer:</strong> Mr. Gurpreet Singh</p>
                <p><strong>Office:</strong> SCF 14, Sector 125, Kharar, Punjab</p>
                <p><strong>Direct Line:</strong> +91 98882 10452 | grievance@urbancaresolution.in</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDPDPDataRightsOpen(true)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Building className="w-3.5 h-3.5 text-[#fe932c]" />
                  <span>File Grievance Ticket</span>
                </button>
                <button
                  onClick={() => setIsDPDPDataRightsOpen(true)}
                  className="py-2 px-3 rounded-lg border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/20 font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Request Erasure"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Erasure</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
