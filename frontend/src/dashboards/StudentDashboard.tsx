import React, { useState, useEffect } from "react";
import { useAuth, LogEntry } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { Calendar, FileText, Upload, Plus, LogOut, CheckCircle, Clock, AlertCircle, Settings, X, Building2, Trash2, Sun, Moon } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const StudentDashboard = () => {
  const { user, logout, students, addLogbookEntry, submitReport, updatePlacement, updateLogbookEntry, deleteLogbookEntry, isMockMode, theme, toggleTheme } = useAuth();
  // Safe lookup of the student's profile: use first element in students state or fallback to user metadata
  const studentProfile = students[0] || {
    id: user?.id || "unknown",
    name: `${user?.firstName} ${user?.lastName}`,
    matricNumber: user?.studentProfile?.matricNumber || "",
    department: user?.studentProfile?.department || "",
    companyName: user?.studentProfile?.companyName || "",
    status: "Not Submitted",
    pdfUrl: undefined,
    logbookEntries: [],
  };

  const getLocalDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMondayOfDate = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Get student's start date (fallback to today if not set)
  const rawStartDate = user?.studentProfile?.startDate 
    ? new Date(user.studentProfile.startDate) 
    : new Date();

  // Find Monday of start date week
  const startOfWeek1 = getMondayOfDate(new Date(rawStartDate.getTime()));

  // Calculate default week number based on today's date
  const today = new Date();
  const todayMonday = getMondayOfDate(new Date(today.getTime()));
  const diffDays = Math.floor((todayMonday.getTime() - startOfWeek1.getTime()) / (24 * 60 * 60 * 1000));
  const calculatedDefaultWeek = diffDays >= 0 ? Math.floor(diffDays / 7) + 1 : 1;

  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [weekNumber, setWeekNumber] = useState(calculatedDefaultWeek.toString());
  const [dailyDescription, setDailyDescription] = useState("");
  const [departmentSection, setDepartmentSection] = useState("");
  const [skillsAcquired, setSkillsAcquired] = useState("");
  const [reportFile, setReportFile] = useState<string | null>(studentProfile.pdfUrl || null);

  // Placement & Profile edit states
  const [showEditPlacement, setShowEditPlacement] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyAddress, setEditCompanyAddress] = useState("");
  const [editIndSupervisorId, setEditIndSupervisorId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editMatricNumber, setEditMatricNumber] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);

  // Sync edit form states when studentProfile finishes loading
  useEffect(() => {
    if (studentProfile) {
      setEditCompanyName(studentProfile.companyName);
      setEditCompanyAddress(user?.studentProfile?.companyAddress || "");
      setEditIndSupervisorId(user?.studentProfile?.industrySupervisorId || "");
      setEditFirstName(user?.firstName || "");
      setEditLastName(user?.lastName || "");
      setEditMatricNumber(studentProfile.matricNumber || "");
      setEditPhoneNumber(user?.phoneNumber || "");
      setEditEmail(user?.email || "");
      
      if (user?.studentProfile?.startDate) {
        const d = new Date(user.studentProfile.startDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setEditStartDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setEditStartDate("2026-05-11");
      }
    }
  }, [studentProfile, user]);

  // Load industry supervisors for selector dropdown
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const data = await apiRequest("/auth/supervisors", "GET");
        if (Array.isArray(data)) {
          setSupervisors(data.filter((s: any) => s.role === "INDUSTRY_SUPERVISOR"));
        }
      } catch (err) {
        console.warn("Could not load supervisors list");
      }
    };
    fetchSupervisors();
  }, []);

  const handleUpdatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyName || !editIndSupervisorId) {
      alert("Company Name and Industry Supervisor are required.");
      return;
    }

    if (!editFirstName || !editLastName || !editPhoneNumber || !editEmail) {
      alert("First Name, Last Name, Phone Number, and Email are required.");
      return;
    }

    if (editMatricNumber) {
      const matricRegex = /^[A-Z]{3,4}\/\d{4}\/\d{4}$/i;
      if (!matricRegex.test(editMatricNumber)) {
        alert("Matric Number must match the format DEPT/YEAR/INDEX (e.g., CVE/2026/1234)");
        return;
      }
    }

    if (editPhoneNumber) {
      const cleanPhone = editPhoneNumber.replace(/[\s\-()]/g, "");
      let isPhoneValid = false;

      if (cleanPhone.startsWith("+")) {
        const parsed = parsePhoneNumberFromString(cleanPhone);
        isPhoneValid = !!(parsed && parsed.isValid());
      } else if (cleanPhone.startsWith("234") && cleanPhone.length >= 13) {
        const parsed = parsePhoneNumberFromString("+" + cleanPhone);
        isPhoneValid = !!(parsed && parsed.isValid());
      } else if (cleanPhone.startsWith("0")) {
        const parsed = parsePhoneNumberFromString(cleanPhone, "NG");
        isPhoneValid = !!(parsed && parsed.isValid());
      } else {
        const parsedWithPlus = parsePhoneNumberFromString("+" + cleanPhone);
        if (parsedWithPlus && parsedWithPlus.isValid()) {
          isPhoneValid = true;
        } else {
          const parsedFallback = parsePhoneNumberFromString(cleanPhone, "NG");
          isPhoneValid = !!(parsedFallback && parsedFallback.isValid());
        }
      }

      if (!isPhoneValid) {
        alert("Invalid phone number. Please enter a valid phone number matching the standardized digits of your country (e.g. starting with + or correct local format).");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      await updatePlacement(
        editCompanyName, 
        editCompanyAddress, 
        editIndSupervisorId, 
        editStartDate,
        editFirstName,
        editLastName,
        editMatricNumber,
        editPhoneNumber,
        editEmail
      );
      setShowEditPlacement(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Sync reportFile state when database profile finishes loading
  useEffect(() => {
    if (studentProfile.pdfUrl) {
      setReportFile(studentProfile.pdfUrl);
    }
  }, [studentProfile.pdfUrl]);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !dailyDescription || !skillsAcquired) {
      alert("Please fill in all required logbook fields.");
      return;
    }
    setIsSubmittingLog(true);
    try {
      await addLogbookEntry({
        date,
        weekNumber: parseInt(weekNumber, 10),
        dailyDescription,
        departmentSection,
        skillsAcquired,
      });
      // Reset form
      setDate("");
      setDailyDescription("");
      setDepartmentSection("");
      setSkillsAcquired("");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed.");
        return;
      }
      setReportFile(file.name);
      submitReport(file.name);
    }
  };

  // Helper to map log approval states to tags
  const renderStatusBadge = (status: LogEntry["approvalStatus"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const currentWeekNumber = parseInt(weekNumber, 10) || 1;
  
  // Calculate Monday of current week number
  const mondayTime = startOfWeek1.getTime() + (currentWeekNumber - 1) * 7 * 24 * 60 * 60 * 1000;
  
  const weekDays = Array.from({ length: 5 }).map((_, i) => {
    const dayDate = new Date(mondayTime + i * 24 * 60 * 60 * 1000);
    
    // Format to local date string YYYY-MM-DD
    const yyyy = dayDate.getFullYear();
    const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
    const dd = String(dayDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const daysName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    
    return {
      day: daysName[i],
      date: dateStr,
      label: labels[i]
    };
  });

  const handleDateChange = (newDateStr: string) => {
    setDate(newDateStr);
    
    // Automatically calculate and set the Week Number based on May 11, 2026 start date
    const selected = new Date(newDateStr + "T00:00:00");
    if (!isNaN(selected.getTime())) {
      const diffTime = selected.getTime() - startOfWeek1.getTime();
      const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1050)); // using average ms/day with safety bounds
      if (diffDays >= 0) {
        const calculatedWeek = Math.floor(diffDays / 7) + 1;
        setWeekNumber(calculatedWeek.toString());
      } else {
        setWeekNumber("1"); // Before SIWES start date fallback
      }
    }

    // Auto-fill form fields if a log already exists for this date
    const existingLog = studentProfile.logbookEntries.find((l) => l.date === newDateStr);
    if (existingLog) {
      setDailyDescription(existingLog.dailyDescription);
      setSkillsAcquired(existingLog.skillsAcquired);
      setDepartmentSection(existingLog.departmentSection || "");
    } else {
      setDailyDescription("");
      setSkillsAcquired("");
      setDepartmentSection("");
    }
  };

  const currentLog = studentProfile.logbookEntries.find((l) => l.date === date);
  const isEditMode = !!currentLog;

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLog) return;
    setIsSubmittingLog(true);
    try {
      await updateLogbookEntry(currentLog.id, {
        date,
        weekNumber: parseInt(weekNumber, 10),
        dailyDescription,
        departmentSection,
        skillsAcquired,
      });
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleDeleteLog = () => {
    if (!currentLog) return;
    deleteLogbookEntry(currentLog.id);
    // Clear inputs
    setDailyDescription("");
    setSkillsAcquired("");
    setDepartmentSection("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="glass sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              SIWES Portal
            </h1>
            <p className="text-xs text-slate-400">Student Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isMockMode ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-950/40 border border-amber-900 text-amber-400">
              Demo Sandbox
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 border border-emerald-900 text-emerald-400">
              API Active
            </span>
          )}
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-400">{studentProfile.matricNumber}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Log Form & PDF Upload */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          {/* Profile Quick Summary & Placement Management */}
          <div className="glass p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Placement Details</p>
                <h2 className="text-xl font-bold text-slate-200 mt-1">{studentProfile.companyName}</h2>
                <p className="text-sm text-slate-400 mt-1">{studentProfile.department}</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2.5">
                <div className="flex flex-col items-start md:items-end gap-1">
                  <span className="text-xs text-slate-400">SIWES File Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 border border-indigo-800 text-indigo-300">
                    {studentProfile.status}
                  </span>
                </div>
                {!isMockMode && (
                  <button
                    onClick={() => setShowEditPlacement(!showEditPlacement)}
                    className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none"
                  >
                    {showEditPlacement ? (
                      <>
                        <X className="w-3.5 h-3.5" /> Cancel Edit
                      </>
                    ) : (
                      <>
                        <Settings className="w-3.5 h-3.5" /> Edit Profile & Details
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Change Placement Form */}
            {showEditPlacement && (
              <form onSubmit={handleUpdatePlacement} className="border-t border-slate-800/80 pt-4 mt-1 flex flex-col gap-4">
                <div className="bg-indigo-950/40 border border-indigo-900/40 p-3 rounded-xl text-xs text-indigo-300/80 leading-normal flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                  <span>
                    <strong>Note:</strong> Correcting name, email, matric, or phone number will save instantly. Updating placement company details will reset your SIWES verification status to <strong>Pending Verification</strong>.
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Details */}
                  <div className="md:col-span-2 border-b border-slate-800/60 pb-1">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Personal Profile Details</h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">First Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Olamide"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Last Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Gold"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Matric Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. CVE/2026/1234"
                      value={editMatricNumber}
                      onChange={(e) => setEditMatricNumber(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 08012345678"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. student@siwes.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>

                  {/* Placement Details */}
                  <div className="md:col-span-2 border-b border-slate-800/60 pb-1 mt-2">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">SIWES Placement Details</h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Placement Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. BuildCo Infrastructures"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Company Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Lagos, Nigeria"
                      value={editCompanyAddress}
                      onChange={(e) => setEditCompanyAddress(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-xs outline-none transition-all duration-150"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">SIWES Internship Start Date *</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Select Industry Supervisor *</label>
                    <select
                      value={editIndSupervisorId}
                      onChange={(e) => setEditIndSupervisorId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none transition-all duration-150"
                      required
                    >
                      <option value="">-- Select Industry Supervisor --</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} - {s.companyName || "General"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      "Save & Update Profile"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Daily Entry Form */}
          <div className="glass p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-200">
              {isEditMode ? (
                <>
                  <FileText className="w-5 h-5 text-indigo-500" />
                  {currentLog.approvalStatus === "APPROVED" 
                    ? "View Approved Log" 
                    : currentLog.approvalStatus === "REJECTED" 
                    ? "Resubmit Rejected Log" 
                    : "View / Edit Submitted Log"}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-blue-500" /> Log Daily Activity
                </>
              )}
            </h3>
            <form onSubmit={isEditMode ? handleUpdateLog : handleSubmitLog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditMode && currentLog.comments && (
                <div className="md:col-span-2 bg-rose-950/40 border border-rose-900/60 p-3.5 rounded-xl text-xs text-rose-350 leading-relaxed mb-1 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">Supervisor's Comment:</span>
                    <span>"{currentLog.comments}"</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isEditMode}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Week Number *</label>
                <input
                  type="number"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isEditMode && currentLog?.approvalStatus === "APPROVED"}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Department / Unit Section</label>
                <input
                  type="text"
                  placeholder="e.g. Design, Operations, Quality Control"
                  value={departmentSection}
                  onChange={(e) => setDepartmentSection(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isEditMode && currentLog?.approvalStatus === "APPROVED"}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Description of Daily Work *</label>
                <textarea
                  rows={3}
                  placeholder="Describe your activities, operations conducted, machines handled..."
                  value={dailyDescription}
                  onChange={(e) => setDailyDescription(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none resize-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isEditMode && currentLog?.approvalStatus === "APPROVED"}
                ></textarea>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Practical Skills / Lessons Acquired *</label>
                <textarea
                  rows={3}
                  placeholder="What key practical skill, theory, or workflow did you master today?"
                  value={skillsAcquired}
                  onChange={(e) => setSkillsAcquired(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none resize-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isEditMode && currentLog?.approvalStatus === "APPROVED"}
                ></textarea>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                {isEditMode ? (
                  <>
                    {currentLog.approvalStatus !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={handleDeleteLog}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-rose-450 hover:text-rose-400 font-semibold text-xs rounded-xl transition-all duration-200"
                      >
                        Delete Log
                      </button>
                    )}
                    {currentLog.approvalStatus === "APPROVED" ? (
                      <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/80 px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Approved & Locked
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmittingLog}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingLog ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          "Update & Resubmit"
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmittingLog}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingLog ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting Log...
                      </>
                    ) : (
                      "Submit Daily Log"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Right Column: Weekly Grid & Upload Zone */}
        <section className="flex flex-col gap-6">
          {/* Weekly Calendar Status */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-200">
              <Calendar className="w-5 h-5 text-indigo-500" /> Week {weekNumber} Calendar
            </h3>
            <div className="flex flex-col gap-3">
              {weekDays.map((wd) => {
                const log = studentProfile.logbookEntries.find((l) => l.date === wd.date);
                const isSelected = date === wd.date;
                return (
                  <div
                    key={wd.date}
                    onClick={() => handleDateChange(wd.date)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer hover:border-indigo-500 hover:bg-slate-900/40 transition-all ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/5 scale-102"
                        : log
                        ? "bg-slate-900/60 border-slate-800/80"
                        : "bg-slate-950/40 border-slate-900 border-dashed"
                    }`}
                    title="Click to select this day for daily logging"
                  >
                    <div>
                      <p className="text-sm font-semibold">{wd.day}</p>
                      <p className="text-xs text-slate-500">{wd.date}</p>
                    </div>
                    <div>
                      {log ? (
                        renderStatusBadge(log.approvalStatus)
                      ) : (
                        <span className="text-xs text-slate-500 italic bg-slate-900/30 border border-slate-800/40 px-2 py-0.5 rounded-full">
                          Empty
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PDF Report Upload Zone */}
          <div className="glass p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <FileText className="w-5 h-5 text-teal-500" /> SIWES Final Report
            </h3>
            <p className="text-xs text-slate-400">
              Upload your consolidated PDF technical report. Once uploaded, your institutional supervisor can review and grade it.
            </p>

            {reportFile ? (
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 bg-rose-950/60 border border-rose-800 text-rose-400 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    PDF
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate text-slate-300">{reportFile}</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3 h-3" /> Submitted
                    </p>
                  </div>
                </div>
                <label className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer select-none">
                  Replace
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 p-6 rounded-xl flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Click to upload report</p>
                  <p className="text-xs text-slate-500 mt-1">PDF format only (Max 10MB)</p>
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            )}

            {/* Grading Feedback Panel */}
            {studentProfile.grade !== undefined && (
              <div className="mt-2 bg-gradient-to-r from-indigo-950/40 to-blue-950/40 border border-indigo-900/80 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-indigo-300">Academic Evaluation</span>
                  <span className="text-lg font-bold text-indigo-400">{studentProfile.grade}/100</span>
                </div>
                {studentProfile.feedback && (
                  <p className="text-xs text-slate-400 mt-2 border-t border-slate-800/80 pt-2 italic">
                    "{studentProfile.feedback}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer Log Entries History */}
      <section className="max-w-7xl w-full mx-auto px-6 pb-8">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4 text-slate-200">Logbook History</h3>
          {studentProfile.logbookEntries.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4">No daily logs submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentProfile.logbookEntries.map((log) => {
                const isApproved = log.approvalStatus === "APPROVED";
                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      handleDateChange(log.date);
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="bg-slate-900/40 border border-slate-850 hover:border-indigo-500/60 hover:bg-slate-900/60 p-5 rounded-xl flex flex-col gap-3 cursor-pointer transition-all duration-200"
                    title="Click to view/edit this log entry in the form above"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold">{log.date}</p>
                        <p className="text-xs text-slate-500">Week {log.weekNumber} • {log.departmentSection || "General"}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {renderStatusBadge(log.approvalStatus)}
                        {!isApproved && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the log entry for ${log.date}?`)) {
                                deleteLogbookEntry(log.id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-450 hover:text-rose-400 transition-colors"
                            title="Delete Log Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Job Description</p>
                      <p className="text-sm text-slate-350 mt-1 leading-relaxed">{log.dailyDescription}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Skills Acquired</p>
                      <p className="text-sm text-slate-350 mt-1 leading-relaxed">{log.skillsAcquired}</p>
                    </div>
                    {log.comments && (
                      <div className="bg-slate-950/60 border border-slate-850/80 p-3 rounded-lg text-xs text-slate-400 italic">
                        <span className="font-semibold text-slate-300 not-italic block mb-1">Supervisor's Comment:</span>
                        "{log.comments}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
