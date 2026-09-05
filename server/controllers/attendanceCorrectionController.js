const attendanceCorrectionService =
require("../services/attendanceCorrectionService");

const attendancePermissionService =
require("../services/attendance/attendancePermissionService");

const validator =
require("../validators/attendanceCorrectionValidator");

class AttendanceCorrectionController {

    // ======================================================
    // REQUEST CORRECTION
    // ======================================================

    async requestCorrection(
        req,
        res,
        next
    ) {

        try {

            validator.validateRequest(
                req.body
            );


           

            const correction =
                await attendanceCorrectionService
                .requestCorrection({

                    ...req.body,

                    requestedBy:
                        req.user.id

                });

            res.status(201).json({

                success: true,

                message:
                    "Attendance correction request submitted successfully.",

                correction

            });

        }

        catch(error){

            next(error);

        }

    }

    // ======================================================
    // APPROVE
    // ======================================================

    async approveCorrection(
        req,
        res,
        next
    ) {

        try {

            validator.validateApproval({

                correctionId:
                    req.params.id,

                ...req.body

            });

            await attendancePermissionService
            .canApproveCorrection(
                req.user
            );

            const correction =
                await attendanceCorrectionService
                .approveCorrection(

                    req.params.id,

                    req.user.id,

                    req.body.remarks

                );

            res.json({

                success: true,

                message:
                    "Attendance correction approved.",

                correction

            });

        }

        catch(error){

            next(error);

        }

    }

    // ======================================================
    // REJECT
    // ======================================================

    async rejectCorrection(
        req,
        res,
        next
    ) {

        try {

            validator.validateRejection({

                correctionId:
                    req.params.id,

                ...req.body

            });

            await attendancePermissionService
            .canRejectCorrection(
                req.user
            );

            const correction =
                await attendanceCorrectionService
                .rejectCorrection(

                    req.params.id,

                    req.user.id,

                    req.body.rejectionReason

                );

            res.json({

                success: true,

                message:
                    "Attendance correction rejected.",

                correction

            });

        }

        catch(error){

            next(error);

        }

    }

    // ======================================================
    // APPLY
    // ======================================================
        async applyCorrection(
        req,
        res,
        next
    ) {

        try {

            validator.validateApply({

                correctionId:
                    req.params.id

            });

            await attendancePermissionService
            .canApplyCorrection(
                req.user
            );

            const correction =
                await attendanceCorrectionService
                .applyCorrection(

                    req.params.id,

                    req.user,

                    {

                        ipAddress:
                            req.ip,

                        browser:
                            req.headers["user-agent"],

                        os:
                            req.headers["sec-ch-ua-platform"] || "",

                        device:
                            req.headers["sec-ch-ua-mobile"] || ""

                    }

                );

            res.json({

                success: true,

                message:
                    "Attendance correction applied successfully.",

                correction

            });

        }

        catch(error){

            next(error);

        }

    }

    // ======================================================
    // GET PENDING CORRECTIONS
    // ======================================================

    async getPendingCorrections(
        req,
        res,
        next
    ) {

        try {

            await attendancePermissionService
            .canViewAudit(
                req.user
            );

            const corrections =
                await attendanceCorrectionService
                .getPendingCorrections({

                    department:
                        req.query.department,

                    semester:
                        req.query.semester,

                    academicYear:
                        req.query.academicYear

                });

            res.json({

                success: true,

                count:
                    corrections.length,

                corrections

            });

        }

        catch(error){

            next(error);

        }

    }

    // ======================================================
    // STUDENT CORRECTION HISTORY
    // ======================================================

    async getStudentCorrectionHistory(
        req,
        res,
        next
    ) {

        try {

            const history =
                await attendanceCorrectionService
                .getStudentCorrectionHistory(

                    req.params.studentId

                );

            res.json({

                success: true,

                count:
                    history.length,

                history

            });

        }

        catch(error){

            next(error);

        }

    }

    // ======================================================
    // AUDIT HISTORY
    // ======================================================

    async getAuditHistory(
        req,
        res,
        next
    ) {

        try {

            await attendancePermissionService
            .canViewAudit(
                req.user
            );

            const history =
                await attendanceCorrectionService
                .getAuditHistory(

                    req.params.studentId

                );

            res.json({

                success: true,

                count:
                    history.length,

                history

            });

        }

        catch(error){

            next(error);

        }

    }

 // ======================================================
// GET STUDENT ATTENDANCE RECORDS
// ======================================================

async getStudentAttendance(
    req,
    res,
    next
) {

    try {

        const records =
            await attendanceCorrectionService
                .getStudentAttendance(
                    req.params.studentId
                );

        res.json({

            success: true,

            records

        });

    }

    catch (error) {

        next(error);

    }

}
}


module.exports =
new AttendanceCorrectionController();