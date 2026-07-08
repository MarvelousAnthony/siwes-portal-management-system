import jwt from "jsonwebtoken";
import prisma from "./services/db";

// ==================================================
// 1. In-Memory Stateful Database Mock Definitions
// ==================================================
const db = {
  users: [] as any[],
  studentProfiles: [] as any[],
  logbookEntries: [] as any[],
  reports: [] as any[],
};

// Clear DB state
const resetDb = () => {
  db.users = [];
  db.studentProfiles = [];
  db.logbookEntries = [];
  db.reports = [];
};

// Hijack Prisma Client Operations
(prisma as any).$transaction = async (callback: any) => {
  return callback(prisma);
};

(prisma.user as any).findUnique = async (args: any): Promise<any> => {
  const { where } = args;
  return db.users.find((u) => u.email === where.email || u.id === where.id) || null;
};

(prisma.user as any).create = async (args: any): Promise<any> => {
  const { data } = args;
  const newUser = { id: `user-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
  db.users.push(newUser);
  return newUser;
};

(prisma.studentProfile as any).findUnique = async (args: any): Promise<any> => {
  const { where } = args;
  return db.studentProfiles.find((p) => p.studentId === where.studentId || p.id === where.id || p.matricNumber === where.matricNumber) || null;
};

(prisma.studentProfile as any).findMany = async (args: any): Promise<any> => {
  const { where } = args;
  // Filter profiles based on supervisors
  let results = [...db.studentProfiles];
  if (where) {
    if (where.industrySupervisorId) {
      results = results.filter((p) => p.industrySupervisorId === where.industrySupervisorId);
    }
    if (where.institutionalSupervisorId) {
      results = results.filter((p) => p.institutionalSupervisorId === where.institutionalSupervisorId);
    }
  }

  // Populate student details
  return results.map((profile) => {
    const studentUser = db.users.find((u) => u.id === profile.studentId);
    const reportList = db.reports.filter((r) => r.studentId === profile.studentId);
    return {
      ...profile,
      student: {
        ...studentUser,
        reports: reportList,
        logbookEntries: db.logbookEntries.filter((l) => l.studentId === profile.studentId),
      },
    };
  });
};

(prisma.studentProfile as any).create = async (args: any): Promise<any> => {
  const { data } = args;
  const newProfile = { id: `profile-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
  db.studentProfiles.push(newProfile);
  return newProfile;
};

(prisma.logbookEntry as any).findUnique = async (args: any): Promise<any> => {
  const { where } = args;
  if (where.id) {
    const entry = db.logbookEntries.find((l) => l.id === where.id);
    if (entry) {
      const studentUser = db.users.find((u) => u.id === entry.studentId);
      const studentProfile = db.studentProfiles.find((p) => p.studentId === entry.studentId);
      return {
        ...entry,
        student: {
          ...studentUser,
          studentProfile,
        },
      };
    }
  }
  if (where.studentId_date) {
    const { studentId, date } = where.studentId_date;
    return db.logbookEntries.find((l) => l.studentId === studentId && l.date.getTime() === date.getTime()) || null;
  }
  return null;
};

(prisma.logbookEntry as any).findMany = async (args: any): Promise<any> => {
  const { where } = args;
  if (where && where.studentId) {
    return db.logbookEntries.filter((l) => l.studentId === where.studentId);
  }
  return db.logbookEntries;
};

(prisma.logbookEntry as any).create = async (args: any): Promise<any> => {
  const { data } = args;
  const newLog = { id: `log-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
  db.logbookEntries.push(newLog);
  return newLog;
};

(prisma.logbookEntry as any).update = async (args: any): Promise<any> => {
  const { where, data } = args;
  const index = db.logbookEntries.findIndex((l) => l.id === where.id);
  if (index !== -1) {
    db.logbookEntries[index] = { ...db.logbookEntries[index], ...data, updatedAt: new Date() };
    return db.logbookEntries[index];
  }
  throw new Error("Logbook entry not found for update");
};

(prisma.report as any).findUnique = async (args: any): Promise<any> => {
  const { where } = args;
  const report = db.reports.find((r) => r.studentId === where.studentId || r.id === where.id);
  if (report) {
    const studentUser = db.users.find((u) => u.id === report.studentId);
    const studentProfile = db.studentProfiles.find((p) => p.studentId === report.studentId);
    return {
      ...report,
      student: {
        ...studentUser,
        studentProfile,
      },
    };
  }
  return null;
};

(prisma.report as any).upsert = async (args: any): Promise<any> => {
  const { where, update, create } = args;
  const index = db.reports.findIndex((r) => r.studentId === where.studentId);
  if (index !== -1) {
    db.reports[index] = { ...db.reports[index], ...update, updatedAt: new Date() };
    return db.reports[index];
  } else {
    const newReport = { id: `report-${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
    db.reports.push(newReport);
    return newReport;
  }
};

(prisma.report as any).update = async (args: any): Promise<any> => {
  const { where, data } = args;
  const index = db.reports.findIndex((r) => r.id === where.id);
  if (index !== -1) {
    db.reports[index] = { ...db.reports[index], ...data, updatedAt: new Date() };
    return db.reports[index];
  }
  throw new Error("Report not found for update");
};

// ==================================================
// 2. Set Env & Boot Express App
// ==================================================
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret-key-at-least-32-characters-long";
import app from "./index";

const TEST_PORT = 4002;
const server = app.listen(TEST_PORT, () => {
  console.log(`🧪 Test E2E Server running on port ${TEST_PORT}`);
  runE2ETests();
});

// ==================================================
// 3. E2E Test Loop Implementation
// ==================================================
async function runE2ETests() {
  resetDb();
  let passed = true;
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    console.log("\n==================================================");
    console.log("🚦 STARTING STATEFUL SIWES E2E INTEGRATION LOOP");
    console.log("==================================================\n");

    // --------------------------------------------------
    // STEP 1: Register Trainees & Supervisors
    // --------------------------------------------------
    console.log("Step 1: Registering Student & Supervisors...");
    
    // Register Supervisors first so we get their IDs
    const registerIndResponse = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "industry@siwes.com",
        password: "password",
        role: "INDUSTRY_SUPERVISOR",
        firstName: "Tunde",
        lastName: "Bello",
      }),
    });
    const indRes = await registerIndResponse.json() as any;
    const industrySupervisorId = indRes.user.id;

    const registerInstResponse = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "inst@siwes.com",
        password: "password",
        role: "INSTITUTIONAL_SUPERVISOR",
        firstName: "Helen",
        lastName: "Alabi",
      }),
    });
    const instRes = await registerInstResponse.json() as any;
    const institutionalSupervisorId = instRes.user.id;

    // Register Student and assign both supervisors
    const registerStudentResponse = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@siwes.com",
        password: "password",
        role: "STUDENT",
        firstName: "Adebayo",
        lastName: "Oyelowo",
        matricNumber: "CVE/2026/0045",
        department: "Civil Engineering",
        companyName: "BuildCo Ltd",
        industrySupervisorId,
        institutionalSupervisorId,
      }),
    });
    const studentRes = await registerStudentResponse.json() as any;
    const studentToken = studentRes.token;
    const studentUserId = studentRes.user.id;

    console.log("✅ Users registered successfully.");

    // --------------------------------------------------
    // STEP 2: Student Submits Daily Log (PENDING)
    // --------------------------------------------------
    console.log("\nStep 2: Student submits logbook entry...");
    const submitLogResponse = await fetch(`${baseUrl}/student/logbook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        date: "2026-07-07",
        weekNumber: 1,
        dailyDescription: "Completed slump concrete checks.",
        skillsAcquired: "Concrete testing operations.",
      }),
    });
    const logEntry = await submitLogResponse.json() as any;
    if (submitLogResponse.status === 201 && logEntry.approvalStatus === "PENDING") {
      console.log("✅ Log submitted. Status: PENDING.");
    } else {
      throw new Error(`Failed to submit log. Status: ${submitLogResponse.status}`);
    }

    // --------------------------------------------------
    // STEP 3: Industry Supervisor Approves Log
    // --------------------------------------------------
    console.log("\nStep 3: Industry Supervisor approves student log...");
    const verifyLogResponse = await fetch(`${baseUrl}/industry/logbook/${logEntry.id}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${indRes.token}`,
      },
      body: JSON.stringify({
        status: "APPROVED",
        comments: "Good site logs.",
      }),
    });
    const verifyRes = await verifyLogResponse.json() as any;
    if (verifyLogResponse.status === 200 && verifyRes.entry.approvalStatus === "APPROVED") {
      console.log("✅ Log verified successfully. Status changed to APPROVED.");
    } else {
      throw new Error(`Failed to verify log. Status: ${verifyLogResponse.status}`);
    }

    // --------------------------------------------------
    // STEP 4: Student Uploads Final Report
    // --------------------------------------------------
    console.log("\nStep 4: Student uploads technical report...");
    const submitReportResponse = await fetch(`${baseUrl}/student/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        pdfUrl: "siwes_final_report.pdf",
      }),
    });
    const reportRes = await submitReportResponse.json() as any;
    const reportId = reportRes.report.id;
    if (submitReportResponse.status === 200) {
      console.log("✅ Technical report uploaded successfully.");
    } else {
      throw new Error(`Failed to upload report. Status: ${submitReportResponse.status}`);
    }

    // --------------------------------------------------
    // STEP 5: Institutional Supervisor Attempts to Grade (Should Fail < 12 weeks)
    // --------------------------------------------------
    console.log("\nStep 5: Institutional Supervisor attempts grading (Expected rejection < 12 weeks)...");
    const gradeFailResponse = await fetch(`${baseUrl}/institutional/report/${reportId}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instRes.token}`,
      },
      body: JSON.stringify({
        grade: 85,
        feedback: "Great report presentation.",
      }),
    });
    const gradeFailRes = await gradeFailResponse.json() as any;
    if (gradeFailResponse.status === 400 && gradeFailRes.error.includes("12 weeks are required")) {
      console.log("✅ Blocked successfully! Rejection message:", gradeFailRes.error);
    } else {
      throw new Error(`Expected 400 rejection, but got status: ${gradeFailResponse.status}`);
    }

    // --------------------------------------------------
    // STEP 6: Seed remaining 11 weeks of logbook entries
    // --------------------------------------------------
    console.log("\nStep 6: Simulating student completing remaining 11 weeks of logs...");
    for (let w = 2; w <= 12; w++) {
      db.logbookEntries.push({
        id: `log-seed-${w}`,
        studentId: studentUserId,
        date: new Date(`2026-07-${7 + w}`),
        weekNumber: w,
        dailyDescription: `Completed training activities for week ${w}`,
        skillsAcquired: `Refined skills in week ${w}`,
        approvalStatus: "APPROVED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log("✅ Seeded logs. Total distinct weeks recorded:", new Set(db.logbookEntries.map((l) => l.weekNumber)).size);

    // --------------------------------------------------
    // STEP 7: Institutional Supervisor Grades Report again (Should Succeed)
    // --------------------------------------------------
    console.log("\nStep 7: Institutional Supervisor grading report again (Expected success)...");
    const gradeSuccessResponse = await fetch(`${baseUrl}/institutional/report/${reportId}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instRes.token}`,
      },
      body: JSON.stringify({
        grade: 90,
        feedback: "Excellent logs and full 12 weeks representation.",
      }),
    });
    const gradeSuccessRes = await gradeSuccessResponse.json() as any;
    if (gradeSuccessResponse.status === 200 && gradeSuccessRes.report.academicGrade === 90) {
      console.log("✅ Grade submitted successfully. Grade recorded:", gradeSuccessRes.report.academicGrade);
    } else {
      throw new Error(`Failed to grade report. Status: ${gradeSuccessResponse.status}`);
    }

  } catch (err: any) {
    console.log(`❌ E2E LOOP FAILED: ${err.message}`);
    passed = false;
  }

  console.log("\n==================================================");
  if (passed) {
    console.log("🎉 ALL E2E LOOP TRANSITIONS PASSED SUCCESSFULLY!");
    server.close(() => {
      process.exit(0);
    });
  } else {
    console.log("🚨 E2E TRANSITION TESTING ENCOUNTERED ERRORS.");
    server.close(() => {
      process.exit(1);
    });
  }
}
