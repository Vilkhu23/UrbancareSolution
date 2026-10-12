import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardHat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  MapPin,
  Phone,
  FileText,
  User,
  Bell,
  Check,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  LogOut,
  Eye,
  Camera,
  Wrench,
  AlertCircle,
  Navigation,
  Lock,
  EyeOff
} from 'lucide-react';
import { ServiceRequest, Employee } from '../../types';
import { EmployeeRejectModal } from './EmployeeRejectModal';
import { EmployeeCompleteModal } from './EmployeeCompleteModal';
import { EmployeeJobDetailModal } from './EmployeeJobDetailModal';

export type EmployeeTab = 'today' | 'upcoming' | 'active' | 'completed' | 'notifications';

export const EmployeePortal: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentPage,
    setCurrentPage,
    currentEmployeeId,
    setCurrentEmployeeId,
    employees,
    requests,
    employeeNotifications,
    markNotificationAsRead,
    employeeAcceptJob,
    employeeRejectJob,
    employeeMarkArrived,
    employeeStartWork,
    employeeCompleteWork,
    updateEmployeeAvailability,
    loginStaff,
    logoutStaff,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<EmployeeTab>('today');
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<ServiceRequest | null>(null);
  const [selectedJobForReject, setSelectedJobForReject] = useState<ServiceRequest | null>(null);
  const [selectedJobForComplete, setSelectedJobForComplete] = useState<ServiceRequest | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Authentication State for Role Gate
  const [selectedEmployeeForLogin, setSelectedEmployeeForLogin] = useState<string>(
    currentEmployeeId || 'emp-1'
  );
  const [loginPassword, setLoginPassword] = useState<string>('TechPass@101');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Currently authenticated employee
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === currentEmployeeId) || employees[0];
  }, [employees, currentEmployeeId]);

  // STRICT REQUIREMENT: Employees can log in and see ONLY their assigned work
  const myAssignedRequests = useMemo(() => {
    return requests.filter((r) => r.assignedTo?.id === currentEmployee.id);
  }, [requests, currentEmployee.id]);

  // Sub-categories of work:
  // 1. Today's Jobs: Scheduled or assigned for today (not completed/cancelled)
  const todayJobs = useMemo(() => {
    return myAssignedRequests.filter(
      (r) =>
        (r.preferredDate === 'Today' || r.preferredDate === new Date().toISOString().split('T')[0]) &&
        r.status !== 'COMPLETED' &&
        r.status !== 'CUSTOMER CONFIRMED' &&
        r.status !== 'CLOSED' &&
        r.status !== 'CANCELLED'
    );
  }, [myAssignedRequests]);

  // 2. Upcoming Jobs: Tomorrow or future scheduled jobs
  const upcomingJobs = useMemo(() => {
    return myAssignedRequests.filter(
      (r) =>
        r.preferredDate !== 'Today' &&
        r.preferredDate !== new Date().toISOString().split('T')[0] &&
        r.status !== 'COMPLETED' &&
        r.status !== 'CUSTOMER CONFIRMED' &&
        r.status !== 'CLOSED' &&
        r.status !== 'CANCELLED'
    );
  }, [myAssignedRequests]);

  // 3. Active Jobs: Currently in progress or arrived on site
  const activeJobs = useMemo(() => {
    return myAssignedRequests.filter(
      (r) =>
        r.status === 'IN PROGRESS' ||
        r.status === 'ACCEPTED' ||
        r.vendorArrivalStatus === 'ARRIVED'
    );
  }, [myAssignedRequests]);

  // 4. Completed Jobs
  const completedJobs = useMemo(() => {
    return myAssignedRequests.filter(
      (r) =>
        r.status === 'COMPLETED' ||
        r.status === 'CUSTOMER CONFIRMED' ||
        r.status === 'CLOSED'
    );
  }, [myAssignedRequests]);

  // 5. Notifications for this employee
  const myNotifications = useMemo(() => {
    return employeeNotifications.filter((n) => n.employeeId === currentEmployee.id);
  }, [employeeNotifications, currentEmployee.id]);

  const unreadNotificationsCount = useMemo(() => {
    return myNotifications.filter((n) => !n.read).length;
  }, [myNotifications]);

  // Handle Login Authentication with Mandatory Password
  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployeeForLogin);
    if (!emp) {
      showToast('Please select a technician profile', 'error');
      return;
    }

    if (!loginPassword.trim()) {
      showToast('Please enter your technician password to continue', 'error');
      return;
    }

    const success = loginStaff('employee', emp.id, loginPassword);
    if (success) {
      // loginStaff in AppContext sets role, employeeId, and page
      setLoginPassword('');
    }
  };

  // If role is not 'employee', render the Role-Protection Authentication Gate!
  if (currentRole !== 'employee') {
    return (
      <div className="min-h-[85vh] bg-gradient-to-b from-[#f4fbf7] via-[#faf8ff] to-[#f2f3ff] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-[#003523] text-white text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center mx-auto mb-4 font-black text-2xl shadow-lg">
              <HardHat className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">UrbanCare Solution Staff Technician Hub</h2>
            <p className="text-xs text-gray-200 mt-1">
              Role-Protected In-House Employee Dispatch Portal
            </p>
            <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-[#b6efd1] text-[11px] font-semibold border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Company Technicians & Leads Only</span>
            </div>
          </div>

          <form onSubmit={handleEmployeeLogin} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Technician Profile
              </label>
              <div className="space-y-2">
                {employees.map((emp) => (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedEmployeeForLogin === emp.id
                        ? 'border-[#003523] bg-[#003523]/5 ring-2 ring-[#003523]/20 font-bold text-[#003523]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="employeeAccount"
                        checked={selectedEmployeeForLogin === emp.id}
                        onChange={() => {
                          setSelectedEmployeeForLogin(emp.id);
                          setLoginPassword(emp.password || 'TechPass@101');
                        }}
                        className="text-[#003523] focus:ring-[#003523]"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-bold text-gray-900">{emp.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {emp.role || 'Field Specialist'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal">
                          {emp.skills.join(', ')} · {emp.employeeCode || emp.id}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {emp.rating} ★
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Technician Account Password *
                </label>
                <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Demo: {employees.find((e) => e.id === selectedEmployeeForLogin)?.password || 'TechPass@101'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs p-3 pl-9 pr-9 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523] font-semibold"
                  placeholder="Enter 8-letter password or 123456"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-gray-500 mt-1 block">
                Strict Work Isolation: Every technician must authenticate with password to view only their assigned jobs.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
              <span>Sign In with Password</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                ← Return to Public Website
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#131b2e] pb-16">
      {/* Top Header */}
      <div className="bg-[#003523] text-white border-b border-[#144d37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black text-xl shadow-md">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  {currentEmployee.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#fe932c] text-[#002114] text-[10px] font-black">
                  {currentEmployee.role || 'Field Specialist'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#b6efd1] text-[10px] font-mono font-bold border border-emerald-400/30">
                  {currentEmployee.employeeCode || `#${currentEmployee.id}`}
                </span>
              </div>
              <div className="text-xs text-gray-300 mt-1 flex items-center space-x-3">
                <span>Rating: {currentEmployee.rating} ★</span>
                <span>•</span>
                <span>Completed: {currentEmployee.completedJobs} Jobs</span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">
                  Hub: {currentEmployee.serviceAreas[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Availability & Switcher */}
          <div className="flex items-center space-x-3">
            {/* Availability selector */}
            <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-gray-300 text-[11px] hidden sm:inline">Status:</span>
              <select
                value={currentEmployee.availability}
                onChange={(e) =>
                  updateEmployeeAvailability(
                    currentEmployee.id,
                    e.target.value as Employee['availability']
                  )
                }
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="AVAILABLE" className="text-gray-900">🟢 Available for Dispatch</option>
                <option value="ON_JOB" className="text-gray-900">🟡 On Active Job</option>
                <option value="OFF_DUTY" className="text-gray-900">⚪ Off Duty</option>
              </select>
            </div>

            {/* Authenticated Technician Profile Badge - Strict Isolation */}
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-gray-300 text-[11px]">Logged in:</span>
              <span className="text-white font-bold">{currentEmployee.name}</span>
              <span className="text-[10px] text-[#b6efd1] font-mono font-bold">
                ({currentEmployee.employeeCode || currentEmployee.id})
              </span>
            </div>

            <button
              onClick={() => {
                logoutStaff();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-bold transition-all cursor-pointer"
              title="Sign Out of Technician Hub"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-[#144d37]/60 no-scrollbar">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'today'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Today's Jobs</span>
            {todayJobs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-gray-900 text-[10px] font-black">
                {todayJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'upcoming'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Upcoming</span>
            {upcomingJobs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                {upcomingJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Active</span>
            {activeJobs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#b6efd1] text-[#002114] text-[10px] font-black">
                {activeJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'completed'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Completed</span>
            <span className="text-[10px] text-gray-400">({completedJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'notifications'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div
            onClick={() => setActiveTab('today')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Jobs</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-gray-900">{todayJobs.length}</div>
            <span className="text-[10px] text-gray-400">Scheduled for today</span>
          </div>

          <div
            onClick={() => setActiveTab('upcoming')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Upcoming</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-black text-gray-900">{upcomingJobs.length}</div>
            <span className="text-[10px] text-gray-400">Advance schedule</span>
          </div>

          <div
            onClick={() => setActiveTab('active')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
              <HardHat className="w-4 h-4 text-[#003523]" />
            </div>
            <div className="text-xl font-black text-gray-900">{activeJobs.length}</div>
            <span className="text-[10px] text-emerald-700 font-semibold">In execution</span>
          </div>

          <div
            onClick={() => setActiveTab('completed')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-gray-900">{completedJobs.length}</div>
            <span className="text-[10px] text-gray-400">Verified signed off</span>
          </div>

          <div
            onClick={() => setActiveTab('notifications')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Notifications</span>
              <Bell className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-black text-gray-900">{unreadNotificationsCount}</div>
            <span className="text-[10px] text-purple-700 font-semibold">Operations alerts</span>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: TODAY'S JOBS
            ========================================================================= */}
        {activeTab === 'today' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">Today's Assigned Schedule</h3>
                <p className="text-xs text-gray-500">
                  Jobs manually assigned to {currentEmployee.name} by Operations Lead.
                </p>
              </div>
            </div>

            {todayJobs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                <h4 className="font-bold text-gray-900 text-base">No Pending Jobs for Today</h4>
                <p className="text-xs text-gray-500 mt-1">
                  You have completed or are clear of pending assignments for today. Check upcoming bookings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 hover:border-gray-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {job.status}
                          </span>
                          {job.vendorArrivalStatus === 'ARRIVED' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Arrived ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          Slot: {job.preferredDate} ({job.preferredTimeSlot})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-[#003523]">₹{job.total}</span>
                        <span className="text-[10px] text-gray-400 block">Collect on site</span>
                      </div>
                    </div>

                    {/* Customer & Address */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>Customer: {job.customerName}</span>
                        <a
                          href={`tel:${job.customerPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-[#003523] text-white text-[11px] font-bold hover:bg-[#144d37] flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>

                      <div className="flex items-start space-x-1.5 text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-[#003523] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">{job.address}</div>
                          {job.landmark && (
                            <div className="text-[11px] text-gray-500">Landmark: {job.landmark}</div>
                          )}
                        </div>
                      </div>

                      {/* Supervisor Instructions */}
                      {job.supervisorInstructions && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                          <strong>Supervisor Note:</strong> {job.supervisorInstructions}
                        </div>
                      )}
                    </div>

                    {/* Services and Problem */}
                    <div className="text-xs text-gray-700 space-y-1">
                      <div className="font-bold text-gray-900">
                        {job.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                      </div>
                      {job.problemDescription && (
                        <p className="text-gray-500 italic line-clamp-2">"{job.problemDescription}"</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedJobForDetail(job)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>View Details</span>
                      </button>

                      {job.status === 'ASSIGNED' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedJobForReject(job)}
                            className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => employeeAcceptJob(job.id)}
                            className="px-4 py-1.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] shadow-xs flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#b6efd1]" />
                            <span>Accept</span>
                          </button>
                        </div>
                      )}

                      {(job.status === 'ACCEPTED' || job.status === 'SCHEDULED' || job.status === 'IN PROGRESS') && (
                        <div className="flex items-center space-x-2">
                          {job.vendorArrivalStatus !== 'ARRIVED' && (
                            <button
                              onClick={() => employeeMarkArrived(job.id)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs flex items-center space-x-1"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Mark Arrived</span>
                            </button>
                          )}

                          {job.status !== 'IN PROGRESS' && (
                            <button
                              onClick={() => employeeStartWork(job.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-xs flex items-center space-x-1"
                            >
                              <HardHat className="w-3.5 h-3.5" />
                              <span>Start Work</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedJobForComplete(job)}
                            className="px-4 py-1.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] shadow-sm flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#b6efd1]" />
                            <span>Complete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: UPCOMING JOBS
            ========================================================================= */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="font-bold text-base text-gray-900">Upcoming Assignments</h3>
              <p className="text-xs text-gray-500">
                Future bookings scheduled for tomorrow and upcoming dates.
              </p>
            </div>

            {upcomingJobs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
                <h4 className="font-bold text-gray-900 text-base">No Upcoming Jobs Scheduled</h4>
                <p className="text-xs text-gray-500 mt-1">
                  When Operations dispatches advance bookings for future slots, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                        <div className="text-xs font-bold text-[#003523] mt-0.5">
                          {job.preferredDate} ({job.preferredTimeSlot})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        {job.status}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-gray-900">
                        {job.items.map((i) => i.serviceName).join(', ')}
                      </div>
                      <div className="text-gray-500">Customer: {job.customerName} · {job.locality}</div>
                      {job.supervisorInstructions && (
                        <div className="text-amber-800 text-[11px] pt-1">
                          Note: {job.supervisorInstructions}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs font-black text-[#003523]">₹{job.total}</span>
                      <button
                        onClick={() => setSelectedJobForDetail(job)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>View Job Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: ACTIVE JOBS
            ========================================================================= */}
        {activeTab === 'active' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="font-bold text-base text-gray-900">Active Tasks in Progress ({activeJobs.length})</h3>
              <p className="text-xs text-gray-500">
                Jobs where you have arrived at the customer doorstep or work is underway.
              </p>
            </div>

            {activeJobs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
                <h4 className="font-bold text-gray-900 text-base">No Jobs Currently In Progress</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Start an accepted task from Today's Jobs tab to begin active work.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border-2 border-emerald-300 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {job.status}
                          </span>
                          {job.vendorArrivalStatus === 'ARRIVED' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Arrived at Doorstep ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 block">
                          Customer: {job.customerName} · {job.locality}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-[#003523]">₹{job.total}</span>
                        <span className="text-[10px] text-gray-400 block">Collect on finish</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1.5">
                      <div className="font-bold text-gray-900">{job.address}</div>
                      <div className="text-gray-600">
                        {job.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                      </div>
                      {job.problemDescription && (
                        <p className="text-gray-500 italic text-[11px]">"{job.problemDescription}"</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <a
                        href={`tel:${job.customerPhone}`}
                        className="flex-1 py-2 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Customer</span>
                      </a>

                      <button
                        onClick={() => setSelectedJobForComplete(job)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Work</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: COMPLETED JOBS
            ========================================================================= */}
        {activeTab === 'completed' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Completed Jobs Archive ({completedJobs.length})
              </h3>
              <p className="text-xs text-gray-500">
                Signed off work, customer satisfaction ratings, and verified completion records.
              </p>
            </div>

            {completedJobs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                <h4 className="font-bold text-gray-900 text-base">No Completed Jobs Yet</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Once you finalize service work with completion photos and notes, your record will be displayed here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          COMPLETED
                        </span>
                        <span className="text-xs text-gray-500">· {job.customerName}</span>
                      </div>

                      <div className="text-xs text-gray-700">
                        {job.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')} ·{' '}
                        <span className="text-gray-500">{job.locality}</span>
                      </div>

                      {/* Customer feedback if present */}
                      {job.customerFeedback && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                          <span className="text-amber-500 font-bold">★ {job.customerRating}/5</span>
                          <span className="italic">"{job.customerFeedback}"</span>
                        </div>
                      )}

                      {/* Completion photos */}
                      {job.completionPhotos && job.completionPhotos.length > 0 && (
                        <div className="flex items-center space-x-2 pt-1">
                          <span className="text-[10px] text-gray-400 font-semibold">Proof Photos:</span>
                          {job.completionPhotos.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setZoomPhotoUrl(url)}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200"
                            >
                              <img src={url} alt={`Proof ${idx}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right md:min-w-[140px] border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      <div className="text-base font-black text-[#003523]">₹{job.total}</div>
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        Collected via {job.paymentCollectedMode || job.paymentMode || 'UPI'}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {job.completedAt || job.updatedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: NOTIFICATIONS
            ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-fadeIn max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">Operations & Dispatch Alerts</h3>
                <p className="text-xs text-gray-500">
                  Supervisor assignments, parts requisition updates, and customer communications.
                </p>
              </div>
            </div>

            {myNotifications.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
                <h4 className="font-bold text-gray-900 text-base">No Notifications</h4>
                <p className="text-xs text-gray-500 mt-1">
                  You have read all recent alerts and dispatch notifications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      !n.read
                        ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                        : 'bg-white border-gray-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          !n.read ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-gray-400 block">{n.timestamp}</span>
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() => markNotificationAsRead(n.id)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Modals for Employee Workflow */}
      <EmployeeRejectModal
        isOpen={!!selectedJobForReject}
        onClose={() => setSelectedJobForReject(null)}
        request={selectedJobForReject}
        onConfirmReject={(reason, notes) => {
          if (selectedJobForReject) {
            employeeRejectJob(selectedJobForReject.id, reason, notes);
          }
        }}
      />

      <EmployeeCompleteModal
        isOpen={!!selectedJobForComplete}
        onClose={() => setSelectedJobForComplete(null)}
        request={selectedJobForComplete}
        onConfirmComplete={(workNotes, photos, materialInfo, partsUsed, paymentMode) => {
          if (selectedJobForComplete) {
            employeeCompleteWork(
              selectedJobForComplete.id,
              workNotes,
              photos,
              materialInfo,
              partsUsed,
              paymentMode
            );
          }
        }}
      />

      <EmployeeJobDetailModal
        isOpen={!!selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        request={selectedJobForDetail}
        onAccept={(requestId) => employeeAcceptJob(requestId)}
        onReject={(req) => {
          setSelectedJobForDetail(null);
          setSelectedJobForReject(req);
        }}
        onMarkArrived={(requestId) => employeeMarkArrived(requestId)}
        onStartWork={(requestId) => employeeStartWork(requestId)}
        onCompleteWork={(req) => {
          setSelectedJobForDetail(null);
          setSelectedJobForComplete(req);
        }}
        onPhotoZoom={(url) => setZoomPhotoUrl(url)}
      />

      {/* Lightbox for zooming attached breakdown photos */}
      {zoomPhotoUrl && (
        <div
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              ✕
            </button>
            <img src={zoomPhotoUrl} alt="Inspection Photo" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
