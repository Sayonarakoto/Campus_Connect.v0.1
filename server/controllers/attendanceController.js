const Attendance =
  require("../models/Attendance");

const Student =
  require("../models/Student");

const AttendanceRecord =
  require("../models/AttendanceRecord");



// ======================
// SAVE ATTENDANCE
// ======================

exports.saveAttendance =
async (req, res) => {

  try {

    const {
      studentId,
      workingDays,
      attendedDays,
      batchMonth
    } = req.body;

    const percentage =
      Number(
        (
          (attendedDays /
            workingDays) *
          100
        ).toFixed(2)
      );

    const attendance =
      await Attendance.create({

        student: studentId,

        workingDays,

        attendedDays,

        attendancePercentage:
          percentage,

        batchMonth,

        enteredBy:
          req.user.id
      });

    await Student.findByIdAndUpdate(
      studentId,
      {
        workingDays,
        attendedDays,
        attendancePercentage:
          percentage
      }
    );

    res.json({
      success: true,
      attendance
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message
    });

  }
};

// ======================
// GET ALL STUDENTS
// ======================

// ======================
// GET STUDENTS OF FACULTY'S DEPARTMENT
// ======================

exports.getStudents = async (req, res) => {

  try {

    const students = await Student.find({

      department: req.user.department

    })
    .select(
      "fullName admissionNo department semester section attendancePercentage academicYear"
    )
    .sort({
      fullName: 1
    });

    res.json({

      success: true,

      students

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};

// ======================
// HISTORY
// ======================

exports.getAttendanceHistory =
async (req, res) => {

  try {

    const history =
      await Attendance.find({
        student:
          req.params.studentId
      })
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      history
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message
    });

  }

};
exports.getSemesterAttendance =
async (req,res)=>{

  const {
    studentId,
    semester
  } = req.params;

  const records =
    await AttendanceRecord.find({
      student: studentId,
      semester
    });

  const total =
    records.length;

  const attended =
    records.filter(
      r =>
        r.status === "present" ||
        r.status === "late_excused"
    ).length;

  const percentage =
    total === 0
      ? 0
      : (
          attended /
          total
        ) * 100;

  res.json({
    total,
    attended,
    percentage
  });
};


exports.markAttendance =
async (req,res)=>{

  try {

    const {
      studentId,
      status,
      date
    } = req.body;

    const student =
      await Student.findById(
        studentId
      );

    if (!student) {
      return res.status(404).json({
        success:false,
        message:"Student not found"
      });
    }

    const record =
await AttendanceRecord.create({

    student: studentId,

    date,

    semester: student.semester,

    academicYear: student.academicYear,

    department: student.department,

    section: student.section,

    hour: req.body.hour,

    status,

    markedBy: req.user.id

});

    res.json({
      success:true,
      record
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

exports.getMonthlyAttendance =
async (req,res)=>{

  try {

    const {
      studentId,
      month,
      year
    } = req.query;

    const start =
      new Date(year, month - 1, 1);

    const end =
      new Date(year, month, 0);

    const records =
      await AttendanceRecord.find({

        student: studentId,

        date: {
          $gte: start,
          $lte: end
        }
      });

    const total =
      records.length;

    const attended =
      records.filter(
        r =>
          r.status === "present" ||
          r.status === "late_excused"
      ).length;

    const percentage =
      total === 0
        ? 0
        : ((attended / total) * 100);

    res.json({
      success:true,
      total,
      attended,
      percentage,
      records
    });

  } catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

exports.getAttendanceSummary =
async (req, res) => {

  try {

    const student =
      await Student.findOne({
        user: req.user.id
      });


    if (!student) {

      return res.status(404).json({

        success:false,

        message:
          "Student not found"

      });

    }


    const semesterRecords =
      await AttendanceRecord.find({

        student: student._id,

        semester:
          student.semester

      });


    const semesterTotal =
      semesterRecords.length;


    const semesterPresent =
      semesterRecords.filter(
        r =>
          r.status === "present" ||
          r.status === "late_excused"
      ).length;


    const semesterPercentage =
      semesterTotal === 0
      ? 0
      :
      (
        semesterPresent /
        semesterTotal
      ) * 100;



    const now =
      new Date();


    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );


    const end =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      );


    const monthlyRecords =
      await AttendanceRecord.find({

        student: student._id,

        date:{
          $gte:start,
          $lte:end
        }

      });



    const monthlyTotal =
      monthlyRecords.length;


    const monthlyPresent =
      monthlyRecords.filter(
        r =>
          r.status === "present" ||
          r.status === "late_excused"
      ).length;



    const monthlyPercentage =
      monthlyTotal === 0
      ? 0
      :
      (
        monthlyPresent /
        monthlyTotal
      ) * 100;



    res.json({

      success:true,

      semesterPercentage,

      monthlyPercentage

    });


  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};



// ======================================================
// GET SINGLE ATTENDANCE RECORD
// SPECIAL ATTENDANCE MODULE
// ======================================================

exports.getAttendanceRecord =
async (
    req,
    res,
    next
) => {

    try {


        const attendance =
            await AttendanceRecord
            .findById(
                req.params.attendanceId
            )
            .populate(
                "student",
                "fullName admissionNo department semester section"
            );


        if (!attendance){

            return res.status(404).json({

                success:false,

                message:
                "Attendance record not found."

            });

        }


        res.json({

            success:true,

            attendance

        });


    }
    catch(error){

        next(error);

    }

};