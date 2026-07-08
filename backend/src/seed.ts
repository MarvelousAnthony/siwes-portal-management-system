import bcrypt from "bcrypt";
import prisma from "./services/db";
import { Role } from "@prisma/client";

async function main() {
  console.log("🌱 Start seeding SIWES database...");



  const passwordHash = await bcrypt.hash("password", 10);

  // 2. Create Industry Supervisor
  const industrySupervisor = await prisma.user.create({
    data: {
      email: "industry@siwes.com",
      passwordHash,
      role: Role.INDUSTRY_SUPERVISOR,
      firstName: "Tunde",
      lastName: "Bello",
      phoneNumber: "+2348031234567",
    },
  });
  console.log(`✅ Created Industry Supervisor: ${industrySupervisor.email}`);

  // 3. Create Institutional Supervisor
  const instSupervisor = await prisma.user.create({
    data: {
      email: "inst@siwes.com",
      passwordHash,
      role: Role.INSTITUTIONAL_SUPERVISOR,
      firstName: "Helen",
      lastName: "Alabi",
      phoneNumber: "+2348029876543",
    },
  });
  console.log(`✅ Created Institutional Supervisor: ${instSupervisor.email}`);

  // 4. Create Student User & Profile
  const studentUser = await prisma.user.create({
    data: {
      email: "student@siwes.com",
      passwordHash,
      role: Role.STUDENT,
      firstName: "Adebayo",
      lastName: "Oyelowo",
      phoneNumber: "+2348055554444",
    },
  });

  const studentProfile = await prisma.studentProfile.create({
    data: {
      studentId: studentUser.id,
      matricNumber: "CVE/2026/0045",
      department: "Civil Engineering",
      companyName: "BuildCo Infrastructures Ltd",
      companyAddress: "Plot 12, Industrial Layout, Ikeja, Lagos",
      institutionalSupervisorId: instSupervisor.id,
      industrySupervisorId: industrySupervisor.id,
    },
  });
  console.log(`✅ Created Student User: ${studentUser.email} and Profile: ${studentProfile.matricNumber}`);

  // 5. Pre-seed a few logbook entries so supervisors have data initially
  await prisma.logbookEntry.create({
    data: {
      studentId: studentUser.id,
      date: new Date("2026-07-06"),
      weekNumber: 1,
      dailyDescription: "Attended safety induction site tour. Verified structural layout blueprints.",
      departmentSection: "Structural Site Operations",
      skillsAcquired: "Blueprint analysis, site safety procedures",
      approvalStatus: "PENDING",
    },
  });

  console.log("🌱 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
