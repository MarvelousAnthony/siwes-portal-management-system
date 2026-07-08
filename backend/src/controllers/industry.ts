import { Response } from "express";
import prisma from "../services/db";
import { AuthenticatedRequest } from "../types";
import { ApprovalStatus } from "@prisma/client";

// Get students assigned to this industry supervisor and their logbook entries
export const getAssignedStudentsLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supervisorId = req.user!.id;

    // Find all student profiles assigned to this supervisor
    const profiles = await prisma.studentProfile.findMany({
      where: { industrySupervisorId: supervisorId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            logbookEntries: {
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    res.status(200).json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch assigned students' logs" });
  }
};

// Approve or reject a log entry with comments
export const verifyLogbookEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supervisorId = req.user!.id;
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status) {
      res.status(400).json({ error: "Approval status is required" });
      return;
    }

    const validStatuses = [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be APPROVED or REJECTED" });
      return;
    }

    // Find logbook entry
    const entry = await prisma.logbookEntry.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    if (!entry) {
      res.status(404).json({ error: "Logbook entry not found" });
      return;
    }

    // Check if this supervisor is assigned to the student
    const profile = entry.student.studentProfile;
    if (!profile || profile.industrySupervisorId !== supervisorId) {
      res.status(403).json({
        error: "Unauthorized: You are not the assigned industry supervisor for this student",
      });
      return;
    }

    // Update logbook entry
    const updatedEntry = await prisma.logbookEntry.update({
      where: { id },
      data: {
        approvalStatus: status,
        comments: comments || null,
      },
    });

    res.status(200).json({
      message: `Logbook entry successfully ${status.toLowerCase()}d`,
      entry: updatedEntry,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to verify logbook entry" });
  }
};

export const verifyStudentProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supervisorId = req.user!.id;
    const { studentId } = req.params;
    const { status } = req.body;

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      res.status(400).json({ error: "Invalid status. Must be APPROVED or REJECTED" });
      return;
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
    });

    if (!profile) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }

    if (profile.industrySupervisorId !== supervisorId) {
      res.status(403).json({ error: "Unauthorized: You are not the assigned supervisor for this student" });
      return;
    }

    const updatedProfile = await prisma.studentProfile.update({
      where: { studentId },
      data: { status },
    });

    res.status(200).json({
      message: `Student placement status successfully ${status.toLowerCase()}d`,
      profile: updatedProfile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to verify student placement" });
  }
};
