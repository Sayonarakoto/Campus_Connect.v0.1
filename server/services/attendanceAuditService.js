const AttendanceAudit = require("../models/AttendanceAudit");

class AttendanceAuditService {

    async createAudit({
        attendance,
        correction,
        approvedBy,
        session,
        requestInfo = {}
    }) {

        return AttendanceAudit.create([{

            attendanceRecord: attendance._id,

            correctionRequest: correction._id,

            student: correction.student,

            teacher: correction.requestedBy,

            approvedBy,

            department: correction.department,

            semester: correction.semester,

            section: correction.section,

            academicYear: correction.academicYear,

            date: correction.date,

            hour: correction.hour,

            subject: attendance.subject,

            previousStatus: attendance.status,

            newStatus: correction.newStatus,

            attendanceType: "special",

            reasonType: correction.reasonType,

            reason: correction.reason,

            wasLocked: attendance.isLocked,

            unlockedAt: new Date(),

            modificationSource: "teacher",

            ipAddress: requestInfo.ipAddress || "",

            browser: requestInfo.browser || "",

            operatingSystem: requestInfo.os || "",

            deviceInfo: requestInfo.device || ""

        }], { session });

    }

}

module.exports = new AttendanceAuditService();