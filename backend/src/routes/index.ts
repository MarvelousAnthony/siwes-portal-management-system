import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticateJWT, requireRoles } from "../middleware/auth";
import { register, login, getSupervisors, forgotPassword, resetPassword } from "../controllers/auth";
import {
  getLogbook,
  createLogbookEntry,
  updateLogbookEntry,
  deleteLogbookEntry,
  submitReport,
  updateStudentProfile,
} from "../controllers/student";
import {
  getAssignedStudentsLogs,
  verifyLogbookEntry,
  verifyStudentProfile,
} from "../controllers/industry";
import {
  getAssignedStudents,
  getStudentReport,
  gradeReport,
} from "../controllers/institutional";

const router = Router();

// ==========================================
// Public Auth Routes
// ==========================================
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/supervisors", getSupervisors);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

// ==========================================
// Student Routes (Role: STUDENT)
// ==========================================
router.get(
  "/student/logbook",
  authenticateJWT,
  requireRoles([Role.STUDENT]),
  getLogbook
);
router.post(
  "/student/logbook",
  authenticateJWT,
  requireRoles([Role.STUDENT]),
  createLogbookEntry
);
router.put(
  "/student/logbook/:id",
  authenticateJWT,
  requireRoles([Role.STUDENT]),
  updateLogbookEntry
);
router.delete(
  "/student/logbook/:id",
  authenticateJWT,
  requireRoles([Role.STUDENT]),
  deleteLogbookEntry
);
router.post(
  "/student/report",
  authenticateJWT,
  requireRoles([Role.STUDENT]),
  submitReport
);
router.put(
  "/student/profile",
  authenticateJWT,
  requireRoles([Role.STUDENT]),
  updateStudentProfile
);

// ==========================================
// Industry Supervisor Routes (Role: INDUSTRY_SUPERVISOR)
// ==========================================
router.get(
  "/industry/students",
  authenticateJWT,
  requireRoles([Role.INDUSTRY_SUPERVISOR]),
  getAssignedStudentsLogs
);
router.post(
  "/industry/logbook/:id/verify",
  authenticateJWT,
  requireRoles([Role.INDUSTRY_SUPERVISOR]),
  verifyLogbookEntry
);
router.post(
  "/industry/students/:studentId/verify",
  authenticateJWT,
  requireRoles([Role.INDUSTRY_SUPERVISOR]),
  verifyStudentProfile
);

// ==========================================
// Institutional Supervisor Routes (Role: INSTITUTIONAL_SUPERVISOR)
// ==========================================
router.get(
  "/institutional/students",
  authenticateJWT,
  requireRoles([Role.INSTITUTIONAL_SUPERVISOR]),
  getAssignedStudents
);
router.get(
  "/institutional/students/:studentId/report",
  authenticateJWT,
  requireRoles([Role.INSTITUTIONAL_SUPERVISOR]),
  getStudentReport
);
router.post(
  "/institutional/report/:id/grade",
  authenticateJWT,
  requireRoles([Role.INSTITUTIONAL_SUPERVISOR]),
  gradeReport
);

export default router;
