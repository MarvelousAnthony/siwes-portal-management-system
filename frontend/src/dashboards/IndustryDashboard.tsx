import React, { useState } from "react";
import { useAuth, StudentProfile, LogEntry } from "../context/AuthContext";
import { Users, FileCheck, Check, X, MessageSquare, LogOut, CheckCircle, Clock, AlertCircle } from "lucide-react";

export const IndustryDashboard = () => {
  const { user, logout, students, verifyLogbookEntry, verifyStudentPlacement, isMockMode } = useAuth();
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>("stud-1");
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [comments, setComments] = useState("");

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Guard against crash if students array is empty
  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="glass sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
              I
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                SIWES Portal
              </h1>
              <p className="text-xs text-slate-400">Industry Supervisor Dashboard</p>
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
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200"
              title="Log Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2 mt-20">
            <Users className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200">You have no assigned students yet.</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              When you have an assigned student, you'll see them here. When a student registers and selects you as their Industry Supervisor, their daily log submissions will automatically appear here for verification.
            </p>
          </div>
        </main>
      </div>
    );
  }



  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogId || !status) {
      alert("Please choose whether to Approve or Reject the entry.");
      return;
    }
    verifyLogbookEntry(selectedStudent.id, activeLogId, status, comments);
    
    // Clear states
    setActiveLogId(null);
    setStatus(null);
    setComments("");
  };

  const renderStatusBadge = (logStatus: LogEntry["approvalStatus"]) => {
    switch (logStatus) {
      case "APPROVED":
        return (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="glass sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
            I
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              SIWES Portal
            </h1>
            <p className="text-xs text-slate-400">Industry Supervisor Dashboard</p>
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
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar Panel: Trainee Roster */}
        <section className="md:col-span-1 flex flex-col gap-4">
          <div className="glass p-5 rounded-2xl flex flex-col gap-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-200">
              <Users className="w-5 h-5 text-emerald-500" /> Assigned Trainees
            </h2>
            <div className="flex flex-col gap-2">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setActiveLogId(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                    selectedStudent.id === student.id
                      ? "bg-slate-900 border-slate-750 shadow-md"
                      : "bg-slate-950/40 border-slate-900/50 hover:bg-slate-900/40 hover:border-slate-800"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-200">{student.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{student.matricNumber}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{student.department.split(" ")[0]}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      student.status === "Verified by Industry"
                        ? "text-emerald-400 bg-emerald-950/40 border border-emerald-900"
                        : student.status === "Declined by Industry"
                        ? "text-rose-400 bg-rose-950/40 border border-rose-900"
                        : "text-amber-400 bg-amber-950/40 border border-amber-900"
                    }`}>
                      {student.status.replace(" by Industry", "")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Pane: Log Approval and Details */}
        <section className="md:col-span-3 flex flex-col gap-6">
          {/* Student Banner */}
          <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Currently Reviewing</span>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">{selectedStudent.name}</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedStudent.department} • {selectedStudent.matricNumber}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Total Logs Submitted</span>
              <span className="text-2xl font-black text-emerald-400">{selectedStudent.logbookEntries.length}</span>
            </div>
          </div>

          {/* Placement Verification Card */}
          {selectedStudent.status === "Pending Verification" && (
            <div className="bg-gradient-to-r from-indigo-950/80 to-blue-950/80 border border-indigo-500/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-indigo-500/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Placement Verification Required</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                    Confirm if this student is currently undertaking their SIWES placement at your company. 
                    Verifying them will allow you to approve their daily log submissions.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 self-end md:self-center">
                <button
                  onClick={() => verifyStudentPlacement(selectedStudent.id, "REJECTED")}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-rose-400 font-semibold text-xs rounded-xl transition-all duration-200"
                >
                  Decline Placement
                </button>
                <button
                  onClick={() => verifyStudentPlacement(selectedStudent.id, "APPROVED")}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10"
                >
                  Verify Student
                </button>
              </div>
            </div>
          )}

          {selectedStudent.status === "Declined by Industry" && (
            <div className="bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>You have declined this student's placement request. They will not be able to proceed with logbook submissions under your supervision.</span>
            </div>
          )}

          {/* Verification deck */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Log List (LHS) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="glass p-5 rounded-2xl">
                <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-200">
                  <FileCheck className="w-5 h-5 text-teal-500" /> Logbook Entries
                </h3>
                {selectedStudent.logbookEntries.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-6 text-center">No logs found for this student.</p>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                    {selectedStudent.logbookEntries.map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                          activeLogId === log.id
                            ? "bg-slate-900 border-emerald-500/80 shadow-md"
                            : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/30 hover:border-slate-800"
                        }`}
                        onClick={() => {
                          setActiveLogId(log.id);
                          setStatus(log.approvalStatus === "PENDING" ? null : log.approvalStatus);
                          setComments(log.comments || "");
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2.5">
                          <div>
                            <p className="text-xs font-semibold text-slate-350">{log.date}</p>
                            <p className="text-[10px] text-slate-500">Week {log.weekNumber} • {log.departmentSection || "General"}</p>
                          </div>
                          {renderStatusBadge(log.approvalStatus)}
                        </div>
                        <p className="text-xs text-slate-400 truncate"><span className="font-semibold">Work:</span> {log.dailyDescription}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5"><span className="font-semibold">Skills:</span> {log.skillsAcquired}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Form (RHS) */}
            <div className="lg:col-span-2">
              {activeLogId ? (
                <div className="glass p-5 rounded-2xl shadow-xl sticky top-24">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-200">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> Log Verification
                  </h3>
                  
                  {/* Detailed Log Summary */}
                  {(() => {
                    const log = selectedStudent.logbookEntries.find((l) => l.id === activeLogId)!;
                    return (
                      <div className="flex flex-col gap-3.5 mb-5 bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl text-xs leading-relaxed text-slate-350">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date & Section</p>
                          <p className="mt-0.5 text-slate-300 font-semibold">{log.date} ({log.departmentSection || "General"})</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Job Description</p>
                          <p className="mt-0.5 text-slate-400">{log.dailyDescription}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Practical Skills Acquired</p>
                          <p className="mt-0.5 text-slate-400">{log.skillsAcquired}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Decision *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStatus("APPROVED")}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            status === "APPROVED"
                              ? "bg-emerald-950/60 border-emerald-600 text-emerald-400 shadow-md shadow-emerald-500/5"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                          }`}
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus("REJECTED")}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            status === "REJECTED"
                              ? "bg-rose-950/60 border-rose-600 text-rose-400 shadow-md shadow-rose-500/5"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                          }`}
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Comments / Corrections</label>
                      <textarea
                        rows={3}
                        placeholder="Write feedback, recommendations, or reason for rejection..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none resize-none text-xs transition-all duration-150"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs py-3 rounded-xl transition-all duration-200 active:scale-98"
                    >
                      Submit Verification
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 py-16 h-full border-dashed">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">No Log Selected</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                      Select an entry from the list to review details and approve/reject.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};
