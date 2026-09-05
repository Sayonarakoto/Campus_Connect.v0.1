const mongoose =
  require("mongoose");

const AttendanceSchema =
  new mongoose.Schema(
    {
      student: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
      },

      workingDays: {
        type: Number,
        default: 0
      },

      attendedDays: {
        type: Number,
        default: 0
      },

      attendancePercentage: {
        type: Number,
        default: 0
      },

      batchMonth: {
        type: String
      },

      enteredBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.models.Attendance ||
  mongoose.model(
    "Attendance",
    AttendanceSchema
  );