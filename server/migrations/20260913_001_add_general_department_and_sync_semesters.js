const mongoose = require("mongoose");

/**
 * Migration: 20260913_001_add_general_department_and_sync_semesters
 * 
 * 1. Synchronizes existing students:
 *    - For students in Semester 1 & 2:
 *      Sets primaryDepartment = current department,
 *      transitions operational department to "General Department",
 *      and sets isGeneralDepartment = true.
 *    - For students in Semester >= 3:
 *      Sets primaryDepartment = current department,
 *      and sets isGeneralDepartment = false.
 *    - Synchronizes linked User documents.
 * 2. Re-creates the MongoDB View 'view_department_students' to project
 *    primaryDepartment and isGeneralDepartment fields.
 */
module.exports = {
  name: "20260913_001_add_general_department_and_sync_semesters",

  async up() {
    const db = mongoose.connection.db;
    const studentsCollection = db.collection("students");
    const usersCollection = db.collection("users");

    console.log("   ↳ Step 1: Synchronizing existing student departments for Semester 1 & 2...");

    const allStudents = await studentsCollection.find({}).toArray();
    let updatedSem12Count = 0;
    let updatedSem3PlusCount = 0;

    for (const student of allStudents) {
      const sem = Number(student.semester) || 1;
      const originalBranch = student.primaryDepartment || student.department || "Computer Engineering";

      if (sem < 3) {
        // Semester 1 & 2: assign to General Department, preserving primary branch
        await studentsCollection.updateOne(
          { _id: student._id },
          {
            $set: {
              primaryDepartment: originalBranch,
              department: "General Department",
              isGeneralDepartment: true
            }
          }
        );

        if (student.user) {
          await usersCollection.updateOne(
            { _id: student.user },
            {
              $set: {
                primaryDepartment: originalBranch,
                department: "General Department",
                isGeneralDepartment: true
              },
              $addToSet: { roles: "general_department_student" }
            }
          );
        }
        updatedSem12Count++;
      } else {
        // Semester 3+: belongs to primary branch
        await studentsCollection.updateOne(
          { _id: student._id },
          {
            $set: {
              primaryDepartment: originalBranch,
              department: originalBranch,
              isGeneralDepartment: false
            }
          }
        );

        if (student.user) {
          await usersCollection.updateOne(
            { _id: student.user },
            {
              $set: {
                primaryDepartment: originalBranch,
                department: originalBranch,
                isGeneralDepartment: false
              },
              $pull: { roles: "general_department_student" }
            }
          );
        }
        updatedSem3PlusCount++;
      }
    }

    console.log(`   ↳ Assigned ${updatedSem12Count} Sem 1 & 2 students to 'General Department'.`);
    console.log(`   ↳ Preserved ${updatedSem3PlusCount} Sem 3+ students in their primary departments.`);

    // Step 2: Drop and recreate MongoDB Database View: view_department_students
    const existingCollections = await db
      .listCollections({ name: "view_department_students" })
      .toArray();

    if (existingCollections.length > 0) {
      await db.collection("view_department_students").drop();
    }

    await db.createCollection("view_department_students", {
      viewOn: "students",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        {
          $unwind: {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            studentId: "$_id",
            userId: "$user",
            fullName: 1,
            admissionNo: 1,
            regNo: 1,
            department: 1,
            primaryDepartment: { $ifNull: ["$primaryDepartment", "$department"] },
            isGeneralDepartment: { $ifNull: ["$isGeneralDepartment", false] },
            programme: 1,
            semester: 1,
            batch: 1,
            section: 1,
            academicYear: 1,
            attendancePercentage: { $ifNull: ["$attendancePercentage", 100] },
            email: "$userInfo.email",
            phoneNumber: "$userInfo.phoneNumber",
            profilePhoto: "$userInfo.profilePhoto",
            userStatus: "$userInfo.status",
            created_at: "$createdAt",
            updated_at: "$updatedAt"
          }
        }
      ]
    });

    console.log("   ↳ Updated MongoDB Database View: 'view_department_students' with primaryDepartment & isGeneralDepartment");

    return {
      migrationName: "20260913_001_add_general_department_and_sync_semesters",
      updatedSem12Count,
      updatedSem3PlusCount,
      viewUpdated: true
    };
  },

  async down() {
    const db = mongoose.connection.db;
    const studentsCollection = db.collection("students");
    const usersCollection = db.collection("users");

    console.log("   ↳ Rolling back General Department assignment...");

    // Revert students assigned to General Department back to primaryDepartment
    const generalStudents = await studentsCollection.find({ isGeneralDepartment: true }).toArray();

    for (const student of generalStudents) {
      const originalBranch = student.primaryDepartment || student.department;
      await studentsCollection.updateOne(
        { _id: student._id },
        {
          $set: {
            department: originalBranch,
            isGeneralDepartment: false
          }
        }
      );

      if (student.user) {
        await usersCollection.updateOne(
          { _id: student.user },
          {
            $set: {
              department: originalBranch,
              isGeneralDepartment: false
            },
            $pull: { roles: "general_department_student" }
          }
        );
      }
    }

    // Recreate previous view definition without primaryDepartment / isGeneralDepartment
    const existingCollections = await db
      .listCollections({ name: "view_department_students" })
      .toArray();

    if (existingCollections.length > 0) {
      await db.collection("view_department_students").drop();
    }

    await db.createCollection("view_department_students", {
      viewOn: "students",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        {
          $unwind: {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            studentId: "$_id",
            userId: "$user",
            fullName: 1,
            admissionNo: 1,
            regNo: 1,
            department: 1,
            programme: 1,
            semester: 1,
            batch: 1,
            section: 1,
            academicYear: 1,
            attendancePercentage: { $ifNull: ["$attendancePercentage", 100] },
            email: "$userInfo.email",
            phoneNumber: "$userInfo.phoneNumber",
            profilePhoto: "$userInfo.profilePhoto",
            userStatus: "$userInfo.status",
            created_at: "$createdAt",
            updated_at: "$updatedAt"
          }
        }
      ]
    });

    console.log("   ↳ Rolled back MongoDB Database View: 'view_department_students'");

    return {
      migrationName: "20260913_001_add_general_department_and_sync_semesters",
      revertedCount: generalStudents.length
    };
  }
};
