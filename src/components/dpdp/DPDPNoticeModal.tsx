import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  X,
  FileText,
  UserCheck,
  Lock,
  Globe2,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Trash2,
  UserPlus
} from 'lucide-react';

export const DPDPNoticeModal: React.FC = () => {
  const { isDPDPNoticeOpen, setIsDPDPNoticeOpen, setIsDPDPConsentManagerOpen, setIsDPDPDataRightsOpen } = useApp();
  const [activeLang, setActiveLang] = useState<'en' | 'pa' | 'hi'>('en');

  if (!isDPDPNoticeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-[#c0c9c2]/60 flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#002114] text-white flex items-center justify-between border-b border-[#144d37]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#b6efd1] text-[#002114] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#003523]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white">Statutory Privacy Notice</h2>
                <span className="text-[10px] bg-[#fe932c] text-[#002114] font-black px-1.5 py-0.5 rounded uppercase">
                  DPDP Act 2023
                </span>
              </div>
              <p className="text-[11px] text-[#b6efd1]">
                Digital Personal Data Protection Act, 2023 · Section 5 Statutory Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher for 8th Schedule Language Access */}
            <div className="flex items-center bg-[#144d37] rounded-lg p-0.5 border border-[#336851]">
              <button
                type="button"
                onClick={() => setActiveLang('en')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeLang === 'en' ? 'bg-[#b6efd1] text-[#002114]' : 'text-gray-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('pa')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeLang === 'pa' ? 'bg-[#b6efd1] text-[#002114]' : 'text-gray-300 hover:text-white'
                }`}
              >
                ਪੰਜਾਬੀ
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('hi')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeLang === 'hi' ? 'bg-[#b6efd1] text-[#002114]' : 'text-gray-300 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={() => setIsDPDPNoticeOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[#131b2e] leading-relaxed">
          
          {/* Official preamble badge */}
          <div className="p-3 rounded-xl bg-[#c0edd3]/30 border border-[#b6efd1] flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-[#003523] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#002114]">
              <span className="font-bold">Data Fiduciary: </span>
              UrbanCare Solution (Kharar & Mohali, Punjab). We process personal data exclusively for verifiable home service execution under Section 4, 5 & 6 of the Digital Personal Data Protection Act (DPDPA), 2023.
            </div>
          </div>

          {/* ENGLISH NOTICE */}
          {activeLang === 'en' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#fe932c]" />
                  <span>1. Itemised Personal Data Collected & Processing Purpose (Section 5(1))</span>
                </h3>
                <div className="overflow-x-auto border border-[#c0c9c2]/50 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#f2f3ff] text-[#404943] border-b border-[#c0c9c2]/50">
                      <tr>
                        <th className="p-2.5 font-bold">Data Category</th>
                        <th className="p-2.5 font-bold">Data Elements</th>
                        <th className="p-2.5 font-bold">Specified Purpose (Purpose Limitation)</th>
                        <th className="p-2.5 font-bold">Retention Period</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c0c9c2]/30">
                      <tr>
                        <td className="p-2.5 font-semibold text-[#131b2e]">Customer Contact</td>
                        <td className="p-2.5 text-[#404943]">Full Name, Mobile Number, Email (Optional)</td>
                        <td className="p-2.5 text-[#404943]">Account authentication, technician dispatch OTP, emergency call routing</td>
                        <td className="p-2.5 text-[#707973]">Active account tenure or until erasure requested</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-[#131b2e]">Doorstep Location</td>
                        <td className="p-2.5 text-[#404943]">Locality (Sectors 94-115, Kharar, Mohali), Street address, Landmark</td>
                        <td className="p-2.5 text-[#404943]">Doorstep navigation & physical service execution by verified artisan</td>
                        <td className="p-2.5 text-[#707973]">30-day workmanship warranty period</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-[#131b2e]">Order & Invoices</td>
                        <td className="p-2.5 text-[#404943]">Services ordered, visit fee, invoice totals, payment mode</td>
                        <td className="p-2.5 text-[#404943]">GST accounting, transparent pricing verification, warranty tracking</td>
                        <td className="p-2.5 text-[#707973]">Statutory retention (Indian tax law)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-[#131b2e]">Support & Audit</td>
                        <td className="p-2.5 text-[#404943]">Service ratings, complaint notes, dispute resolution logs</td>
                        <td className="p-2.5 text-[#404943]">Operations quality assurance & dispute redressal by Kharar supervisors</td>
                        <td className="p-2.5 text-[#707973]">90 days from case closure</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-[#fe932c]" />
                  <span>2. Your Statutory Data Principal Rights (Sections 11 - 14)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1">
                    <span className="font-bold text-[#131b2e] flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#003523]" />
                      <span>Right to Access Information (Sec 11)</span>
                    </span>
                    <p className="text-[#404943]">
                      View a summary of your personal data processed, identities of technicians assigned, and download a machine-readable JSON copy anytime.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1">
                    <span className="font-bold text-[#131b2e] flex items-center space-x-1">
                      <Trash2 className="w-3.5 h-3.5 text-[#ba1a1a]" />
                      <span>Right to Correction & Erasure (Sec 12)</span>
                    </span>
                    <p className="text-[#404943]">
                      Request correction of inaccurate information or permanent erasure of your personal data once the service warranty has expired.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1">
                    <span className="font-bold text-[#131b2e] flex items-center space-x-1">
                      <UserPlus className="w-3.5 h-3.5 text-[#fe932c]" />
                      <span>Right to Nominate (Sec 14)</span>
                    </span>
                    <p className="text-[#404943]">
                      Nominate any individual who shall exercise your data rights in the event of death or incapacity.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1">
                    <span className="font-bold text-[#131b2e] flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-[#003523]" />
                      <span>Right to Grievance Redressal (Sec 13)</span>
                    </span>
                    <p className="text-[#404943]">
                      Lodge formal privacy complaints directly with our Data Protection Officer with a guaranteed response within 7 business days.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
                  <span>3. Protection of Children & Minors (Section 9)</span>
                </h3>
                <p className="text-[#404943] text-[11px]">
                  UrbanCare Solution does not intentionally collect or process personal data of children under 18 years of age without verifiable parental consent. All doorstep repair bookings must be authorized by an adult household member.
                </p>
              </section>

              <section className="p-3.5 rounded-xl bg-[#002114]/5 border border-[#003523]/20 space-y-2">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-[#fe932c]" />
                  <span>4. Data Protection Officer (DPO) & Redressal Mechanism</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#131b2e]">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#fe932c] shrink-0" />
                    <span>SCF 14, Sec 125, Sunny Enclave, Kharar, Punjab</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#fe932c] shrink-0" />
                    <span>+91 98882 10452 (DPO Line)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#fe932c] shrink-0" />
                    <span>grievance@urbancaresolution.in</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#707973] pt-1">
                  If your grievance is not resolved satisfactorily by our officer within statutory timelines, you have the right to appeal to the <strong>Data Protection Board of India (DPBI)</strong> under Section 13(3) of the Act.
                </p>
              </section>
            </div>
          )}

          {/* PUNJABI (ਪੰਜਾਬੀ) NOTICE */}
          {activeLang === 'pa' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#fe932c]" />
                  <span>1. ਇਕੱਤਰ ਕੀਤਾ ਨਿੱਜੀ ਡਾਟਾ ਅਤੇ ਵਰਤੋਂ ਦਾ ਉਦੇਸ਼ (ਧਾਰਾ 5)</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-2 text-[11px] text-[#131b2e]">
                  <p>
                    <strong>ਅਰਬਨਕੇਅਰ ਸਲਿਊਸ਼ਨ (UrbanCare Solution)</strong> ਸਿਰਫ਼ ਤੁਹਾਡੀਆਂ ਘਰੇਲੂ ਸੇਵਾਵਾਂ (ਬਿਜਲੀ, ਪਲੰਬਿੰਗ, ਏਅਰ ਕੰਡੀਸ਼ਨਰ, ਸਫ਼ਾਈ) ਨੂੰ ਪੂਰਾ ਕਰਨ ਲਈ ਤੁਹਾਡਾ ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ ਖਰੜ/ਮੋਹਾਲੀ ਦਾ ਪਤਾ ਇਕੱਤਰ ਕਰਦਾ ਹੈ।
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[#404943]">
                    <li><strong>ਨਾਮ ਅਤੇ ਫ਼ੋਨ ਨੰਬਰ:</strong> ਬੁਕਿੰਗ ਦੀ ਪੁਸ਼ਟੀ ਅਤੇ ਕਾਰੀਗਰ ਨਾਲ ਸਿੱਧੇ ਸੰਪਰਕ ਲਈ।</li>
                    <li><strong>ਪਤਾ ਅਤੇ ਲੈਂਡਮਾਰਕ:</strong> ਕਾਰੀਗਰ ਨੂੰ ਤੁਹਾਡੇ ਘਰ ਪਹੁੰਚਾਉਣ ਲਈ।</li>
                    <li><strong>ਬਿੱਲ ਅਤੇ ਵਾਰੰਟੀ:</strong> 30 ਦਿਨਾਂ ਦੀ ਮੁਫ਼ਤ ਕੰਮ ਵਾਰੰਟੀ ਅਤੇ ਹਿਸਾਬ-ਕਿਤਾਬ ਲਈ।</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-[#fe932c]" />
                  <span>2. ਤੁਹਾਡੇ ਕਾਨੂੰਨੀ ਅਧਿਕਾਰ (ਧਾਰਾ 11 ਤੋਂ 14)</span>
                </h3>
                <div className="p-3 rounded-xl bg-[#c0edd3]/30 border border-[#b6efd1] space-y-1.5 text-[11px] text-[#002114]">
                  <p>✓ <strong>ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰਨ ਦਾ ਅਧਿਕਾਰ:</strong> ਤੁਸੀਂ ਆਪਣਾ ਸਾਰਾ ਡਾਟਾ ਕਿਸੇ ਵੀ ਸਮੇਂ ਵੇਖ ਅਤੇ ਡਾਊਨਲੋਡ ਕਰ ਸਕਦੇ ਹੋ।</p>
                  <p>✓ <strong>ਡਾਟਾ ਮਿਟਾਉਣ (Erasure) ਦਾ ਅਧਿਕਾਰ:</strong> ਵਾਰੰਟੀ ਖ਼ਤਮ ਹੋਣ ਉਪਰੰਤ ਆਪਣਾ ਡਾਟਾ ਸਿਸਟਮ ਵਿੱਚੋਂ ਹਟਾਉਣ ਦੀ ਬੇਨਤੀ ਕਰ ਸਕਦੇ ਹੋ।</p>
                  <p>✓ <strong>ਸਹਿਮਤੀ ਵਾਪਸ ਲੈਣ ਦਾ ਅਧਿਕਾਰ:</strong> ਤੁਸੀਂ ਪ੍ਰਚਾਰ ਸੰਦੇਸ਼ ਜਾਂ ਵਾਧੂ ਸੂਚਨਾਵਾਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਬੰਦ ਕਰ ਸਕਦੇ ਹੋ।</p>
                  <p>✓ <strong>ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਨ ਅਧਿਕਾਰੀ (DPO):</strong> ਸ਼੍ਰੀ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ, ਸੰਨੀ ਐਨਕਲੇਵ ਖਰੜ (+91 98882 10452).</p>
                </div>
              </section>
            </div>
          )}

          {/* HINDI (हिन्दी) NOTICE */}
          {activeLang === 'hi' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#fe932c]" />
                  <span>1. व्यक्तिगत डेटा संग्रह और उद्देश्य (धारा 5)</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-2 text-[11px] text-[#131b2e]">
                  <p>
                    <strong>UrbanCare Solution</strong> डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDPA), 2023 के तहत केवल सेवा निष्पादन (डोरस्टेप रिपेयर) के लिए आपका नाम, मोबाइल नंबर और पता एकत्र करता है।
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[#404943]">
                    <li><strong>नाम व फोन नंबर:</strong> तकनीशियन डिस्पैच और सुरक्षा सत्यापन के लिए।</li>
                    <li><strong>घर का पता (खरड़/मोहाली):</strong> तकनीशियन के आगमन और सेवा निष्पादन के लिए।</li>
                    <li><strong>इनवॉइस व वारंटी:</strong> 30-दिन की कार्य वारंटी और कानूनी अनुपालन के लिए।</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#003523] flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-[#fe932c]" />
                  <span>2. आपके वैधानिक अधिकार (धारा 11 - 14)</span>
                </h3>
                <div className="p-3 rounded-xl bg-[#c0edd3]/30 border border-[#b6efd1] space-y-1.5 text-[11px] text-[#002114]">
                  <p>✓ <strong>पहुंच का अधिकार:</strong> अपने डेटा का सारांश देखें या कॉपी डाउनलोड करें।</p>
                  <p>✓ <strong>डेटा मिटाने का अधिकार:</strong> उद्देश्य पूरा होने पर डेटा हटाने का अनुरोध करें।</p>
                  <p>✓ <strong>सहमति वापसी का अधिकार:</strong> अतिरिक्त मार्केटिंग सूचनाओं को कभी भी बंद करें।</p>
                  <p>✓ <strong>शिकायत निवारण अधिकारी:</strong> श्री गुरप्रीत सिंह, खरड़, पंजाब (+91 98882 10452).</p>
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Modal Footer with Direct Actions */}
        <div className="p-4 bg-[#faf8ff] border-t border-[#c0c9c2]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-[#707973]">
            <Globe2 className="w-4 h-4 text-[#003523]" />
            <span>Jurisdiction: Mohali / Kharar, Punjab, India</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setIsDPDPNoticeOpen(false);
                setIsDPDPConsentManagerOpen(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-[#003523] text-[#003523] font-bold text-xs hover:bg-[#c0edd3]/30 transition-all text-center"
            >
              Manage Consents
            </button>
            <button
              onClick={() => {
                setIsDPDPNoticeOpen(false);
                setIsDPDPDataRightsOpen(true);
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-xs transition-all text-center"
            >
              Exercise Data Rights
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
