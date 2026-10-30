import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LOCALITIES, SERVICE_CATEGORIES } from '../../data/initialData';
import {
  X,
  Phone,
  Search,
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  HardHat,
  Wrench,
  Trash2,
  History,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';

interface PhoneBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (bookingId: string) => void;
}

export const PhoneBookingModal: React.FC<PhoneBookingModalProps> = ({
  isOpen,
  onClose,
  onBookingCreated
}) => {
  const {
    customers,
    requests,
    services,
    currentLocality,
    authProfile,
    createPhoneBooking
  } = useApp();

  // Step 1: Customer Lookup States
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<{
    id?: string;
    name: string;
    phone: string;
    email?: string;
    locality: string;
    address: string;
    landmark?: string;
    pastBookingsCount: number;
    pastBookings: Array<{ id: string; service: string; date: string; status: string }>;
  } | null>(null);

  // Form Fields (editable once found or new)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locality, setLocality] = useState(currentLocality || LOCALITIES[0]);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [showPastHistory, setShowPastHistory] = useState(false);

  // Step 2: Booking Form States
  const [bookingType, setBookingType] = useState<'QUICK_SERVICE' | 'PROJECT'>('QUICK_SERVICE');
  const [selectedCategory, setSelectedCategory] = useState<string>(SERVICE_CATEGORIES[0].id);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string>('');
  const [customServiceName, setCustomServiceName] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState('Today');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('4:00 PM - 6:00 PM');
  const [source, setSource] = useState<'Phone' | 'Website' | 'WhatsApp' | 'Referral'>('Phone');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Subservices filtered by category
  const availableServices = useMemo(() => {
    return services.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [services, selectedCategory]);

  useEffect(() => {
    if (availableServices.length > 0) {
      setSelectedSubServiceId(availableServices[0].id);
      setCustomServiceName(availableServices[0].name);
    } else {
      setSelectedSubServiceId('');
      setCustomServiceName('');
    }
  }, [selectedCategory, availableServices]);

  // Reset all modal fields to their pristine default state
  const resetForm = () => {
    setPhoneSearch('');
    setSearched(false);
    setMatchedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setLocality(currentLocality || LOCALITIES[0]);
    setAddress('');
    setLandmark('');
    setShowPastHistory(false);
    setBookingType('QUICK_SERVICE');
    setSelectedCategory(SERVICE_CATEGORIES[0].id);
    setSelectedSubServiceId(availableServices[0]?.id || '');
    setCustomServiceName(availableServices[0]?.name || '');
    setProblemDescription('');
    setPhotos([]);
    setPreferredDate('Today');
    setPreferredTimeSlot('4:00 PM - 6:00 PM');
    setSource('Phone');
    setInternalNotes('');
    setIsSubmitting(false);
    setFormError(null);
  };

  // Ops manager cancel / close handler
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Reset form whenever modal closes or opens fresh
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Keyboard Escape listener to cancel and clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalizes phone string to last 10 digits
  const cleanPhoneDigits = (raw: string) => raw.replace(/\D/g, '').slice(-10);

  // Handle phone lookup
  const handleLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    const digits = cleanPhoneDigits(phoneSearch);
    if (digits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSearched(true);
    setCustomerPhone(phoneSearch.trim());

    // Search existing customers
    const foundCust = customers.find((c) => cleanPhoneDigits(c.phone) === digits);
    const relatedRequests = requests.filter((r) => cleanPhoneDigits(r.customerPhone) === digits);

    if (foundCust || relatedRequests.length > 0) {
      const name = foundCust?.name || relatedRequests[0]?.customerName || '';
      const addr = foundCust?.address || relatedRequests[0]?.address || '';
      const loc = foundCust?.locality || relatedRequests[0]?.locality || currentLocality || LOCALITIES[0];
      const lmk = relatedRequests[0]?.landmark || '';
      const pastList = relatedRequests.map((r) => ({
        id: r.id,
        service: r.items.map((i) => i.serviceName).join(', ') || 'Service',
        date: r.preferredDate || r.createdAt,
        status: r.status
      }));

      setMatchedCustomer({
        id: foundCust?.id,
        name,
        phone: foundCust?.phone || relatedRequests[0]?.customerPhone || phoneSearch,
        email: foundCust?.email,
        locality: loc,
        address: addr,
        landmark: lmk,
        pastBookingsCount: relatedRequests.length || foundCust?.totalBookings || 1,
        pastBookings: pastList
      });

      setCustomerName(name);
      setAddress(addr);
      setLocality(loc);
      setLandmark(lmk);
    } else {
      // Not found: inline registration
      setMatchedCustomer(null);
      setCustomerName('');
      setAddress('');
      setLocality(currentLocality || LOCALITIES[0]);
      setLandmark('');
    }
  };

  // Photo upload handling (converts to base64 preview data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit phone booking
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const digits = cleanPhoneDigits(customerPhone || phoneSearch);
    if (digits.length < 10) {
      setFormError('A valid 10-digit mobile number is required.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Please enter the customer name.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please provide the doorstep service address.');
      return;
    }
    if (!problemDescription.trim()) {
      setFormError('Please write a brief problem description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeServiceName =
        bookingType === 'PROJECT'
          ? customServiceName || 'Civil Project Site Visit'
          : availableServices.find((s) => s.id === selectedSubServiceId)?.name || customServiceName || 'Standard Service';

      const bookingId = createPhoneBooking({
        customerId: matchedCustomer?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || phoneSearch.trim(),
        locality,
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        bookingType,
        categoryId: selectedCategory,
        subServiceId: selectedSubServiceId,
        serviceName: activeServiceName,
        problemDescription: problemDescription.trim(),
        problemPhotos: photos,
        preferredDate,
        preferredTimeSlot,
        source,
        internalNotes: internalNotes.trim() || undefined,
        createdBy: authProfile?.full_name || 'Harman (Ops Lead)'
      });

      resetForm();
      onClose();
      if (onBookingCreated && bookingId) {
        onBookingCreated(bookingId);
      }
    } catch (err: unknown) {
      console.error(err);
      setFormError('Failed to create phone booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black shadow-md">
              <Phone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  New Inbound Phone Booking
                </h2>
                <span className="text-[10px] bg-white/20 text-[#fe932c] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ops Console
                </span>
              </div>
              <p className="text-xs text-[#b6efd1] mt-0.5">
                Log calling resident, verify existing address & dispatch technician
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cancel and close phone booking"
            title="Cancel & Clear Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="phone-booking-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs bg-[#faf8ff]"
        >
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: CUSTOMER LOOKUP                                  */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c0c9c2]/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-black text-[#131b2e] uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-[#003523] text-white flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                <span>Customer Phone Verification</span>
              </div>
              {searched && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    matchedCustomer
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {matchedCustomer ? 'Existing Customer Found' : 'New Customer (No Account)'}
                </span>
              )}
            </div>

            {/* Phone search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#707973]" />
                <input
                  type="tel"
                  value={phoneSearch}
                  onChange={(e) => {
                    setPhoneSearch(e.target.value);
                    setCustomerPhone(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  placeholder="Enter 10-digit mobile number (e.g. 98884 10099)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#c0c9c2] text-xs font-bold text-[#131b2e] focus:border-[#003523]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookup()}
                className="px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <span>Verify Phone</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {(phoneSearch || searched) && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneSearch('');
                    setSearched(false);
                    setMatchedCustomer(null);
                    setCustomerName('');
                    setCustomerPhone('');
                    setAddress('');
                    setLandmark('');
                    setFormError(null);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-[#c0c9c2] text-[#707973] hover:text-[#131b2e] hover:bg-gray-100 font-bold text-xs cursor-pointer transition-colors"
                  title="Clear phone search & customer data"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Matched dossier card if found */}
            {matchedCustomer && (
              <div className="p-3.5 rounded-xl bg-[#c0edd3]/25 border border-[#003523]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#002114] flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#003523]" />
                    <span className="text-sm">{matchedCustomer.name}</span>
                  </div>
                  <span className="text-[11px] text-[#003523] font-bold bg-white px-2 py-0.5 rounded-full border border-[#003523]/20">
                    {matchedCustomer.pastBookingsCount} Past Bookings
                  </span>
                </div>

                <div className="text-[11px] text-[#404943] flex items-start space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#003523] shrink-0 mt-0.5" />
                  <span>
                    {matchedCustomer.address} ({matchedCustomer.locality})
                  </span>
                </div>

                {matchedCustomer.pastBookings.length > 0 && (
                  <div className="pt-1 border-t border-[#003523]/20">
                    <button
                      type="button"
                      onClick={() => setShowPastHistory(!showPastHistory)}
                      className="text-[11px] font-bold text-[#003523] flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{showPastHistory ? 'Hide Past Bookings' : 'View Past Bookings'}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${showPastHistory ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {showPastHistory && (
                      <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                        {matchedCustomer.pastBookings.map((pb) => (
                          <div
                            key={pb.id}
                            className="p-2 rounded-lg bg-white border border-[#c0c9c2]/40 flex items-center justify-between text-[11px]"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#003523]">#{pb.id}</span>
                              <span className="ml-1.5 text-[#131b2e] font-semibold">{pb.service}</span>
                            </div>
                            <span className="text-[10px] text-[#707973]">{pb.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Customer Details Form (Always shown so ops can review/edit/enter new) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Gurpreet Kaur"
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#131b2e] bg-white focus:border-[#003523]"
                />
              </div>

              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Locality / Sector *</label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#131b2e] bg-white focus:border-[#003523]"
                >
                  {LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#131b2e] font-bold mb-1">Service Doorstep Address *</label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Kothi No., Street, Floor, Sector details..."
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs text-[#131b2e] bg-white focus:border-[#003523]"
                />
              </div>

              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Gurudwara / Reliance Fresh"
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs text-[#131b2e] bg-white focus:border-[#003523]"
                />
              </div>

              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Call Booking Source</label>
                <select
                  value={source}
                  onChange={(e) =>
                    setSource(e.target.value as 'Phone' | 'Website' | 'WhatsApp' | 'Referral')
                  }
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-bold text-[#003523] bg-white focus:border-[#003523]"
                >
                  <option value="Phone">Phone (Inbound Dispatch Call)</option>
                  <option value="WhatsApp">WhatsApp Inquiry</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Local Referral</option>
                </select>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 2: BOOKING FORM                                     */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c0c9c2]/50 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-xs font-black text-[#131b2e] uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-[#003523] text-white flex items-center justify-center text-[10px] font-black">
                2
              </span>
              <span>Service Specification & Diagnostic Scope</span>
            </div>

            {/* Booking Type Toggle: Quick Service vs Project */}
            <div>
              <label className="block font-bold text-[#131b2e] mb-1.5 uppercase tracking-wider text-[11px]">
                Booking Classification *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBookingType('QUICK_SERVICE')}
                  className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    bookingType === 'QUICK_SERVICE'
                      ? 'border-[#003523] bg-[#c0edd3]/25 text-[#003523] ring-1 ring-[#003523]'
                      : 'border-[#c0c9c2]/60 bg-white text-[#404943] hover:border-[#003523]'
                  }`}
                >
                  <Wrench className="w-4 h-4 mt-0.5 text-[#003523] shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Quick Doorstep Service</div>
                    <div className="text-[10px] text-[#707973]">
                      Repairs, AC maintenance, breakdown (Status: Pending Assignment)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType('PROJECT')}
                  className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    bookingType === 'PROJECT'
                      ? 'border-[#fe932c] bg-[#ffdcc3]/30 text-[#904d00] ring-1 ring-[#fe932c]'
                      : 'border-[#c0c9c2]/60 bg-white text-[#404943] hover:border-[#fe932c]'
                  }`}
                >
                  <HardHat className="w-4 h-4 mt-0.5 text-[#fe932c] shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Turnkey / Civil Project</div>
                    <div className="text-[10px] text-[#707973]">
                      Renovation, site survey, BOQ quote (Status: Visit Scheduled)
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category & Subservice Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Service Category *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-bold text-[#131b2e] bg-white focus:border-[#003523]"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#131b2e] mb-1">
                  {bookingType === 'PROJECT' ? 'Project Type / Focus *' : 'Sub-Service Item *'}
                </label>
                {bookingType === 'PROJECT' ? (
                  <select
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#131b2e] bg-white focus:border-[#003523]"
                  >
                    <option value="Turnkey Renovation">Turnkey Flat / Kothi Renovation</option>
                    <option value="Modular Kitchen Overhaul">Modular Kitchen Overhaul</option>
                    <option value="Sanitary & Bathroom Remodel">Sanitary & Bathroom Remodel</option>
                    <option value="Full House Painting">Full House Painting & Damp Proofing</option>
                    <option value="Gate & Safety Grill Fabrication">Gate & Safety Grill Fabrication</option>
                    <option value="Civil Structure & Mumty Addition">Civil Structure & Mumty Addition</option>
                  </select>
                ) : (
                  <select
                    value={selectedSubServiceId}
                    onChange={(e) => {
                      setSelectedSubServiceId(e.target.value);
                      const svc = availableServices.find((s) => s.id === e.target.value);
                      if (svc) setCustomServiceName(svc.name);
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#131b2e] bg-white focus:border-[#003523]"
                  >
                    {availableServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} · ₹{svc.basePrice}
                      </option>
                    ))}
                    <option value="custom">Other / Custom Repair Requirement</option>
                  </select>
                )}
              </div>
            </div>

            {selectedSubServiceId === 'custom' && (
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Custom Service Name *</label>
                <input
                  type="text"
                  required
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="e.g. Havells Geyser coil replacement"
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
                />
              </div>
            )}

            {/* Problem Description */}
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Customer Problem Description *
              </label>
              <textarea
                rows={2}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="What did the customer explain on the phone? (e.g. AC cooling fan vibrating loudly, water leak near bathroom diverter)..."
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs text-[#131b2e] bg-white focus:border-[#003523]"
              />
            </div>

            {/* Photos (optional upload) */}
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Attach Diagnostic Photos (Optional)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-2 rounded-xl border border-dashed border-[#003523] text-[#003523] hover:bg-[#c0edd3]/20 font-bold text-xs flex items-center space-x-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-[#707973]">
                  Caller WhatsApp photos or onsite breakdown pictures
                </span>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {photos.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden border border-[#c0c9c2] aspect-4/3 group"
                    >
                      <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-red-600"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date and Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Preferred Date *</label>
                <select
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#131b2e] bg-white focus:border-[#003523]"
                >
                  <option value="Today">Today (Emergency / Priority)</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Day After">Day After</option>
                  <option value="This Weekend">This Weekend</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Preferred Time Slot *</label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#131b2e] bg-white focus:border-[#003523]"
                >
                  <option value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 1:00 PM">11:00 AM - 1:00 PM</option>
                  <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                  <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                  <option value="6:00 PM - 8:00 PM">6:00 PM - 8:00 PM</option>
                </select>
              </div>
            </div>

            {/* Internal Notes (Ops Only) */}
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Internal Ops Notes (Not visible to customer)
              </label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. Caller is senior citizen, gate code 4421, technician needs long ladder..."
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs text-[#131b2e] bg-white focus:border-[#003523]"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 3: ROUTING PREVIEW                                  */}
          {/* ======================================================== */}
          <div className="p-3.5 rounded-2xl bg-[#003523]/5 border border-[#003523]/20 flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#003523] shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-[#003523] block">
                Automatic Lifecycle Routing Rule
              </span>
              <p className="text-[#404943] text-[11px] mt-0.5 leading-relaxed">
                {bookingType === 'QUICK_SERVICE' ? (
                  <>
                    This booking will enter the queue with status{' '}
                    <strong className="text-[#003523]">"Pending Assignment"</strong>. You can manually
                    dispatch a verified vendor from the Bookings Queue immediately after logging.
                  </>
                ) : (
                  <>
                    This project will create a Site Visit request with status{' '}
                    <strong className="text-[#fe932c]">"Visit Scheduled"</strong>. No vendor will be
                    assigned until a civil quote is sent and approved.
                  </>
                )}
              </p>
            </div>
          </div>
        </form>

        {/* Footer Action Buttons */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-[#c0c9c2] text-[#404943] font-bold text-xs hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            form="phone-booking-form"
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
            <span>{isSubmitting ? 'Creating Booking...' : 'Create Phone Booking'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
