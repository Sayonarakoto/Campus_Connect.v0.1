const mongoose = require("mongoose");

const AttendanceRecord =
require("../models/AttendanceRecord");

const AttendanceCorrection =
require("../models/AttendanceCorrection");

const AttendanceAudit =
require("../models/AttendanceAudit");

const Student =
require("../models/Student");

// ==============================
// Constants
// ==============================

const AttendanceStatus =
require("../constants/attendanceStatus");

const CorrectionStatus =
require("../constants/correctionStatus");

// ==============================
// Custom Errors
// ==============================

const {
    NotFoundError,
    ValidationError,
    ConflictError
} = require("../errors");

// ============================================================
// SERVICE
// ============================================================

class AttendanceCorrectionService {

    // ============================================================
    // REQUEST ATTENDANCE CORRECTION
    // ============================================================

async requestCorrection(data) {

    const selectedDate = new Date(data.date);

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

   let attendance =
    await AttendanceRecord.findOne({

        student: data.student,

        hour: Number(data.hour),

        date: {

            $gte: start,

            $lte: end

        }

    });

console.log("Attendance Found:", attendance);

// =======================================================
// Auto-create attendance if it doesn't exist
// =======================================================

if (!attendance) {

    const student =
        await Student.findById(
            data.student
        );

    if (!student) {

        throw new NotFoundError(
            "Student not found."
        );

    }

    attendance =
        await AttendanceRecord.create({

            student: student._id,

            date: start,

            semester: student.semester,

            academicYear:
                student.academicYear,

            department:
                student.department || "",

            section:
                student.section || "",

            hour:
                Number(data.hour),

            status:
                AttendanceStatus.ABSENT,

            markedBy:
                data.requestedBy,

            attendanceType:
                "regular",

            isLocked: true,

            lockedBy:
                data.requestedBy,

            lockedAt:
                new Date()

        });

    console.log(
        "Attendance auto-created:",
        attendance._id
    );

}

const existing =
    await AttendanceCorrection.findOne({

        attendanceRecord:
            attendance._id,

        status: {

            $in: [

                CorrectionStatus.PENDING,

                CorrectionStatus.APPROVED

            ]

        }

    });

if (existing) {

    throw new ConflictError(
        "A pending correction request already exists."
    );

}
     

    console.log("Attendance Found:", attendance);

    if (!attendance) {

        throw new NotFoundError(
            "Attendance record not found."
        );

    }


// =======================================================
// If attendance does not exist,
// automatically create it
// =======================================================

if (!attendance) {

    const student = await Student.findById(
        data.student
    );

    if (!student) {

        throw new NotFoundError(
            "Student not found."
        );

    }

    attendance = await AttendanceRecord.create({

        student: student._id,

        date: start,

        semester: student.semester,

        academicYear: student.academicYear,

        department: student.department || "",

        section: student.section || "",

        hour: Number(data.hour),

        status: AttendanceStatus.ABSENT,

        markedBy: data.requestedBy,

        attendanceType: "regular",

        isLocked: true,

        lockedBy: data.requestedBy,

        lockedAt: new Date()

    });

}
    // rest of your code...
}
    // ============================================================
    // APPROVE CORRECTION
    // ============================================================
        async approveCorrection(
        correctionId,
        approverId,
        remarks = ""
    ) {

        const correction =
            await AttendanceCorrection.findById(
                correctionId
            );

        if (!correction) {

            throw new NotFoundError(
                "Attendance correction request not found."
            );

        }

        if (
            correction.status ===
            CorrectionStatus.COMPLETED
        ) {

            throw new ConflictError(
                "This correction has already been applied."
            );

        }

        if (
            correction.status !==
            CorrectionStatus.PENDING
        ) {

            throw new ValidationError(
                "Only pending correction requests can be approved."
            );

        }

        correction.status =
            CorrectionStatus.APPROVED;

        correction.approvedBy =
            approverId;

        correction.approvedAt =
            new Date();

        correction.approvalRemarks =
            remarks || "";

        await correction.save();

        return correction;

    }

    // ============================================================
    // REJECT CORRECTION
    // ============================================================

