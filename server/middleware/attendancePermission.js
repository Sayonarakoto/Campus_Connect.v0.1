const permissionService =
require("../services/attendance/attendancePermissionService");

module.exports =
(permissionName) => {

    return async (
        req,
        res,
        next
    ) => {

        try {

            switch(permissionName){

                case "requestCorrection":

                    await permissionService
                    .canRequestCorrection(
                        req.user
                    );

                    break;

                case "approveCorrection":

                    await permissionService
                    .canApproveCorrection(
                        req.user
                    );

                    break;

                case "rejectCorrection":

                    await permissionService
                    .canRejectCorrection(
                        req.user
                    );

                    break;

                case "applyCorrection":

                    await permissionService
                    .canApplyCorrection(
                        req.user
                    );

                    break;

                case "viewAudit":

                    await permissionService
                    .canViewAudit(
                        req.user
                    );

                    break;

                default:

                    break;

            }

            next();

        }

        catch(error){

            next(error);

        }

    };

};