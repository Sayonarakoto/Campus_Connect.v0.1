// server/seed.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Student = require("./models/Student");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus_connect";
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "password123";

/**
 * College Department Definitions
 */
const DEPARTMENTS = [
  {
    name: "Mechanical Engineering",
    code: "MECH",
    prefix: 10,
    hasSections: true
  },
  {
    name: "Computer Engineering",
    code: "COMP",
    prefix: 20,
    hasSections: false
  },
  {
    name: "Automobile Engineering",
    code: "AUTO",
    prefix: 30,
    hasSections: false
  },
  {
    name: "Electrical and Electronics Engineering",
    code: "EEE",
    prefix: 40,
    hasSections: false
  },
  {
    name: "Civil Engineering",
    code: "CIVIL",
    prefix: 50,
    hasSections: false
  },
  {
    name: "Fire Technology and Safety",
    code: "FTS",
    prefix: 60,
    hasSections: false
  }
];

/**
 * Main Seeding Function
 */
async function seedDatabase() {
  console.log("=================================================");
  console.log("🚀 CAMPUS CONNECT - DATABASE SEED INITIALIZATION");
  console.log("=================================================");
  console.log(`Connecting to MongoDB: ${MONGO_URI}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected Successfully.");

    // Pre-hash default password
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

    for (const dept of DEPARTMENTS) {
      console.log(`\n📚 Processing Department: ${dept.name} (${dept.code})`);

      // -------------------------------------------------------------
      // 1. CREATE 1 HOD
      // -------------------------------------------------------------
      const hodEmail = `hod.${dept.code.toLowerCase()}@college.edu`;
      const hodId = `HOD${dept.prefix * 100 + 1}`;
      let hodUser = await User.findOne({ email: hodEmail });

      const hodPayload = {
        role: "hod",
        fullName: `Dr. ${dept.code} HOD`,
        department: dept.name,
        section: null,
        email: hodEmail,
        password: hashedPassword,
        isLabStaff: false,
        customData: {
          employeeId: hodId,
          department: dept.name
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
        Department: dept.code,
        Role: "HOD",
        Name: hodPayload.fullName,
        "Login ID (Faculty ID)": hodId,
        Email: hodEmail,
        "Lab Staff": "No"
      });

      // -------------------------------------------------------------
      // 2. CREATE 2 FACULTY MEMBERS (isLabStaff = false)
      // -------------------------------------------------------------
      for (let f = 1; f <= 2; f++) {
        const facultyEmail = `faculty.${dept.code.toLowerCase()}${f}@college.edu`;
        const facultyId = `FAC${dept.prefix * 100 + f}`;
        let facUser = await User.findOne({ email: facultyEmail });

        const facPayload = {
          role: "faculty",
          fullName: `Prof. ${dept.code} Faculty ${f}`,
          department: dept.name,
          section: null,
          email: facultyEmail,
          password: hashedPassword,
          isLabStaff: false,
          customData: {
            employeeId: facultyId,
            department: dept.name
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
          Department: dept.code,
          Role: "Faculty",
          Name: facPayload.fullName,
          "Login ID (Faculty ID)": facultyId,
          Email: facultyEmail,
          "Lab Staff": "No"
        });
      }

      // -------------------------------------------------------------
      // 3. CREATE 2 LAB STAFF (isLabStaff = true)
      // -------------------------------------------------------------
      for (let l = 1; l <= 2; l++) {
        const labEmail = `lab.${dept.code.toLowerCase()}${l}@college.edu`;
        const labId = `LAB${dept.prefix * 100 + l}`;
        let labUser = await User.findOne({ email: labEmail });

        const labPayload = {
          role: "faculty",
          fullName: `Lab Instructor ${dept.code} ${l}`,
          department: dept.name,
          section: null,
          email: labEmail,
          password: hashedPassword,
          isLabStaff: true,
          customData: {
            employeeId: labId,
            department: dept.name
          }
        };

        if (!labUser) {
          labUser = await User.create(labPayload);
          stats.usersCreated++;
        } else {
          Object.assign(labUser, labPayload);
          await labUser.save();
          stats.usersUpdated++;
        }

        summaryTable.push({
          Department: dept.code,
          Role: "Faculty (Lab)",
          Name: labPayload.fullName,
          "Login ID (Faculty ID)": labId,
          Email: labEmail,
          "Lab Staff": "Yes"
        });
      }

      // -------------------------------------------------------------
      // 4. CREATE 5 STUDENTS
      // -------------------------------------------------------------
      for (let s = 1; s <= 5; s++) {
        const studentEmail = `student.${dept.code.toLowerCase()}${s}@college.edu`;
        const admissionNo = `${dept.prefix * 100 + s}`; // 4-digit unique string (e.g. 1001..1005)
        const regNo = `210100${dept.prefix * 100 + s}`; // 10-digit unique string (e.g. 2101001001)

        // For Mechanical Engineering, assign Mech-A (1..3) or Mech-B (4..5)
        let studentSection = null;
        if (dept.hasSections) {
          studentSection = s <= 3 ? "Mech-A" : "Mech-B";
        }

        let studentUser = await User.findOne({ email: studentEmail });
        const userPayload = {
          role: "student",
          fullName: `Student ${dept.code} ${s}`,
          department: dept.name,
          section: studentSection,
          email: studentEmail,
          password: hashedPassword,
          isLabStaff: false,
          customData: {
            admissionNo,
            regNo,
            department: dept.name,
            semester: 1,
            batchYear: "2024-2027",
            section: studentSection,
            parentEmail: `parent.${dept.code.toLowerCase()}${s}@example.com`
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

        // Link Student record
        let studentProfile = await Student.findOne({
          $or: [{ user: studentUser._id }, { admissionNo }]
        });

        const studentData = {
          user: studentUser._id,
          fullName: userPayload.fullName,
          admissionNo,
          regNo,
          department: dept.name,
          semester: 1,
          batch: "2024-2027",
          section: studentSection,
          parentEmail: userPayload.customData.parentEmail
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
          Department: dept.code,
          Role: "Student",
          Name: userPayload.fullName,
          "Login ID (Faculty ID)": admissionNo,
          Email: studentEmail,
          "Lab Staff": studentSection || "N/A"
        });
      }
    }

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
    console.log(`Universal Seed Password: '${DEFAULT_PASSWORD}'`);
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