    async rejectCorrection(
        correctionId,
        approverId,
        rejectionReason
    ) {

        const correction =
            await AttendanceCorrection.findById(
                correctionId
            );

        if (!correction) {

            throw new NotFoundError(
                "Attendance correction request not found."
            );

        }

        if (
            correction.status ===
            CorrectionStatus.COMPLETED
        ) {

            throw new ConflictError(
                "This correction has already been applied."
            );

        }

        if (
            correction.status !==
            CorrectionStatus.PENDING
        ) {

            throw new ValidationError(
                "Only pending correction requests can be rejected."
            );

        }

        correction.status =
            CorrectionStatus.REJECTED;

        correction.approvedBy =
            approverId;

        correction.rejectedAt =
            new Date();

        correction.rejectionReason =
            rejectionReason || "";

        await correction.save();

        return correction;

    }

    // ============================================================
    // APPLY CORRECTION
    // ============================================================

    async applyCorrection(
        correctionId,
        user,
        requestInfo = {}
    ) {

        const session =
            await mongoose.startSession();

        try {

            let result = null;

            await session.withTransaction(async () => {

                const correction =
                    await AttendanceCorrection
                        .findById(correctionId)
                        .session(session);

                if (!correction) {

                    throw new NotFoundError(
                        "Attendance correction request not found."
                    );

                }

                if (
                    correction.status ===
                    CorrectionStatus.COMPLETED
                ) {

                    throw new ConflictError(
                        "This correction has already been applied."
                    );

                }

                if (
                    correction.status !==
                    CorrectionStatus.APPROVED
                ) {

                    throw new ValidationError(
                        "Only approved correction requests can be applied."
                    );

                }

                const attendance =
                    await AttendanceRecord
                        .findById(
                            correction.attendanceRecord
                        )
                        .session(session);

                if (!attendance) {

                    throw new NotFoundError(
                        "Attendance record not found."
                    );

                }

                if (
                    attendance.status ===
                    correction.newStatus
                ) {

                    throw new ValidationError(
                        "Attendance already has the requested status."
                    );

                }

                const previousLockedAt =
                    attendance.lockedAt;

                attendance.isLocked = false;

                await attendance.save({
                    session
                });

                await AttendanceAudit.create([{

                    attendanceRecord:
                        attendance._id,

                    correctionRequest:
                        correction._id,

                    student:
                        correction.student,

                    teacher:
                        correction.requestedBy,

                    approvedBy:
                        correction.approvedBy,

                    department:
                        correction.department,

                    semester:
                        correction.semester,

                    section:
                        correction.section,

                    academicYear:
                        correction.academicYear,

                    date:
                        correction.date,

                    hour:
                        correction.hour,

                    previousStatus:
                        attendance.status,

                    newStatus:
                        correction.newStatus,

                    previousAttendanceType:
                        attendance.attendanceType,

                    newAttendanceType:
                        "special",

                    reasonType:
                        correction.reasonType,

                    reason:
                        correction.reason,

                    wasLocked:
                        true,

                    lockedAt:
                        previousLockedAt,

                    unlockedAt:
                        new Date(),

                    ipAddress:
                        requestInfo.ipAddress || "",

                    browser:
                        requestInfo.browser || "",

                    operatingSystem:
                        requestInfo.os || "",

                    deviceInfo:
                        requestInfo.device || ""

                }], {
                    session
                });
                                // --------------------------------------------------
                // Apply Attendance Change
                // --------------------------------------------------

                attendance.status =
                    correction.newStatus;

                attendance.attendanceType =
                    "special";

                attendance.correctionCount =
                    (attendance.correctionCount || 0) + 1;

                attendance.lastCorrection =
                    new Date();

                attendance.isLocked =
                    true;

                attendance.lockedAt =
                    new Date();

                attendance.lockedBy =
                    user.id;

                await attendance.save({
                    session
                });

                // --------------------------------------------------
                // Update Correction Request
                // --------------------------------------------------

                correction.status =
                    CorrectionStatus.COMPLETED;

                correction.appliedBy =
                    user.id;

                correction.appliedAt =
                    new Date();

                await correction.save({
                    session
                });

                // --------------------------------------------------
                // Recalculate Student Attendance
                // --------------------------------------------------

                await this.recalculateAttendance(

                    correction.student,

                    session

                );

                result =
                    correction;

            });

            return result;

        }

        catch (error) {

            throw error;

        }

        finally {

            await session.endSession();

        }

    }

    // ============================================================
    // RECALCULATE STUDENT ATTENDANCE
    // ============================================================

