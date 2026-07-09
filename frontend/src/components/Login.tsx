import React, { useState, useEffect } from "react";
import { useAuth, Role } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { ShieldCheck, UserPlus, LogIn, KeyRound, ArrowLeft, Eye, EyeOff, Sun, Moon } from "lucide-react";

interface SupervisorOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  companyName?: string;
  institution?: string;
}

export const Login = () => {
  const { login, registerUser, requestPasswordReset, completePasswordReset, theme, toggleTheme, isLoading } = useAuth();
  
  // Auth Modes: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Forgot Password Steps: 1 (Request code) | 2 (Reset password)
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Form Fields (Common)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState<Role>("STUDENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Form Fields (Student Profile Specific)
  const [matricNumber, setMatricNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [instSupervisorId, setInstSupervisorId] = useState("");
  const [indSupervisorId, setIndSupervisorId] = useState("");
  const [institution, setInstitution] = useState("");

  // Supervisors state loaded from Backend
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);

  // Load supervisors when creating an account
  useEffect(() => {
    if (authMode !== "signup") return;
    const fetchSupervisors = async () => {
      try {
        const data = await apiRequest("/auth/supervisors", "GET");
        if (Array.isArray(data)) {
          setSupervisors(data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.warn("Could not load supervisors from API. Using local default references.");
        // Fallback static supervisors list
        setSupervisors([
          { id: "inst-supervisor-id", firstName: "Dr. Helen", lastName: "Alabi", role: "INSTITUTIONAL_SUPERVISOR", email: "inst@siwes.com" },
          { id: "ind-supervisor-id", firstName: "Engr. Tunde", lastName: "Bello", role: "INDUSTRY_SUPERVISOR", email: "industry@siwes.com" }
        ]);
      }
    };
    fetchSupervisors();
  }, [authMode]);

  const handleSubmitSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }
    login(email, password, role);
  };

  const handleSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      alert("Please fill in all required registration fields.");
      return;
    }

    const payload: any = {
      email,
      password,
      role,
      firstName,
      lastName,
      phoneNumber,
    };

    if (role === "STUDENT") {
      if (!matricNumber || !department || !companyName) {
        alert("Matric Number, Department, and Company Name are required for Students.");
        return;
      }
      const matricRegex = /^[A-Z]{3,4}\/\d{4}\/\d{4}$/i;
      if (!matricRegex.test(matricNumber)) {
        alert("Matric Number must match the format: DEPT/YEAR/INDEX (e.g., CVE/2026/1234 with a 4-digit index number).");
        return;
      }
      payload.matricNumber = matricNumber;
      payload.department = department;
      payload.companyName = companyName;
      payload.companyAddress = companyAddress;
      payload.institutionalSupervisorId = instSupervisorId || undefined;
      payload.industrySupervisorId = indSupervisorId || undefined;
    }

    if (role === "INDUSTRY_SUPERVISOR") {
      if (!companyName) {
        alert("Company Name is required for Industry Supervisors.");
        return;
      }
      payload.companyName = companyName;
    }

    if (role === "INSTITUTIONAL_SUPERVISOR") {
      if (!institution) {
        alert("Institution Name is required for Faculty Supervisors.");
        return;
      }
      payload.institution = institution;
    }

    const success = await registerUser(payload);
    if (success) {
      // Clear form inputs
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setMatricNumber("");
      setDepartment("");
      setCompanyName("");
      setCompanyAddress("");
      setInstSupervisorId("");
      setIndSupervisorId("");
      setInstitution("");
      
      // Redirect to signin tab
      setAuthMode("signin");
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your registered email address.");
      return;
    }
    const success = await requestPasswordReset(email);
    if (success) {
      setResetStep(2);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      alert("Please enter the verification code and your new password.");
      return;
    }
    const success = await completePasswordReset(email, resetCode, newPassword);
    if (success) {
      // Return to sign in
      setAuthMode("signin");
      setResetStep(1);
      setResetCode("");
      setNewPassword("");
      setPassword(""); // Clear old password
    }
  };

  const instSupervisors = Array.isArray(supervisors) ? supervisors.filter((s) => s.role === "INSTITUTIONAL_SUPERVISOR") : [];
  const indSupervisors = Array.isArray(supervisors) ? supervisors.filter((s) => s.role === "INDUSTRY_SUPERVISOR") : [];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black transition-all duration-300 relative">
      
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer z-50"
        title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      >
        {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
      </button>

      {/* Central Auth Card */}
      <div className={`glass w-full p-8 rounded-3xl shadow-2xl flex flex-col gap-5 relative overflow-hidden transition-all duration-300 ${
        authMode === "signup" ? "max-w-2xl" : "max-w-md"
      }`}>
        {/* Glow effect in background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            SIWES Logbook
          </h2>
          <p className="text-xs text-slate-400 mt-1">Industrial Experience Management System</p>
        </div>

        {/* Mode Selector Tab (Hidden in forgot password mode) */}
        {authMode !== "forgot" ? (
          <div className="grid grid-cols-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setAuthMode("signin")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                authMode === "signin"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                authMode === "signup"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>
        ) : null}

        {authMode === "signin" && (
          /* ========================================================
             SIGN IN VIEW
             ======================================================== */
          <form onSubmit={handleSubmitSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input
                type="email"
                placeholder="student@siwes.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot");
                    setResetStep(1);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl pl-4 pr-11 py-2.5 text-sm outline-none transition-all duration-150"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-pointer transition-all duration-150"
              >
                <option value="STUDENT">Student (Trainee)</option>
                <option value="INDUSTRY_SUPERVISOR">Industry Supervisor</option>
                <option value="INSTITUTIONAL_SUPERVISOR">Institutional Supervisor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 mt-2 shadow-lg shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                "Authenticate Credentials"
              )}
            </button>
          </form>
        )}

        {authMode === "signup" && (
          /* ========================================================
             SIGN UP VIEW (Registration)
             ======================================================== */
          <form onSubmit={handleSubmitSignUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">First Name *</label>
              <input
                type="text"
                placeholder="e.g. Adebayo"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Last Name *</label>
              <input
                type="text"
                placeholder="e.g. Oyelowo"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address *</label>
              <input
                type="email"
                placeholder="adebayo@student.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Password *</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl pl-4 pr-11 py-2.5 text-xs outline-none transition-all duration-150"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Phone Number</label>
              <input
                type="text"
                placeholder="+234..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">SIWES System Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-pointer transition-all duration-150"
              >
                <option value="STUDENT">Student (Trainee)</option>
                <option value="INDUSTRY_SUPERVISOR">Industry Supervisor</option>
                <option value="INSTITUTIONAL_SUPERVISOR">Institutional Supervisor</option>
              </select>
            </div>

            {role === "STUDENT" && (
              <>
                <div className="md:col-span-2 border-t border-slate-850/80 my-2 pt-3">
                  <h4 className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Student Profile Settings</h4>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Matriculation Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. CVE/2026/0045"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Academic Department *</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Placement Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. BuildCo Infrastructures Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Placement Company Address</label>
                  <input
                    type="text"
                    placeholder="Lagos, Nigeria"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Assigned Institutional Supervisor</label>
                  <select
                    value={instSupervisorId}
                    onChange={(e) => setInstSupervisorId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-pointer transition-all duration-150"
                  >
                    <option value="">-- Select University Supervisor --</option>
                    {instSupervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} - {s.institution || "General"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Assigned Industry Supervisor</label>
                  <select
                    value={indSupervisorId}
                    onChange={(e) => setIndSupervisorId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-pointer transition-all duration-150"
                  >
                    <option value="">-- Select Company Supervisor --</option>
                    {indSupervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} - {s.companyName || "General"}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {role === "INDUSTRY_SUPERVISOR" && (
              <>
                <div className="md:col-span-2 border-t border-slate-850/80 my-2 pt-3">
                  <h4 className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Industry Supervisor Details</h4>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Company Name where you work *</label>
                  <input
                    type="text"
                    placeholder="e.g. BuildCo Infrastructures Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                    required
                  />
                </div>
              </>
            )}

            {role === "INSTITUTIONAL_SUPERVISOR" && (
              <>
                <div className="md:col-span-2 border-t border-slate-850/80 my-2 pt-3">
                  <h4 className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Institutional Supervisor Details</h4>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Institution / University Name where you work *</label>
                  <input
                    type="text"
                    placeholder="e.g. University of Lagos"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none transition-all duration-150"
                    required
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Registering...
                  </>
                ) : (
                  "Register Account"
                )}
              </button>
            </div>
          </form>
        )}

        {authMode === "forgot" && (
          /* ========================================================
             FORGOT PASSWORD / RESET VIEW
             ======================================================== */
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">
                {resetStep === 1 ? "Forgot Password" : "Reset Password"}
              </h3>
            </div>

            {resetStep === 1 ? (
              // Step 1: Request code
              <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered email address below. We will generate a 6-digit verification code to reset your password.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. adebayo@student.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150"
                    required
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("signin")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs py-3 rounded-xl transition-all duration-150"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs py-3 rounded-xl transition-all duration-150 shadow shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Step 2: Complete reset
              <form onSubmit={handleCompleteReset} className="flex flex-col gap-4">
                <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl text-xs text-slate-400 leading-normal">
                  Verification code has been sent to <span className="text-indigo-400 font-bold">{email}</span>.
                  <p className="mt-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    👉 Check your backend server console logs to retrieve the 6-digit code!
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm tracking-widest font-black text-center outline-none transition-all duration-150"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl pl-4 pr-11 py-2.5 text-sm outline-none transition-all duration-150"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                      title={showNewPassword ? "Hide Password" : "Show Password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setResetCode("");
                      setNewPassword("");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs py-3 rounded-xl transition-all duration-150"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs py-3 rounded-xl transition-all duration-150 shadow shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
