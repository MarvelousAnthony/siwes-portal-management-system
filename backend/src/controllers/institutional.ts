import { Response } from "express";
import prisma from "../services/db";
import { AuthenticatedRequest } from "../types";

// Get students assigned to this institutional supervisor
export const getAssignedStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supervisorId = req.user!.id;

    const profiles = await prisma.studentProfile.findMany({
      where: { institutionalSupervisorId: supervisorId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            reports: true, // Show report status
          },
        },
      },
    });

    res.status(200).json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch assigned students" });
  }
};

// Fetch report of a specific assigned student
export const getStudentReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supervisorId = req.user!.id;
    const { studentId } = req.params;

    // Check if the student is assigned to this supervisor
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
    });

    if (!profile || profile.institutionalSupervisorId !== supervisorId) {
      res.status(403).json({
        error: "Unauthorized: You are not the assigned institutional supervisor for this student",
      });
      return;
    }

    const report = await prisma.report.findUnique({
      where: { studentId },
    });

    if (!report) {
      res.status(404).json({ error: "No report found for this student" });
      return;
    }

    res.status(200).json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch report" });
  }
};

// Grade a student's final report
export const gradeReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supervisorId = req.user!.id;
    const { id } = req.params; // Report ID
    const { grade, feedback } = req.body;

    if (grade === undefined) {
      res.status(400).json({ error: "Academic grade is required" });
      return;
    }

    const academicGrade = parseFloat(grade);
    if (isNaN(academicGrade) || academicGrade < 0 || academicGrade > 100) {
      res.status(400).json({ error: "Grade must be a number between 0 and 100" });
      return;
    }

    // Find the report and include student profile details
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const profile = report.student.studentProfile;
    if (!profile || profile.institutionalSupervisorId !== supervisorId) {
      res.status(403).json({
        error: "Unauthorized: You are not the assigned institutional supervisor for this student",
      });
      return;
    }

    // Check if student has completed required logbook weeks
    const logs = await prisma.logbookEntry.findMany({
      where: { studentId: report.studentId },
      select: { weekNumber: true },
    });

    const distinctWeeks = new Set(logs.map((l) => l.weekNumber));
    const REQUIRED_WEEKS = 12;

    if (distinctWeeks.size < REQUIRED_WEEKS) {
      res.status(400).json({
        error: `Cannot grade report: Student has completed logbook entries for only ${distinctWeeks.size} week(s), but ${REQUIRED_WEEKS} weeks are required.`,
      });
      return;
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        academicGrade,
        feedback: feedback || null,
      },
    });

    res.status(200).json({
      message: "Report successfully graded",
      report: updatedReport,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to grade report" });
  }
};
