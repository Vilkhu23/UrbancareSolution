import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      <div className="bg-[#003523] text-white rounded-2xl p-6 sm:p-8 space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Kharar Dispatch Center & Customer Helpline
        </h1>
        <p className="text-xs sm:text-sm text-[#b6efd1] max-w-xl">
          Need emergency water motor assistance or want to discuss a turnkey renovation in person? Reach our central Kharar team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-6 space-y-5 shadow-xs text-xs">
          <h2 className="text-base font-bold text-[#131b2e]">Office & Hotline</h2>

          <div className="flex items-start space-x-3 text-[#404943]">
            <MapPin className="w-5 h-5 text-[#003523] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#131b2e] block">Physical Dispatch Base</strong>
              <span>SCF 14, Sector 125, Sunny Enclave, Kharar, Greater Mohali, Punjab 140301</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-[#404943]">
            <Phone className="w-5 h-5 text-[#003523] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#131b2e] block">Telephone Dispatch Line</strong>
              <span>+91 82840 18909 (Tricity Dispatch Line)</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-[#404943]">
            <Clock className="w-5 h-5 text-[#003523] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#131b2e] block">Operating Hours</strong>
              <span>Monday to Sunday: 7:30 AM – 9:00 PM (Emergency breakdown vans on call)</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-[#404943]">
            <Mail className="w-5 h-5 text-[#003523] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#131b2e] block">Operations Email</strong>
              <span>dispatch@urbancaresolution.in</span>
            </div>
          </div>
        </div>

        {/* Quick Message Form */}
        <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-6 space-y-4 shadow-xs text-xs">
          <h2 className="text-base font-bold text-[#131b2e]">Send a Direct Note to Dispatch Lead</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Message sent to Kharar dispatch control. We will call you back shortly.');
            }}
            className="space-y-3"
          >
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="Amanjot Sandhu"
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Phone Number (+91)</label>
              <input
                type="text"
                required
                placeholder="+91 9872X XXXXX"
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Sector / Locality in Tricity</label>
              <input
                type="text"
                required
                placeholder="Sector 104 / Sector 110 (Sectors 94 to 111)"
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Message or Query</label>
              <textarea
                rows={3}
                required
                placeholder="How can our operations team help you?"
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#003523] hover:bg-[#144d37] text-white font-bold rounded-xl shadow-md transition-all"
            >
              Send Dispatch Query
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
