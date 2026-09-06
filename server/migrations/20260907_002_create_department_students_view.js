const mongoose = require("mongoose");

/**
 * Migration: Create MongoDB View for Department Students
 * Consolidates student profile information with user account details into a read-only database view.
 */
module.exports = {
  name: "20260907_002_create_department_students_view",

  async up() {
    const db = mongoose.connection.db;

    // Drop existing view if it already exists to ensure fresh pipeline
    const existingCollections = await db
      .listCollections({ name: "view_department_students" })
      .toArray();

    if (existingCollections.length > 0) {
      await db.collection("view_department_students").drop();
    }

    // Create MongoDB View joining students with users
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

    console.log("   ↳ Created MongoDB Database View: 'view_department_students'");

    return {
      migrationName: "20260907_002_create_department_students_view",
      totalClaimsUpserted: 1,
      controllers: ["view_department_students"]
    };
  },

  async down() {
    const db = mongoose.connection.db;
    const existingCollections = await db
      .listCollections({ name: "view_department_students" })
      .toArray();

    if (existingCollections.length > 0) {
      await db.collection("view_department_students").drop();
      console.log("   ↳ Dropped MongoDB Database View: 'view_department_students'");
    }

    return {
      migrationName: "20260907_002_create_department_students_view",
      deletedCount: 1,
      controllers: ["view_department_students"]
    };
  }
};
