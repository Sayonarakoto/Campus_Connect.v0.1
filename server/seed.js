// server/seed.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Student = require("./models/Student");
const Permission = require("./models/Permission");
const { DEFAULT_PERMISSIONS } = require("./controllers/permissionController");
const { getCurrentAcademicYear } = require("./constants/academicConfig");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus_connect";
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "password123";

/**
 * Minimal Production/Testing Seed Configuration
 * Exactly:
 *  - 1 Super Admin ('luka')
 *  - 2 Principals
 *  - 1 HOD
 *  - 2 Faculty
 *  - 1 HR & Accounts
 *  - 2 Parents
 *  - 2 Students (linked to parents)
 */
async function seedDatabase() {
  console.log("=================================================");
  console.log("🚀 CAMPUS CONNECT - PRODUCTION/TEST SEED INITIALIZATION");
  console.log("=================================================");
  console.log(`Connecting to MongoDB: ${MONGO_URI.replace(/:([^@]+)@/, ":****@")}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected Successfully.");

    console.log(`🔑 Hashing default password ('${DEFAULT_PASSWORD}') with bcrypt...`);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log("✅ Password hashed successfully.");

    const stats = {
      usersCreated: 0,
      usersUpdated: 0,
      studentsCreated: 0,
      studentsUpdated: 0
    };

    const summaryTable = [];

    // =============================================================
    // 1. SEED MASTER SUPER ADMIN ACCOUNT (LUKA)
    // =============================================================
    console.log("\n🛡️ Bootstrapping Master Super Administrator account...");
    const adminUsername = process.env.ADMIN_SEED_USERNAME || "luka";
    const adminEmail = process.env.ADMIN_SEED_EMAIL || "luka@college.edu";
    const adminRawPassword = process.env.ADMIN_SEED_PASSWORD || "zxcqwrzxc";
    const hashedAdminPassword = await bcrypt.hash(adminRawPassword, 10);

    let adminUser = await User.findOne({
      $or: [
        { email: adminEmail.toLowerCase() },
        { "customData.username": adminUsername },
        { "customData.staffId": adminUsername }
      ]
    });

    const adminPayload = {
      role: "admin",
      roles: ["admin"],
      fullName: "System Super Administrator",
      email: adminEmail.toLowerCase(),
      phoneNumber: "9998887770",
      password: hashedAdminPassword,
      customData: {
        username: adminUsername,
        staffId: adminUsername,
        adminClearanceLevel: "SuperAdmin"
      }
    };

    if (!adminUser) {
      adminUser = await User.create(adminPayload);
      stats.usersCreated++;
      console.log(`✅ Super Admin '${adminUsername}' created.`);
    } else {
      Object.assign(adminUser, adminPayload);
      await adminUser.save();
      stats.usersUpdated++;
      console.log(`✅ Super Admin '${adminUsername}' updated.`);
    }

    summaryTable.push({
      Role: "Super Admin",
      Name: adminPayload.fullName,
      "Login Identifier": adminUsername,
      Email: adminEmail,
      Phone: adminPayload.phoneNumber,
      Details: "SuperAdmin Clearance"
    });

    // =============================================================
    // 2. SEED 2 PRINCIPALS
    // =============================================================
    console.log("\n🏛️ Seeding 2 Principals...");
    const principalConfigs = [
      {
        fullName: "Dr. Alexander Wright",
        email: "principal1@college.edu",
        employeeId: "PRI1001",
        phoneNumber: "9876500001",
        designation: "Principal"
      },
      {
        fullName: "Dr. Beatrice Evans",
        email: "principal2@college.edu",
        employeeId: "PRI1002",
        phoneNumber: "9876500002",
        designation: "Vice Principal"
      }
    ];

    for (const pConfig of principalConfigs) {
      let principalUser = await User.findOne({
        $or: [
          { email: pConfig.email.toLowerCase() },
          { "customData.employeeId": pConfig.employeeId }
        ]
      });

      const pPayload = {
        role: "principal",
        roles: ["principal"],
        fullName: pConfig.fullName,
        email: pConfig.email.toLowerCase(),
        phoneNumber: pConfig.phoneNumber,
        dateOfJoining: new Date("2018-05-15"),
        password: hashedPassword,
        customData: {
          employeeId: pConfig.employeeId,
          designation: pConfig.designation
        }
      };

      if (!principalUser) {
        principalUser = await User.create(pPayload);
        stats.usersCreated++;
      } else {
        Object.assign(principalUser, pPayload);
        await principalUser.save();
        stats.usersUpdated++;
      }

      summaryTable.push({
        Role: "Principal",
        Name: pConfig.fullName,
        "Login Identifier": pConfig.employeeId,
        Email: pConfig.email,
        Phone: pConfig.phoneNumber,
        Details: pConfig.designation
      });
    }

    // =============================================================
    // 3. SEED 1 HOD
    // =============================================================
    console.log("\n👨‍🏫 Seeding 1 Head of Department (HOD)...");
    const hodConfig = {
      fullName: "Dr. Robert Vance",
      email: "hod.comp@college.edu",
      department: "Computer Engineering",
      employeeId: "HOD2001",
      phoneNumber: "9876520001"
    };

    let hodUser = await User.findOne({
      $or: [
        { email: hodConfig.email.toLowerCase() },
        { "customData.employeeId": hodConfig.employeeId }
      ]
    });

    const hodPayload = {
      role: "hod",
      roles: ["hod"],
      fullName: hodConfig.fullName,
      department: hodConfig.department,
      email: hodConfig.email.toLowerCase(),
      phoneNumber: hodConfig.phoneNumber,
      dateOfJoining: new Date("2019-07-01"),
      password: hashedPassword,
      customData: {
        employeeId: hodConfig.employeeId
      }
    };

    if (!hodUser) {
      hodUser = await User.create(hodPayload);
      stats.usersCreated++;
    } else {
      Object.assign(hodUser, hodPayload);
      await hodUser.save();
      stats.usersUpdated++;
    }

    summaryTable.push({
      Role: "HOD",
      Name: hodConfig.fullName,
      "Login Identifier": hodConfig.employeeId,
      Email: hodConfig.email,
      Phone: hodConfig.phoneNumber,
      Details: hodConfig.department
    });

    // =============================================================
    // 4. SEED 2 FACULTY MEMBERS
    // =============================================================
    console.log("\n🧑‍🏫 Seeding 2 Faculty Members...");
    const facultyConfigs = [
      {
        fullName: "Prof. Sarah Connor",
        email: "faculty1.comp@college.edu",
        department: "Computer Engineering",
        employeeId: "FAC2001",
        phoneNumber: "9876520011",
        isLabStaff: false
      },
      {
        fullName: "Prof. James Miller",
        email: "faculty2.mech@college.edu",
        department: "Mechanical Engineering",
        employeeId: "FAC1001",
        phoneNumber: "9876510012",
        isLabStaff: false
      }
    ];

    for (const fConfig of facultyConfigs) {
      let facUser = await User.findOne({
        $or: [
          { email: fConfig.email.toLowerCase() },
          { "customData.employeeId": fConfig.employeeId }
        ]
      });

      const facPayload = {
        role: "faculty",
        roles: ["faculty"],
        fullName: fConfig.fullName,
        department: fConfig.department,
        email: fConfig.email.toLowerCase(),
        phoneNumber: fConfig.phoneNumber,
        dateOfJoining: new Date("2021-08-15"),
        password: hashedPassword,
        isLabStaff: fConfig.isLabStaff,
        customData: {
          employeeId: fConfig.employeeId
        }
      };

      if (!facUser) {
        facUser = await User.create(facPayload);
        stats.usersCreated++;
      } else {
        Object.assign(facUser, facPayload);
        await facUser.save();
        stats.usersUpdated++;
      }

      summaryTable.push({
        Role: "Faculty",
        Name: fConfig.fullName,
        "Login Identifier": fConfig.employeeId,
        Email: fConfig.email,
        Phone: fConfig.phoneNumber,
        Details: fConfig.department
      });
    }

    // =============================================================
    // 5. SEED 1 HR & ACCOUNTS OFFICER
    // =============================================================
    console.log("\n🏢 Seeding 1 HR & Accounts Officer...");
    const hrConfig = {
      fullName: "Institutional Accounts & HR Officer",
      email: "hraccounts@college.edu",
      staffId: "HRACC1001",
      staffRole: "HR & Accounts",
      phoneNumber: "9876543210"
    };

    let hrUser = await User.findOne({
      $or: [
        { email: hrConfig.email.toLowerCase() },
        { "customData.staffId": hrConfig.staffId }
      ]
    });

    const hrPayload = {
      role: "hraccounts",
      roles: ["hraccounts"],
      fullName: hrConfig.fullName,
      email: hrConfig.email.toLowerCase(),
      phoneNumber: hrConfig.phoneNumber,
      dateOfJoining: new Date("2020-01-15"),
      password: hashedPassword,
      customData: {
        staffId: hrConfig.staffId,
        staffRole: hrConfig.staffRole
      }
    };

    if (!hrUser) {
      hrUser = await User.create(hrPayload);
      stats.usersCreated++;
    } else {
      Object.assign(hrUser, hrPayload);
      await hrUser.save();
      stats.usersUpdated++;
    }

    summaryTable.push({
      Role: "HR & Accounts",
      Name: hrConfig.fullName,
      "Login Identifier": hrConfig.staffId,
      Email: hrConfig.email,
      Phone: hrConfig.phoneNumber,
      Details: hrConfig.staffRole
    });

    // =============================================================
    // 6. SEED 2 PARENTS
    // =============================================================
    console.log("\n👨‍👩‍👧 Seeding 2 Parents...");
    const parentConfigs = [
      {
        fullName: "David Miller",
        email: "parent.miller@example.com",
        phoneNumber: "9876590001",
        studentAdmissionNo: "1001"
      },
      {
        fullName: "Grace Hopper",
        email: "parent.hopper@example.com",
        phoneNumber: "9876590002",
        studentAdmissionNo: "2001"
      }
    ];

    const parentUserMap = {};

    for (const pConfig of parentConfigs) {
      let parentUser = await User.findOne({ email: pConfig.email.toLowerCase() });

      const parentPayload = {
        role: "parent",
        roles: ["parent"],
        fullName: pConfig.fullName,
        email: pConfig.email.toLowerCase(),
        phoneNumber: pConfig.phoneNumber,
        password: hashedPassword,
        customData: {
          studentAdmissionNo: pConfig.studentAdmissionNo
        }
      };

      if (!parentUser) {
        parentUser = await User.create(parentPayload);
        stats.usersCreated++;
      } else {
        Object.assign(parentUser, parentPayload);
        await parentUser.save();
        stats.usersUpdated++;
      }

      parentUserMap[pConfig.studentAdmissionNo] = parentUser;

      summaryTable.push({
        Role: "Parent",
        Name: pConfig.fullName,
        "Login Identifier": pConfig.email,
        Email: pConfig.email,
        Phone: pConfig.phoneNumber,
        Details: `Child Adm: ${pConfig.studentAdmissionNo}`
      });
    }

    // =============================================================
    // 7. SEED 2 STUDENTS (LINKED TO PARENTS)
    // =============================================================
    console.log("\n🎓 Seeding 2 Students (General Department Sem 1)...");
    const currentAcademicYear = getCurrentAcademicYear();

    const studentConfigs = [
      {
        admissionNo: "1001",
        regNo: "2101001001",
        fullName: "Thomas Miller",
        email: "student.thomas@college.edu",
        phoneNumber: "9876510001",
        primaryDepartment: "Mechanical Engineering",
        section: "Mech-A",
        semester: 1,
        batchYear: "2024-2027",
        parentEmail: "parent.miller@example.com"
      },
      {
        admissionNo: "2001",
        regNo: "2101002001",
        fullName: "Ada Hopper",
        email: "student.ada@college.edu",
        phoneNumber: "9876520002",
        primaryDepartment: "Computer Engineering",
        section: null,
        semester: 1,
        batchYear: "2024-2027",
        parentEmail: "parent.hopper@example.com"
      }
    ];

    for (const sConfig of studentConfigs) {
      let studentUser = await User.findOne({
        $or: [
          { email: sConfig.email.toLowerCase() },
          { "customData.admissionNo": sConfig.admissionNo }
        ]
      });

      const userPayload = {
        role: "student",
        roles: ["student", "general_department_student"],
        fullName: sConfig.fullName,
        department: "General Department",
        primaryDepartment: sConfig.primaryDepartment,
        isGeneralDepartment: true,
        section: sConfig.section,
        email: sConfig.email.toLowerCase(),
        phoneNumber: sConfig.phoneNumber,
        password: hashedPassword,
        customData: {
          admissionNo: sConfig.admissionNo,
          regNo: sConfig.regNo,
          semester: sConfig.semester,
          batchYear: sConfig.batchYear,
          section: sConfig.section,
          parentEmail: sConfig.parentEmail
        }
      };

      if (!studentUser) {
        studentUser = await User.create(userPayload);
        stats.usersCreated++;
      } else {
        Object.assign(studentUser, userPayload);
        await studentUser.save();
        stats.usersUpdated++;
      }

      // Find parent user to link
      const parentUser = parentUserMap[sConfig.admissionNo] || await User.findOne({
        email: sConfig.parentEmail.toLowerCase(),
        role: "parent"
      });

      let studentProfile = await Student.findOne({
        $or: [{ user: studentUser._id }, { admissionNo: sConfig.admissionNo }]
      });

      const studentData = {
        user: studentUser._id,
        fullName: sConfig.fullName,
        admissionNo: sConfig.admissionNo,
        regNo: sConfig.regNo,
        department: "General Department",
        primaryDepartment: sConfig.primaryDepartment,
        isGeneralDepartment: true,
        semester: sConfig.semester,
        academicYear: currentAcademicYear,
        batch: sConfig.batchYear,
        section: sConfig.section,
        parentEmail: sConfig.parentEmail,
        parent: parentUser ? parentUser._id : null
      };

      if (!studentProfile) {
        await Student.create(studentData);
        stats.studentsCreated++;
      } else {
        Object.assign(studentProfile, studentData);
        await studentProfile.save();
        stats.studentsUpdated++;
      }

      summaryTable.push({
        Role: "Student",
        Name: sConfig.fullName,
        "Login Identifier": sConfig.admissionNo,
        Email: sConfig.email,
        Phone: sConfig.phoneNumber,
        Details: `${sConfig.primaryDepartment} (Sem ${sConfig.semester}, ${sConfig.section || "No Sec"})`
      });
    }

    // =============================================================
    // 8. SEED DYNAMIC PERMISSIONS MATRIX
    // =============================================================
    console.log("\n🛡️ Seeding Dynamic Permissions Matrix...");
    let permCount = 0;
    for (const perm of DEFAULT_PERMISSIONS) {
      await Permission.findOneAndUpdate(
        { role: perm.role, controller: perm.controller },
        { $set: perm },
        { upsert: true, new: true }
      );
      permCount++;
    }
    console.log(`✅ Seeded ${permCount} dynamic controller permission rules.`);

    // Print summary
    console.log("\n=================================================");
    console.log("📊 SEEDING SUMMARY MATRIX");
    console.log("=================================================");
    console.table(summaryTable);

    console.log("\n=================================================");
    console.log("📈 EXECUTION STATISTICS");
    console.log("=================================================");
    console.log(`Users Created:    ${stats.usersCreated}`);
    console.log(`Users Updated:    ${stats.usersUpdated}`);
    console.log(`Students Created: ${stats.studentsCreated}`);
    console.log(`Students Updated: ${stats.studentsUpdated}`);
    console.log(`Universal Default Password: '${DEFAULT_PASSWORD}'`);
    console.log(`Admin Password:             '${adminRawPassword}'`);
    console.log("=================================================\n");

  } catch (error) {
    console.error("❌ SEED ERROR:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔒 MongoDB Connection Closed.");
  }
}

// Execute if invoked directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
