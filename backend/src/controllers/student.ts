import { Response } from "express";
import prisma from "../services/db";
import { AuthenticatedRequest } from "../types";
import { ApprovalStatus } from "@prisma/client";

// Fetch student's own logbook entries
export const getLogbook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const entries = await prisma.logbookEntry.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
    });
    res.status(200).json(entries);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch logbook entries" });
  }
};

// Create a daily log entry
export const createLogbookEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { date, weekNumber, dailyDescription, departmentSection, skillsAcquired } = req.body;

    if (!date || !weekNumber || !dailyDescription || !skillsAcquired) {
      res.status(400).json({ error: "Missing required logbook fields" });
      return;
    }

    const entryDate = new Date(date);
    if (isNaN(entryDate.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Prevent future logs
    if (entryDate > new Date()) {
      res.status(400).json({ error: "Cannot submit logbook entries for future dates" });
      return;
    }

    // Check unique constraint for student & date
    const existingEntry = await prisma.logbookEntry.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: entryDate,
        },
      },
    });

    if (existingEntry) {
      res.status(400).json({ error: "A logbook entry already exists for this date" });
      return;
    }

    const newEntry = await prisma.logbookEntry.create({
      data: {
        studentId,
        date: entryDate,
        weekNumber: parseInt(weekNumber, 10),
        dailyDescription,
        departmentSection,
        skillsAcquired,
        approvalStatus: ApprovalStatus.PENDING,
      },
    });

    res.status(201).json(newEntry);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create logbook entry" });
  }
};

// Update a log entry
export const updateLogbookEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { id } = req.params;
    const { weekNumber, dailyDescription, departmentSection, skillsAcquired } = req.body;

    const entry = await prisma.logbookEntry.findUnique({ where: { id } });

    if (!entry) {
      res.status(404).json({ error: "Logbook entry not found" });
      return;
    }

    if (entry.studentId !== studentId) {
      res.status(403).json({ error: "Unauthorized: You do not own this entry" });
      return;
    }

    // Only allow updates to PENDING or REJECTED entries
    if (entry.approvalStatus === ApprovalStatus.APPROVED) {
      res.status(400).json({
        error: "Cannot update entry. It has already been approved.",
      });
      return;
    }

    const updated = await prisma.logbookEntry.update({
      where: { id },
      data: {
        weekNumber: weekNumber ? parseInt(weekNumber, 10) : entry.weekNumber,
        dailyDescription: dailyDescription || entry.dailyDescription,
        departmentSection: departmentSection !== undefined ? departmentSection : entry.departmentSection,
        skillsAcquired: skillsAcquired || entry.skillsAcquired,
        approvalStatus: ApprovalStatus.PENDING, // Reset status to PENDING upon resubmission
        comments: null, // Clear previous supervisor comments
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update logbook entry" });
  }
};

// Delete a log entry
export const deleteLogbookEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { id } = req.params;

    const entry = await prisma.logbookEntry.findUnique({ where: { id } });

    if (!entry) {
      res.status(404).json({ error: "Logbook entry not found" });
      return;
    }

    if (entry.studentId !== studentId) {
      res.status(403).json({ error: "Unauthorized: You do not own this entry" });
      return;
    }

    // Only allow deletion of PENDING or REJECTED entries
    if (entry.approvalStatus === ApprovalStatus.APPROVED) {
      res.status(400).json({
        error: "Cannot delete entry. It has already been approved.",
      });
      return;
    }

    await prisma.logbookEntry.delete({ where: { id } });

    res.status(200).json({ message: "Logbook entry deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete logbook entry" });
  }
};

// Submit PDF report
export const submitReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      res.status(400).json({ error: "PDF URL is required" });
      return;
    }

    // A student can only have 1 report (1-to-1 flat). Create or Update.
    const report = await prisma.report.upsert({
      where: { studentId },
      update: {
        pdfUrl,
        submissionDate: new Date(),
        // Keep academicGrade and feedback intact on re-submission unless reset, or set to null if needed
      },
      create: {
        studentId,
        pdfUrl,
      },
    });

    res.status(200).json({ message: "Report submitted successfully", report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to submit report" });
  }
};

export const updateStudentProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { companyName, companyAddress, industrySupervisorId, startDate } = req.body;

    if (!companyName) {
      res.status(400).json({ error: "Company Name is required" });
      return;
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
    });

    if (!profile) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }

    let startParsed = null;
    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed.getTime())) {
        startParsed = parsed;
      }
    }

    const updatedProfile = await prisma.studentProfile.update({
      where: { studentId },
      data: {
        companyName,
        companyAddress: companyAddress || null,
        industrySupervisorId: industrySupervisorId || null,
        startDate: startParsed,
        status: ApprovalStatus.PENDING, // Reset status to PENDING for the new supervisor to verify
      },
    });

    res.status(200).json({
      message: "Placement profile updated successfully. Reset to Pending Verification.",
      profile: updatedProfile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update placement profile" });
  }
};
