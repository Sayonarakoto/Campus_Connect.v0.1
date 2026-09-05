class AttendanceLockService {

    unlock(attendance) {

        attendance.isLocked = false;

        attendance.lockedAt = null;

        attendance.lockedBy = null;
    }

    lock(attendance, userId) {

        attendance.isLocked = true;

        attendance.lockedAt = new Date();

        attendance.lockedBy = userId;
    }

}

module.exports = new AttendanceLockService();