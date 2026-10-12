import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { SERVICE_CATEGORIES, SERVICE_AVAILABLE_ZONES } from '../../data/initialData';
import {
  X,
  UserCheck,
  ShieldCheck,
  Phone,
  Briefcase,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PRESET_ROLES = [
  {
    role: 'Lead Field Supervisor',
    desc: 'Oversees sector squads, complex multi-trade escalations, and VIP inspections'
  },
  {
    role: 'Senior Master Technician',
    desc: '10+ years experience in high-precision diagnosis (HVAC, Inverter boards, 3-Phase)'
  },
  {
    role: 'Field Specialist',
    desc: 'Core technician for standard domestic repairs, fast doorstep turnaround'
  },
  {
    role: 'Fabrication Specialist',
    desc: 'Mild steel, stainless steel (SS 304), heavy gates, grills & structural welding'
  },
  {
    role: 'Quality & Inspection Officer',
    desc: 'Pre-handover safety testing, earthing verification, and job audit sign-offs'
  },
  {
    role: 'Apprentice / Junior Technician',
    desc: 'Field trainee paired with senior masters for tool assistance and safety'
  }
];

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee, isEdit: boolean) => void;
  initialEmployee?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEmployee
}) => {
  const isEdit = Boolean(initialEmployee);

  const [name, setName] = useState(initialEmployee?.name || '');
  const [mobile, setMobile] = useState(initialEmployee?.mobile || '');
  const [employeeCode, setEmployeeCode] = useState(
    initialEmployee?.employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`
  );
  const [role, setRole] = useState(
    initialEmployee?.role || PRESET_ROLES[1].role
  );
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialEmployee?.categories || [SERVICE_CATEGORIES[0].name]
  );
  const [skillsText, setSkillsText] = useState(
    initialEmployee?.skills.join(', ') || ''
  );
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    initialEmployee?.serviceAreas || ['Sector 94', 'Sector 104', 'Sector 110']
  );
  const [availability, setAvailability] = useState<Employee['availability']>(
    initialEmployee?.availability || 'AVAILABLE'
  );
  const [status, setStatus] = useState<Employee['status']>(
    initialEmployee?.status || 'ACTIVE'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if initialEmployee changes
  useEffect(() => {
    if (initialEmployee) {
      setName(initialEmployee.name);
      setMobile(initialEmployee.mobile);
      setEmployeeCode(initialEmployee.employeeCode || `EMP-${initialEmployee.id.replace('emp-', '')}`);
      const isPreset = PRESET_ROLES.some((r) => r.role === initialEmployee.role);
      if (isPreset || !initialEmployee.role) {
        setRole(initialEmployee.role || PRESET_ROLES[1].role);
        setIsCustomRole(false);
      } else {
        setIsCustomRole(true);
        setCustomRole(initialEmployee.role);
      }
      setSelectedCategories(initialEmployee.categories || []);
      setSkillsText(initialEmployee.skills?.join(', ') || '');
      setSelectedAreas(initialEmployee.serviceAreas || []);
      setAvailability(initialEmployee.availability);
      setStatus(initialEmployee.status);
    } else {
      setName('');
      setMobile('+91 ');
      setEmployeeCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
      setRole(PRESET_ROLES[1].role);
      setIsCustomRole(false);
      setCustomRole('');
      setSelectedCategories([SERVICE_CATEGORIES[0].name]);
      setSkillsText('Split AC Installation, PCB Diagnostics, Gas Charging');
      setSelectedAreas(['Sector 94', 'Sector 104', 'Sector 110']);
      setAvailability('AVAILABLE');
      setStatus('ACTIVE');
    }
    setErrorMsg(null);
  }, [initialEmployee, isOpen]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const toggleArea = (areaSector: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaSector)
        ? prev.filter((a) => a !== areaSector)
        : [...prev, areaSector]
    );
  };

  const selectAllSectors = () => {
    const all = SERVICE_AVAILABLE_ZONES.map((z) => z.sector);
    setSelectedAreas(all);
  };

  const clearAllSectors = () => {
    setSelectedAreas([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Employee name is required.');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 8) {
      setErrorMsg('Valid mobile number is required.');
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMsg('Please select at least one trade category.');
      return;
    }
    if (selectedAreas.length === 0) {
      setErrorMsg('Please assign at least one service sector.');
      return;
    }

    const effectiveRole = isCustomRole ? (customRole.trim() || 'Field Technician') : role;
    const parsedSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const employeeData: Employee = {
      id: initialEmployee?.id || `emp-${Date.now()}`,
      name: name.trim(),
      mobile: mobile.trim(),
      employeeCode: employeeCode.trim(),
      role: effectiveRole,
      categories: selectedCategories,
      skills: parsedSkills.length > 0 ? parsedSkills : ['General Repairs', 'Handyman Work'],
      serviceAreas: selectedAreas,
      availability,
      status,
      activeJobs: initialEmployee?.activeJobs || 0,
      completedJobs: initialEmployee?.completedJobs || 0,
      rating: initialEmployee?.rating || 4.9,
      joinedDate: initialEmployee?.joinedDate || new Date().toISOString().split('T')[0]
    };

    onSave(employeeData, isEdit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#003523] to-[#0d4f36] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black shadow-md">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {isEdit ? 'Update Employee & Role Assignment' : 'Onboard New In-House Employee'}
              </h3>
              <p className="text-xs text-gray-200">
                Direct payroll artisan profile, role permissions, trade skills & assigned sectors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gurpreet Singh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#003523]/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider">
                Employee Code / Badge
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="EMP-105"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#003523]/30 uppercase font-mono font-bold"
              />
            </div>
          </div>

          {/* Contact & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-[#003523]" />
                <span>Mobile Phone *</span>
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98882 10452"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#003523]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider">
                Shift Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] font-bold focus:outline-none focus:ring-2 focus:ring-[#003523]/30 bg-white"
              >
                <option value="AVAILABLE">AVAILABLE (Ready for Dispatch)</option>
                <option value="ON_JOB">ON JOB (Active on Call)</option>
                <option value="OFF_DUTY">OFF DUTY (Shift Finished)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] font-bold focus:outline-none focus:ring-2 focus:ring-[#003523]/30 bg-white"
              >
                <option value="ACTIVE">ACTIVE (On Payroll)</option>
                <option value="INACTIVE">INACTIVE (On Leave / Suspended)</option>
              </select>
            </div>
          </div>

          {/* Role & Designation Assignment */}
          <div className="space-y-2.5 bg-[#f4fbf7] p-4 rounded-2xl border border-[#c0edd3]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#003523] uppercase tracking-wider flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-[#fe932c]" />
                <span>Assign Staff Role & Operational Designation *</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomRole(!isCustomRole)}
                className="text-[11px] text-[#003523] font-bold hover:underline"
              >
                {isCustomRole ? 'Choose Preset Role' : '+ Custom Designation'}
              </button>
            </div>

            {isCustomRole ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Master Solar Technician or Sector 104 Squad Lead"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] bg-white focus:outline-none focus:ring-2 focus:ring-[#003523]/30"
                />
                <span className="text-[11px] text-[#707973]">Enter custom operational title for this staff member.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_ROLES.map((r) => {
                  const isSelected = role === r.role;
                  return (
                    <div
                      key={r.role}
                      onClick={() => setRole(r.role)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#003523] bg-white ring-2 ring-[#003523]/20 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[#131b2e] mb-1">
                        <span className={isSelected ? 'text-[#003523]' : ''}>{r.role}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#003523]" />}
                      </div>
                      <p className="text-[10px] text-[#707973] leading-tight">{r.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trade Categories */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider">
              Primary Trade Categories (Select applicable) *
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-gray-100 text-[#404943] border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Skills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fe932c]" />
              <span>Specific Specializations & Skills (Comma-separated)</span>
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. Split AC Master, MIG Welding, Submersible Rewiring, Earthing Pit"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#003523]/30"
            />
            <p className="text-[11px] text-[#707973]">
              Used by auto-dispatch matching to assign high-precision tasks directly to this employee.
            </p>
          </div>

          {/* Assigned Hub / Service Sectors (Sectors 94 to 111) */}
          <div className="space-y-2.5 bg-[#faf8ff] p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#131b2e] uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-[#003523]" />
                <span>Assigned Dispatch Hubs & Sectors (Sectors 94 to 111) *</span>
              </label>
              <div className="flex items-center space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllSectors}
                  className="text-[#003523] font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllSectors}
                  className="text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_AVAILABLE_ZONES.map((zone) => {
                const isSelected = selectedAreas.includes(zone.sector);
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => toggleArea(zone.sector)}
                    className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#003523]/10 border-[#003523] text-[#003523] font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="truncate">{zone.sector}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#003523] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#707973]">
              This employee will receive dispatch requests originating from these selected sectors.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
              <span>{isEdit ? 'Save Changes' : 'Confirm & Add Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
