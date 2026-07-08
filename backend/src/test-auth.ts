import jwt from "jsonwebtoken";
import prisma from "./services/db";

// ==========================================
// 1. Mock Prisma Client DB Layer (Require Cache hijacking)
// ==========================================
(prisma.logbookEntry as any).findMany = async (args: any): Promise<any> => {
  return [{ id: "mock-log-1", dailyDescription: "Successfully accessed student logbook" }];
};

(prisma.studentProfile as any).findMany = async (args: any): Promise<any> => {
  return [{ id: "mock-profile-1", studentId: "student-1", matricNumber: "MAT-123" }];
};

// ==========================================
// 2. Set Env & Boot Express App
// ==========================================
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret-key-at-least-32-characters-long";
import app from "./index";

const TEST_PORT = 4001;
const server = app.listen(TEST_PORT, () => {
  console.log(`🧪 Test Server running on port ${TEST_PORT}`);
  runTests();
});

// ==========================================
// 3. Test Cases Implementation
// ==========================================
async function runTests() {
  let passed = true;
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  // Generate mock JWTs
  const secret = process.env.NEXTAUTH_SECRET!;
  const studentToken = jwt.sign({ id: "student-user-id", email: "student@siwes.com", role: "STUDENT" }, secret);
  const industryToken = jwt.sign({ id: "ind-user-id", email: "industry@siwes.com", role: "INDUSTRY_SUPERVISOR" }, secret);
  const instToken = jwt.sign({ id: "inst-user-id", email: "inst@siwes.com", role: "INSTITUTIONAL_SUPERVISOR" }, secret);

  const testCases = [
    {
      name: "Case 1: Access Student Logbook without Token (Expect 401)",
      url: `${baseUrl}/student/logbook`,
      headers: {},
      expectedStatus: 401,
    },
    {
      name: "Case 2: Access Student Logbook with Invalid Token (Expect 401)",
      url: `${baseUrl}/student/logbook`,
      headers: { Authorization: "Bearer invalid-token-string" },
      expectedStatus: 401,
    },
    {
      name: "Case 3: Access Student Logbook with Industry Supervisor Token (Expect 403)",
      url: `${baseUrl}/student/logbook`,
      headers: { Authorization: `Bearer ${industryToken}` },
      expectedStatus: 403,
    },
    {
      name: "Case 4: Access Student Logbook with Student Token (Expect 200)",
      url: `${baseUrl}/student/logbook`,
      headers: { Authorization: `Bearer ${studentToken}` },
      expectedStatus: 200,
    },
    {
      name: "Case 5: Access Industry Students with Student Token (Expect 403)",
      url: `${baseUrl}/industry/students`,
      headers: { Authorization: `Bearer ${studentToken}` },
      expectedStatus: 403,
    },
    {
      name: "Case 6: Access Industry Students with Industry Supervisor Token (Expect 200)",
      url: `${baseUrl}/industry/students`,
      headers: { Authorization: `Bearer ${industryToken}` },
      expectedStatus: 200,
    },
    {
      name: "Case 7: Access Institutional Students with Student Token (Expect 403)",
      url: `${baseUrl}/institutional/students`,
      headers: { Authorization: `Bearer ${studentToken}` },
      expectedStatus: 403,
    },
    {
      name: "Case 8: Access Institutional Students with Institutional Supervisor Token (Expect 200)",
      url: `${baseUrl}/institutional/students`,
      headers: { Authorization: `Bearer ${instToken}` },
      expectedStatus: 200,
    },
  ];

  console.log("\n==================================================");
  console.log("🚦 STARTING INTEGRATION TESTS FOR ROLE-BASED AUTH");
  console.log("==================================================\n");

  for (const tc of testCases) {
    try {
      const response = await fetch(tc.url, {
        method: "GET",
        headers: tc.headers as Record<string, string>,
      });

      const responseBody = await response.json().catch(() => ({}));

      if (response.status === tc.expectedStatus) {
        console.log(`✅ PASSED: ${tc.name}`);
      } else {
        console.log(`❌ FAILED: ${tc.name}`);
        console.log(`   - Expected status: ${tc.expectedStatus}, got: ${response.status}`);
        console.log(`   - Response:`, responseBody);
        passed = false;
      }
    } catch (err: any) {
      console.log(`❌ FAILED: ${tc.name}`);
      console.log(`   - Error:`, err.message);
      passed = false;
    }
  }

  console.log("\n==================================================");
  if (passed) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! AUTH MIDDLEWARE VALIDATED.");
    server.close(() => {
      process.exit(0);
    });
  } else {
    console.log("🚨 SOME TESTS FAILED. CHECK LOGS AND CORRECT MIDDLEWARE ISSUES.");
    server.close(() => {
      process.exit(1);
    });
  }
}
