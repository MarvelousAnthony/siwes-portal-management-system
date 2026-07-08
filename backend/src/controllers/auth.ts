import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import prisma from "../services/db";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-nextauth-secret-key-at-least-32-chars";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phoneNumber,
      institution,
      // StudentProfile specific fields
      matricNumber,
      department,
      companyName,
      companyAddress,
      institutionalSupervisorId,
      industrySupervisorId,
      startDate,
    } = req.body;

    if (!email || !password || !role || !firstName || !lastName) {
      res.status(400).json({ error: "Missing required registration fields" });
      return;
    }

    const validRoles = Object.values(Role);
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // If role is Student, matricNumber, department, companyName are mandatory
    if (role === Role.STUDENT) {
      if (!matricNumber || !department || !companyName) {
        res.status(400).json({ error: "Matric number, department, and company name are required for students" });
        return;
      }

      // Enforce format DEPT/YEAR/INDEX (e.g., CVE/2026/1234) where INDEX is a 4-digit number
      const matricRegex = /^[A-Z]{3,4}\/\d{4}\/\d{4}$/i;
      if (!matricRegex.test(matricNumber)) {
        res.status(400).json({ error: "Matric Number must match the format DEPT/YEAR/INDEX (e.g., CVE/2026/1234 with a 4-digit index number)" });
        return;
      }

      const existingMatric = await prisma.studentProfile.findUnique({ where: { matricNumber } });
      if (existingMatric) {
        res.status(400).json({ error: "Student with this matric number already exists" });
        return;
      }
    }

    // Supervisor specific validations
    if (role === Role.INDUSTRY_SUPERVISOR && !companyName) {
      res.status(400).json({ error: "Company name is required for Industry Supervisors" });
      return;
    }
    if (role === Role.INSTITUTIONAL_SUPERVISOR && !institution) {
      res.status(400).json({ error: "Institution is required for Institutional Supervisors" });
      return;
    }

    // Run in a transaction to guarantee User and StudentProfile are created together
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          firstName,
          lastName,
          phoneNumber,
          companyName: role === Role.INDUSTRY_SUPERVISOR ? companyName : undefined,
          institution: role === Role.INSTITUTIONAL_SUPERVISOR ? institution : undefined,
        },
      });

      let studentProfile = null;
      if (role === Role.STUDENT) {
        let startParsed = null;
        if (startDate) {
          const parsed = new Date(startDate);
          if (!isNaN(parsed.getTime())) {
            startParsed = parsed;
          }
        }

        studentProfile = await tx.studentProfile.create({
          data: {
            studentId: user.id,
            matricNumber,
            department,
            companyName,
            companyAddress,
            startDate: startParsed,
            institutionalSupervisorId: institutionalSupervisorId || null,
            industrySupervisorId: industrySupervisorId || null,
          },
        });
      }

      return { ...user, studentProfile };
    });

    // Generate JWT
    const token = jwt.sign(
      { id: result.id, email: result.email, role: result.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        firstName: result.firstName,
        lastName: result.lastName,
        studentProfile: result.studentProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentProfile: user.studentProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
};

export const getSupervisors = async (req: Request, res: Response): Promise<void> => {
  try {
    const supervisors = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.INDUSTRY_SUPERVISOR, Role.INSTITUTIONAL_SUPERVISOR],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { firstName: "asc" },
    });
    res.status(200).json(supervisors);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch supervisors" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({ message: "If this email exists, a reset code has been sent." });
      return;
    }

    // Generate a random 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: resetCode,
        resetTokenExpires: expires,
      },
    });

    // Simulate sending email: output to backend logs/terminal
    console.log("\n========================================================");
    console.log("📨 SIMULATED EMAIL TRANSMISSION (PASSWORD RESET)");
    console.log("========================================================");
    console.log(`To: ${email}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Verification Code: ${resetCode}`);
    console.log(`Expires In: 15 minutes`);
    console.log("========================================================\n");

    // Also write it to a text file in the workspace root folder so it's easy for the user to find
    try {
      const logContent = `[${new Date().toLocaleTimeString()}] To: ${email} | Verification Code: ${resetCode}\n`;
      fs.writeFileSync(path.join(process.cwd(), "..", "reset-codes.txt"), logContent);
    } catch (fsErr) {
      console.error("Failed to write reset code to workspace root:", fsErr);
    }

    res.status(200).json({ message: "Reset code sent successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to process forgot password" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      res.status(400).json({ error: "Email, reset code, and new password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetToken !== token || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      res.status(400).json({ error: "Invalid or expired verification code." });
      return;
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset columns
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.status(200).json({ message: "Password reset successful." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to reset password" });
  }
};
