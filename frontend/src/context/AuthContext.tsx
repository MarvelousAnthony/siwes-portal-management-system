import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { apiRequest, setAuthToken, clearAuthToken } from "../lib/api";

export type Role = "STUDENT" | "INDUSTRY_SUPERVISOR" | "INSTITUTIONAL_SUPERVISOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  studentProfile?: any;
}

export interface LogEntry {
  id: string;
  date: string;
  weekNumber: number;
  dailyDescription: string;
  departmentSection: string;
  skillsAcquired: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  comments?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  matricNumber: string;
  department: string;
  companyName: string;
  status: "Pending Industry" | "Verified by Industry" | "Not Submitted" | "Pending Verification" | "Declined by Industry";
  pdfUrl?: string;
  grade?: number;
  feedback?: string;
  logbookEntries: LogEntry[];
}

interface AuthContextType {
  user: User | null;
  isMockMode: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  students: StudentProfile[];
  addLogbookEntry: (entry: Omit<LogEntry, "id" | "approvalStatus">) => Promise<void>;
  verifyLogbookEntry: (studentId: string, logId: string, status: "APPROVED" | "REJECTED", comments: string) => Promise<void>;
  submitReport: (pdfName: string) => Promise<void>;
  gradeReport: (studentId: string, grade: number, feedback: string) => Promise<void>;
  registerUser: (data: any) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  completePasswordReset: (email: string, token: string, newPassword: string) => Promise<boolean>;
  verifyStudentPlacement: (studentId: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  updatePlacement: (companyName: string, companyAddress: string, industrySupervisorId: string, startDate?: string) => Promise<void>;
  updateLogbookEntry: (logId: string, entry: Omit<LogEntry, "id" | "approvalStatus">) => Promise<void>;
  deleteLogbookEntry: (logId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial Seed Data for fallback Mock Mode
const initialMockStudents: StudentProfile[] = [
  {
    id: "stud-1",
    name: "Adebayo Oyelowo",
    matricNumber: "CVE/2021/045",
    department: "Civil Engineering",
    companyName: "BuildCo Infrastructures Ltd",
    status: "Pending Industry",
    logbookEntries: [
      {
        id: "log-1",
        date: "2026-07-06",
        weekNumber: 12,
        dailyDescription: "Assisted in reinforcement checks for the third-floor slab construction. Monitored concrete pouring and verified slump testing values.",
        departmentSection: "Structural Site Ops",
        skillsAcquired: "Concrete testing, reinforcement reading, slab leveling controls.",
        approvalStatus: "PENDING",
      },
      {
        id: "log-2",
        date: "2026-07-03",
        weekNumber: 11,
        dailyDescription: "Reviewed concrete beam structural detail drawings. Marked out column positions using the theodolite tool.",
        departmentSection: "Survey & Engineering Design",
        skillsAcquired: "Leveling instrument settings, column marking calibration.",
        approvalStatus: "APPROVED",
        comments: "Excellent site execution. Double check leveling bubble next time.",
      },
    ],
  },
  {
    id: "stud-2",
    name: "Chioma Uzor",
    matricNumber: "CSC/2022/102",
    department: "Computer Science",
    companyName: "SoftTech Dev Labs",
    status: "Verified by Industry",
    pdfUrl: "siwes_final_report_chioma.pdf",
    logbookEntries: [
      {
        id: "log-3",
        date: "2026-07-06",
        weekNumber: 12,
        dailyDescription: "Refactored user authentication endpoints utilizing JWT tokens and route middlewares in Node.js.",
        departmentSection: "Backend Integration Squad",
        skillsAcquired: "JWT crypt signatures, Express handler validations.",
        approvalStatus: "APPROVED",
        comments: "Code passes validation tests cleanly. Keep it up.",
      },
    ],
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync data from session storage on mount safely
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem("siwes_user");
      const savedMockMode = sessionStorage.getItem("siwes_mock_mode");
      
      let mock = true;
      if (savedMockMode && savedMockMode !== "undefined") {
        mock = JSON.parse(savedMockMode);
        setIsMockMode(mock);
      }
      
      if (savedUser && savedUser !== "undefined") {
        setUser(JSON.parse(savedUser));
      }

      // Pre-fill mock data if mock mode is enabled on mount
      if (mock) {
        setStudents(initialMockStudents);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.warn("Failed to parse session storage user session:", e);
      sessionStorage.removeItem("siwes_user");
      sessionStorage.removeItem("siwes_mock_mode");
      setStudents(initialMockStudents);
    }
  }, []);

  // Fetch real data if backend is connected
  const fetchData = async (currentUser: User, mock: boolean) => {
    if (mock) return;
    setIsLoading(true);
    try {
      if (currentUser.role === "STUDENT") {
        const logs = await apiRequest("/student/logbook", "GET");
        const safeLogs = Array.isArray(logs) ? logs : [];
        // Update student profile with real database values
        setStudents([
          {
            id: currentUser.id,
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            matricNumber: currentUser.studentProfile?.matricNumber || "CVE/2026/0001",
            department: currentUser.studentProfile?.department || "Civil Engineering",
            companyName: currentUser.studentProfile?.companyName || "BuildCo Ltd",
            status: currentUser.studentProfile?.pdfUrl ? "Verified by Industry" : "Not Submitted",
            pdfUrl: currentUser.studentProfile?.pdfUrl || undefined,
            logbookEntries: safeLogs.map((l: any) => ({
              id: l.id,
              date: l.date.split("T")[0],
              weekNumber: l.weekNumber,
              dailyDescription: l.dailyDescription,
              departmentSection: l.departmentSection || "",
              skillsAcquired: l.skillsAcquired,
              approvalStatus: l.approvalStatus,
              comments: l.comments || undefined,
            })),
          }
        ]);
      } else if (currentUser.role === "INDUSTRY_SUPERVISOR") {
        const assigned = await apiRequest("/industry/students", "GET");
        const safeAssigned = Array.isArray(assigned) ? assigned : [];
        setStudents(
          safeAssigned.map((p: any) => ({
            id: p.studentId,
            name: `${p.student?.firstName || "Unknown"} ${p.student?.lastName || "Student"}`,
            matricNumber: p.matricNumber,
            department: p.department,
            companyName: p.companyName,
            status: p.status === "APPROVED"
              ? "Verified by Industry"
              : p.status === "REJECTED"
              ? "Declined by Industry"
              : "Pending Verification",
            logbookEntries: Array.isArray(p.student?.logbookEntries)
              ? p.student.logbookEntries.map((l: any) => ({
                  id: l.id,
                  date: l.date.split("T")[0],
                  weekNumber: l.weekNumber,
                  dailyDescription: l.dailyDescription,
                  departmentSection: l.departmentSection || "",
                  skillsAcquired: l.skillsAcquired,
                  approvalStatus: l.approvalStatus,
                  comments: l.comments || undefined,
                }))
              : [],
          }))
        );
      } else if (currentUser.role === "INSTITUTIONAL_SUPERVISOR") {
        const assigned = await apiRequest("/institutional/students", "GET");
        const safeAssigned = Array.isArray(assigned) ? assigned : [];
        setStudents(
          safeAssigned.map((p: any) => {
            const hasReport = p.student?.reports && p.student.reports.length > 0;
            const report = hasReport ? p.student.reports[0] : null;
            return {
              id: p.studentId, // Student user ID
              name: `${p.student?.firstName || "Unknown"} ${p.student?.lastName || "Student"}`,
              matricNumber: p.matricNumber,
              department: p.department,
              companyName: p.companyName,
              status: report ? "Verified by Industry" : "Not Submitted",
              pdfUrl: report ? report.pdfUrl : undefined,
              grade: report ? report.academicGrade : undefined,
              feedback: report ? report.feedback : undefined,
              logbookEntries: [],
            };
          })
        );
      }
    } catch (err) {
      console.warn("API load failed, falling back to mock UI state:", err);
      if (!mock) {
        setStudents([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData(user, isMockMode);
    }
  }, [user, isMockMode]);

  const login = async (email: string, password: string, _role: Role) => {
    setIsLoading(true);
    try {
      // Try to login to backend server
      const res = await apiRequest("/auth/login", "POST", { email, password });
      setAuthToken(res.token);
      
      const authenticatedUser: User = {
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        studentProfile: res.user.studentProfile,
      };

      setUser(authenticatedUser);
      setIsMockMode(false);
      setStudents([]); // Clear mock data immediately so there is no flash of old data
      sessionStorage.setItem("siwes_user", JSON.stringify(authenticatedUser));
      sessionStorage.setItem("siwes_mock_mode", "false");
    } catch (err: any) {
      console.error("Backend auth failed:", err);
      alert(`Authentication Failed: ${err.message || "Invalid credentials"}`);
      // Remain on login screen
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthToken();
    setStudents(initialMockStudents); // Reset back to mock defaults
    setIsMockMode(true);
    sessionStorage.removeItem("siwes_user");
    sessionStorage.removeItem("siwes_mock_mode");
  };

  const addLogbookEntry = async (entry: Omit<LogEntry, "id" | "approvalStatus">) => {
    if (!isMockMode) {
      try {
        await apiRequest("/student/logbook", "POST", entry);
        if (user) await fetchData(user, false);
        return;
      } catch (err: any) {
        alert(`API Error: ${err.message}`);
      }
    }

    // Mock Mode Fallback
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === "stud-1") {
          return {
            ...s,
            status: "Pending Industry",
            logbookEntries: [
              {
                ...entry,
                id: `log-${Date.now()}`,
                approvalStatus: "PENDING",
              },
              ...s.logbookEntries,
            ],
          };
        }
        return s;
      })
    );
  };

  const verifyLogbookEntry = async (
    studentId: string,
    logId: string,
    status: "APPROVED" | "REJECTED",
    comments: string
  ) => {
    if (!isMockMode) {
      try {
        await apiRequest(`/industry/logbook/${logId}/verify`, "POST", { status, comments });
        if (user) await fetchData(user, false);
        return;
      } catch (err: any) {
        alert(`API Error: ${err.message}`);
      }
    }

    // Mock Mode Fallback
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updatedLogs = s.logbookEntries.map((l) =>
            l.id === logId ? { ...l, approvalStatus: status, comments } : l
          );
          const hasPending = updatedLogs.some((l) => l.approvalStatus === "PENDING");
          return {
            ...s,
            status: hasPending ? "Pending Industry" : "Verified by Industry",
            logbookEntries: updatedLogs,
          };
        }
        return s;
      })
    );
  };

  const submitReport = async (pdfName: string) => {
    if (!isMockMode) {
      try {
        await apiRequest("/student/report", "POST", { pdfUrl: pdfName });
        if (user) await fetchData(user, false);
        return;
      } catch (err: any) {
        alert(`API Error: ${err.message}`);
      }
    }

    // Mock Mode Fallback
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === "stud-1") {
          return {
            ...s,
            pdfUrl: pdfName,
          };
        }
        return s;
      })
    );
  };

  const gradeReport = async (studentId: string, grade: number, feedback: string) => {
    if (!isMockMode) {
      try {
        // Find report ID in our students state structure
        const targetStudent = students.find((s) => s.id === studentId);
        if (targetStudent) {
          // Normally we'd fetch the report model representation. For DB grading we call the report's grading API endpoint.
          // In the database migrations, Reports points to the Student's User ID. 
          // Our endpoint in Express routes: POST /api/institutional/report/:id/grade (where :id is the report UUID).
          // We can query the report details to obtain its id, or backend can lookup report by student ID.
          // Since our endpoint is /api/institutional/report/:id/grade, let's call the endpoint.
          // Let's resolve the report ID. In fetch student we received the report list containing report.id!
          // So we can extract the report ID.
          const report = await apiRequest(`/institutional/students/${studentId}/report`, "GET");
          if (report && report.id) {
            await apiRequest(`/institutional/report/${report.id}/grade`, "POST", { grade, feedback });
          }
        }
        if (user) await fetchData(user, false);
        return;
      } catch (err: any) {
        alert(`API Error: ${err.message}`);
      }
    }

    // Mock Mode Fallback
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            grade,
            feedback,
          };
        }
        return s;
      })
    );
  };

  const registerUser = async (data: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiRequest("/auth/register", "POST", data);
      alert("Registration successful! Please sign in using your credentials.");
      return true;
    } catch (err: any) {
      alert(`Registration Failed: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiRequest("/auth/forgot-password", "POST", { email });
      alert("Password reset code generated! Check your backend server console logs to retrieve the 6-digit code.");
      return true;
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to request password reset"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordReset = async (email: string, token: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiRequest("/auth/reset-password", "POST", { email, token, newPassword });
      alert("Password reset successfully! You can now log in with your new password.");
      return true;
    } catch (err: any) {
      alert(`Reset Failed: ${err.message || "Invalid or expired reset code"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyStudentPlacement = async (studentId: string, status: "APPROVED" | "REJECTED") => {
    setIsLoading(true);
    try {
      await apiRequest(`/industry/students/${studentId}/verify`, "POST", { status });
      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                status: status === "APPROVED" ? "Verified by Industry" : "Declined by Industry",
              }
            : s
        )
      );
      alert(`Student placement status successfully ${status.toLowerCase()}d!`);
    } catch (err: any) {
      alert(`Verification Failed: ${err.message || "Could not complete request"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlacement = async (companyName: string, companyAddress: string, industrySupervisorId: string, startDate?: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("/student/profile", "PUT", {
        companyName,
        companyAddress,
        industrySupervisorId,
        startDate,
      });

      // Update user state and localStorage
      setUser((prev) => {
        if (!prev) return null;
        const updatedUser = {
          ...prev,
          studentProfile: res.profile,
        };
        sessionStorage.setItem("siwes_user", JSON.stringify(updatedUser));
        return updatedUser;
      });

      // Update local students list
      setStudents((prev) =>
        prev.map((s) =>
          s.id === user?.id
            ? {
                ...s,
                companyName,
                status: "Pending Verification",
              }
            : s
        )
      );

      alert("Placement details and Industry Supervisor updated successfully! Reset to Pending Verification.");
    } catch (err: any) {
      alert(`Update Failed: ${err.message || "Could not complete request"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLogbookEntry = async (logId: string, entry: Omit<LogEntry, "id" | "approvalStatus">) => {
    setIsLoading(true);
    try {
      await apiRequest(`/student/logbook/${logId}`, "PUT", entry);
      if (user) await fetchData(user, false);
      alert("Logbook entry updated and resubmitted successfully!");
    } catch (err: any) {
      alert(`Update Failed: ${err.message || "Could not complete request"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLogbookEntry = async (logId: string) => {
    setIsLoading(true);
    try {
      await apiRequest(`/student/logbook/${logId}`, "DELETE");
      if (user) await fetchData(user, false);
      alert("Logbook entry deleted successfully!");
    } catch (err: any) {
      alert(`Deletion Failed: ${err.message || "Could not complete request"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isMockMode,
        isLoading,
        login,
        logout,
        students,
        addLogbookEntry,
        verifyLogbookEntry,
        submitReport,
        gradeReport,
        registerUser,
        requestPasswordReset,
        completePasswordReset,
        verifyStudentPlacement,
        updatePlacement,
        updateLogbookEntry,
        deleteLogbookEntry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
