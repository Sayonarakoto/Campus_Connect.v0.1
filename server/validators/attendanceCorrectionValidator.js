const mongoose = require("mongoose");

const {
    ValidationError
} = require("../errors");

const AttendanceStatus =
    require("../constants/attendanceStatus");

class AttendanceCorrectionValidator {

    // ==========================================
    // Request Validation
    // ==========================================

    validateRequest(data) {

        const {

        student,

         date,

         hour,

         reason,

         reasonType,

         newStatus

         }=data;

        // ------------------------------------------
        // Attendance Record
        // ------------------------------------------

        if(!student){

        throw new ValidationError(
        "Student is required."
        );

        }

       if(
       !mongoose.Types.ObjectId.isValid(student)
        ){

         throw new ValidationError(
        "Invalid Student ID."
           );

        }

        // ------------------------------------------
        // Date
        // ------------------------------------------

        if (!date) {

            throw new ValidationError(
                "Attendance date is required."
            );

        }

        // ------------------------------------------
        // Hour
        // ------------------------------------------

        if (
            hour === undefined ||
            hour === null
        ) {

            throw new ValidationError(
                "Hour is required."
            );

        }

        if (hour < 1 || hour > 10) {

            throw new ValidationError(
                "Hour must be between 1 and 10."
            );

        }

        // ------------------------------------------
        // Reason
        // ------------------------------------------

        if (!reason) {

            throw new ValidationError(
                "Reason is required."
            );

        }

        if (
            reason.trim().length < 10
        ) {

            throw new ValidationError(
                "Reason must contain at least 10 characters."
            );

        }

        // ------------------------------------------
        // Reason Type
        // ------------------------------------------

        if (!reasonType) {

            throw new ValidationError(
                "Reason Type is required."
            );

        }

        const allowedReasonTypes = [

            "medical",

            "sports",

            "official_duty",

            "event",

            "placement",

            "industrial_visit",

            "workshop",

            "seminar",

            "administrative",

            "manual_correction",

            "other"

        ];

        if (
            !allowedReasonTypes.includes(
                reasonType
            )
        ) {

            throw new ValidationError(
                "Invalid reason type."
            );

        }

        // ------------------------------------------
        // New Attendance Status
        // ------------------------------------------

        if (!newStatus) {

            throw new ValidationError(
                "New attendance status is required."
            );

        }

        const allowedStatuses =
            Object.values(
                AttendanceStatus
            );

        if (
            !allowedStatuses.includes(
                newStatus
            )
        ) {

            throw new ValidationError(
                "Invalid attendance status."
            );

        }

        return true;

    }

    // ==========================================
    // Approval Validation
    // ==========================================

    validateApproval(data) {

        const {

            correctionId,

            remarks

        } = data;

        if (!correctionId) {

            throw new ValidationError(
                "Correction ID is required."
            );

        }

        if (
            !mongoose.Types.ObjectId.isValid(
                correctionId
            )
        ) {

            throw new ValidationError(
                "Invalid Correction ID."
            );

        }

        if (
            remarks &&
            remarks.length > 500
        ) {

            throw new ValidationError(
                "Remarks cannot exceed 500 characters."
            );

        }

        return true;

    }

    // ==========================================
    // Reject Validation
    // ==========================================

    validateRejection(data) {

        const {

            correctionId,

            rejectionReason

        } = data;

        if (!correctionId) {

            throw new ValidationError(
                "Correction ID is required."
            );

        }

        if (
            !mongoose.Types.ObjectId.isValid(
                correctionId
            )
        ) {

            throw new ValidationError(
                "Invalid Correction ID."
            );

        }

        if (!rejectionReason) {

            throw new ValidationError(
                "Rejection reason is mandatory."
            );

        }

        if (
            rejectionReason.trim().length < 10
        ) {

            throw new ValidationError(
                "Rejection reason must contain at least 10 characters."
            );

        }

        return true;

    }

    // ==========================================
    // Apply Validation
    // ==========================================

    validateApply(data) {

        const {

            correctionId

        } = data;

        if (!correctionId) {

            throw new ValidationError(
                "Correction ID is required."
            );

        }

        if (
            !mongoose.Types.ObjectId.isValid(
                correctionId
            )
        ) {

            throw new ValidationError(
                "Invalid Correction ID."
            );

        }

        return true;

    }

}

module.exports =
    new AttendanceCorrectionValidator();