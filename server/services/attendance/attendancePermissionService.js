const AttendanceCorrection =
require("../../models/AttendanceCorrection");

const ROLES =
require("../../constants/roles");

const {
    ForbiddenError,
    ConflictError
} = require("../../errors");

class AttendancePermissionService {

    // =================================================
    // Can Request Attendance Correction
    // =================================================

    async canRequestCorrection(user, attendance) {

        if (!user) {
            throw new ForbiddenError(
                "Invalid user."
            );
        }

        // Admin can always request
        if (user.role === ROLES.ADMIN)
            return true;

        // Director
        if (user.role === ROLES.DIRECTOR)
            return true;

        // Principal
        if (user.role === ROLES.PRINCIPAL)
            return true;

        // HOD
        if (user.role === ROLES.HOD)
            return true;

        // Faculty
        if (user.role === ROLES.FACULTY)
            return true;

        // Tutor
        if (user.role === ROLES.TUTOR)
            return true;

        throw new ForbiddenError(
            "You are not allowed to request attendance corrections."
        );

    }

    // =================================================
    // Can Approve
    // =================================================

    async canApproveCorrection(user) {

        if (
            [
                ROLES.ADMIN,
                ROLES.DIRECTOR,
                ROLES.PRINCIPAL,
                ROLES.HOD
            ].includes(user.role)
        ) {

            return true;

        }

        throw new ForbiddenError(
            "You cannot approve attendance corrections."
        );

    }

    // =================================================
    // Can Reject
    // =================================================

    async canRejectCorrection(user) {

        return this.canApproveCorrection(
            user
        );

    }

    // =================================================
    // Can Apply
    // =================================================

    async canApplyCorrection(user) {

        if (
            [
                ROLES.ADMIN,
                ROLES.DIRECTOR
            ].includes(user.role)
        ) {

            return true;

        }

        throw new ForbiddenError(
            "You cannot apply attendance corrections."
        );

    }

    // =================================================
    // View Audit
    // =================================================

    async canViewAudit(user) {

        if (
            [
                ROLES.ADMIN,
                ROLES.DIRECTOR,
                ROLES.PRINCIPAL,
                ROLES.HOD
            ].includes(user.role)
        ) {

            return true;

        }

        throw new ForbiddenError(
            "Access denied."
        );

    }

    // =================================================
    // Pending Request Check
    // =================================================

    async ensureNoPendingRequest(
        attendanceRecordId
    ) {

        const pending =
            await AttendanceCorrection.findOne({

                attendanceRecord:
                    attendanceRecordId,

                status: {
                    $in: [
                        "pending",
                        "approved"
                    ]
                }

            });

        if (pending) {

            throw new ConflictError(

                "A correction request already exists."

            );

        }

        return true;

    }

}

module.exports =
new AttendancePermissionService();