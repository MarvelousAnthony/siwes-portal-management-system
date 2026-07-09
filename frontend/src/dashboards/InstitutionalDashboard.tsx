import React, { useState } from "react";
import { useAuth, StudentProfile } from "../context/AuthContext";
import { Award, FileText, CheckCircle2, AlertTriangle, HelpCircle, GraduationCap, ArrowRight, LogOut, Clock, Sun, Moon } from "lucide-react";

export const InstitutionalDashboard = () => {
  const { user, logout, students, gradeReport, isMockMode, theme, toggleTheme, isLoading } = useAuth();

  const [selectedStudentId, setSelectedStudentId] = useState<string>("stud-2"); // Default to student with report pre-uploaded
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Guard against crash if students array is empty
  if (students.length === 0) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="glass sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                SIWES Portal
              </h1>
              <p className="text-xs text-slate-400">Institutional Supervisor Dashboard</p>
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

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2 mt-20">
            <GraduationCap className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200">You have no assigned students yet.</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              When you have an assigned student, you'll see them here. When a student registers and selects you as their Institutional Supervisor, their details and grading controls will automatically appear.
            </p>
          </div>
        </main>
      </div>
    );
  }



  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      alert("Please enter a numeric grade.");
      return;
    }

    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      alert("Grade must be a number between 0 and 100.");
      return;
    }

    setIsSubmittingGrade(true);
    try {
      await gradeReport(selectedStudent.id, numericGrade, feedback);
      setGrade("");
      setFeedback("");
      alert(`Successfully graded ${selectedStudent.name}!`);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const renderStatusBadge = (status: StudentProfile["status"]) => {
    switch (status) {
      case "Verified by Industry":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Industry
          </span>
        );
      case "Pending Industry":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-900 px-2.5 py-1 rounded-full font-medium">
            <Clock className="w-3.5 h-3.5" /> Pending Industry
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-full font-medium">
            <HelpCircle className="w-3.5 h-3.5" /> Not Submitted
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="glass sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SIWES Portal
            </h1>
            <p className="text-xs text-slate-400">Institutional Supervisor Dashboard</p>
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

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Top Section: Data Table */}
        <section className="glass p-6 rounded-2xl shadow-xl">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-200">
            <GraduationCap className="w-5.5 h-5.5 text-blue-500" /> Supervised Students
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Placement Company</th>
                  <th className="py-3 px-4">SIWES Status</th>
                  <th className="py-3 px-4">Academic Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      selectedStudentId === student.id ? "bg-slate-900/25" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-200">{student.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{student.matricNumber}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{student.department}</td>
                    <td className="py-4 px-4 text-slate-300">{student.companyName}</td>
                    <td className="py-4 px-4">{renderStatusBadge(student.status)}</td>
                    <td className="py-4 px-4">
                      {student.grade !== undefined ? (
                        <span className="px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-900 text-indigo-400 font-bold text-xs">
                          {student.grade} / 100
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Not Graded</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setGrade(student.grade !== undefined ? student.grade.toString() : "");
                          setFeedback(student.feedback || "");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Grade Report <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Section: Report View and Evaluation */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PDF Viewer Panel (LHS - 2 cols) */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800/80 pb-3">
              <FileText className="w-5.5 h-5.5 text-teal-500" /> Technical Report Viewer
            </h3>

            {selectedStudent.pdfUrl ? (
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Document ID: {selectedStudent.pdfUrl}</p>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Open Document
                  </a>
                </div>

                {/* Mock PDF Viewer Canvas */}
                <div className="bg-white text-slate-900 p-8 rounded-xl shadow-inner max-h-[380px] overflow-y-auto border border-slate-200 leading-relaxed text-xs">
                  <div className="text-center border-b border-slate-300 pb-4 mb-6">
                    <h2 className="text-base font-bold uppercase tracking-tight text-slate-800">
                      SIWES Final Technical Report
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                      Department of {selectedStudent.department}
                    </p>
                    <p className="text-[10px] text-slate-500">Academic Session 2025/2026</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-[10px] text-slate-600">
                    <div>
                      <p><span className="font-bold">Student:</span> {selectedStudent.name}</p>
                      <p className="mt-0.5"><span className="font-bold">Matric Number:</span> {selectedStudent.matricNumber}</p>
                    </div>
                    <div>
                      <p><span className="font-bold">Company Name:</span> {selectedStudent.companyName}</p>
                      <p className="mt-0.5"><span className="font-bold">Status:</span> Approved by Industry Supervisor</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1">
                        1.0 Executive Summary
                      </h4>
                      <p className="text-slate-600 text-justify">
                        This technical report details the 6-month Industrial Work Experience Scheme undertaken at {selectedStudent.companyName}. The training provided exposure to practical industry methods, heavy machinery calibration, and backend microservice software designs. Specifically, critical engineering solutions were verified under close site supervision.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1">
                        2.0 Key Projects and Log Summaries
                      </h4>
                      <p className="text-slate-600 text-justify">
                        During the placement, extensive project actions were conducted. A total of {selectedStudent.logbookEntries.length} logbook items were recorded and reviewed. The core achievements include structural layout marking, concrete quality assurance checks, and node service optimizations. These operations helped bridge class theories with real-world project deployments.
                      </p>
                    </div>

                    <div className="mt-6 border-t border-dashed border-slate-300 pt-4 flex justify-between text-[8px] text-slate-400 uppercase font-semibold">
                      <p>Prepared by: {selectedStudent.name}</p>
                      <p>Approved: Industry Supervisor (Sign)</p>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16 border border-dashed border-slate-800 rounded-xl">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-300">No Report Submitted</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                    {selectedStudent.name} has not submitted their final technical report PDF yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grading Form Panel (RHS - 1 col) */}
          <div className="lg:col-span-1">
            <div className="glass p-6 rounded-2xl shadow-xl flex flex-col gap-4 sticky top-24">
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-200">
                <Award className="w-5.5 h-5.5 text-indigo-400" /> Grade Evaluation
              </h3>

              <div className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl text-xs flex flex-col gap-1">
                <p className="text-slate-400">Evaluating Student:</p>
                <p className="text-slate-200 font-bold">{selectedStudent.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{selectedStudent.matricNumber}</p>
              </div>

              {selectedStudent.grade !== undefined && (
                <div className="bg-indigo-950/40 border border-indigo-900 p-3.5 rounded-xl text-xs">
                  <div className="flex justify-between items-center font-bold text-indigo-300">
                    <span>Current Grade:</span>
                    <span>{selectedStudent.grade} / 100</span>
                  </div>
                  {selectedStudent.feedback && (
                    <p className="text-slate-400 italic mt-2">"{selectedStudent.feedback}"</p>
                  )}
                </div>
              )}

              <form onSubmit={handleGradeSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Score (0 - 100) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none text-sm transition-all duration-150"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Academic Review Feedback</label>
                  <textarea
                    rows={3}
                    placeholder="Provide comments on report structure, technical details, presentation..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 outline-none resize-none text-xs transition-all duration-150"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingGrade ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Grade & Review"
                  )}
                </button>
              </form>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
};
