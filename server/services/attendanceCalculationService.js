const AttendanceRecord = require("../models/AttendanceRecord");
const Student = require("../models/Student");

const PRESENT_STATUSES = [
    "present",
    "late_excused",
    "medical",
    "sports",
    "official_duty",
    "event",
    "placement",
    "nss",
    "ncc",
    "workshop",
    "industrial_visit",
    "special_excused"
];

class AttendanceCalculationService {

    async recalculateStudent(studentId, session = null) {

        const records = await AttendanceRecord.find({
            student: studentId
        }).session(session);

        const workingDays = records.length;

        const attendedDays = records.filter(r =>
            PRESENT_STATUSES.includes(r.status)
        ).length;

        const percentage =
            workingDays === 0
                ? 0
                : Number(((attendedDays / workingDays) * 100).toFixed(2));

        await Student.findByIdAndUpdate(
            studentId,
            {
                workingDays,
                attendedDays,
                attendancePercentage: percentage
            },
            { session }
        );

        return percentage;
    }

}

module.exports = new AttendanceCalculationService();