    async recalculateAttendance(
        studentId,
        session = null
    ) {

        const student =
            await Student.findById(studentId)
                .session(session);

        if (!student) {

            throw new NotFoundError(
                "Student not found."
            );

        }

        const records =
            await AttendanceRecord.find({

                student:
                    studentId

            }).session(session);

        const PRESENT_STATUSES =
            new Set([

                AttendanceStatus.PRESENT,

                AttendanceStatus.LATE_EXCUSED,

                AttendanceStatus.MEDICAL,

                AttendanceStatus.SPORTS,

                AttendanceStatus.OFFICIAL_DUTY,

                AttendanceStatus.EVENT,

                AttendanceStatus.PLACEMENT,

                AttendanceStatus.WORKSHOP,

                AttendanceStatus.INDUSTRIAL_VISIT,

                AttendanceStatus.SEMINAR,

                AttendanceStatus.SPECIAL_EXCUSED

            ]);

        const validRecords =
            records.filter(record =>

                record.status !==
                AttendanceStatus.PENDING_CORRECTION

            );

        const total =
            validRecords.length;

        const attended =
            validRecords.filter(record =>

                PRESENT_STATUSES.has(
                    record.status
                )

            ).length;

        const percentage =
            total === 0
                ? 0
                : Number(

                    (
                        attended /
                        total
                    ) * 100

                .toFixed(2));

        await Student.findByIdAndUpdate(

            studentId,

            {

                workingDays:
                    total,

                attendedDays:
                    attended,

                attendancePercentage:
                    percentage

            },

            {

                session,

                new: true

            }

        );

        return {

            studentId,

            workingDays:
                total,

            attendedDays:
                attended,

            attendancePercentage:
                percentage

        };

    }

    // ============================================================
    // GET ALL PENDING CORRECTIONS
    // ============================================================

    async getPendingCorrections(
        filters = {}
    ) {        const query = {};

        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        query.status =
            filters.status ||
            CorrectionStatus.PENDING;

        // --------------------------------------------------
        // Department
        // --------------------------------------------------

        if (filters.department) {

            query.department =
                filters.department;

        }

        // --------------------------------------------------
        // Semester
        // --------------------------------------------------

        if (
            filters.semester !== undefined &&
            filters.semester !== null &&
            filters.semester !== ""
        ) {

            query.semester =
                Number(filters.semester);

        }

        // --------------------------------------------------
        // Academic Year
        // --------------------------------------------------

        if (filters.academicYear) {

            query.academicYear =
                filters.academicYear;

        }

        return AttendanceCorrection.find(query)

            .populate(
                "student",
                "fullName admissionNo department semester"
            )

            .populate(
                "requestedBy",
                "fullName role"
            )

            .populate(
                "approvedBy",
                "fullName role"
            )

            .sort({

                createdAt: -1

            })

            .lean();

    }

    // ============================================================
    // STUDENT CORRECTION HISTORY
    // ============================================================

    async getStudentCorrectionHistory(
        studentId
    ) {

        const student =
            await Student.findById(studentId)
                .lean();

        if (!student) {

            throw new NotFoundError(
                "Student not found."
            );

        }

        return AttendanceCorrection.find({

            student:
                studentId

        })

        .populate(
            "requestedBy",
            "fullName role"
        )

        .populate(
            "approvedBy",
            "fullName role"
        )

        .populate(
            "appliedBy",
            "fullName role"
        )

        .sort({

            createdAt: -1

        })

        .lean();

    }

    // ============================================================
    // AUDIT HISTORY
    // ============================================================

    async getAuditHistory(
        studentId
    ) {

        const student =
            await Student.findById(studentId)
                .lean();

        if (!student) {

            throw new NotFoundError(
                "Student not found."
            );

        }

        return AttendanceAudit.find({

            student:
                studentId

        })

        .populate(
            "attendanceRecord",
            "date hour status attendanceType"
        )

        .populate(
            "correctionRequest",
            "status reasonType reason"
        )

        .populate(
            "teacher",
            "fullName role"
        )

        .populate(
            "approvedBy",
            "fullName role"
        )

        .sort({

            createdAt: -1

        })

        .lean();

    }
    // ============================================================
// GET STUDENT ATTENDANCE
// ============================================================

async getStudentAttendance(studentId) {

    const student =
        await Student.findById(studentId);

    if (!student) {

        throw new NotFoundError(
            "Student not found."
        );

    }

    return AttendanceRecord.find({

        student: studentId

    })

    .sort({

        date: -1,

        hour: 1

    })

    .select(

        "_id date hour status attendanceType isLocked"

    )

    .lean();

}

}


module.exports =
    new AttendanceCorrectionService();