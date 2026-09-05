const AuditLog =
require("../models/AuditLog");

const createAuditLog =
async ({
  leaveId,
  studentId,
  action,
  actorId,
  remarks = ""
}) => {

  await AuditLog.create({
    leave: leaveId,
    student: studentId,
    action,
    actor: actorId,
    remarks
  });

};

module.exports =
createAuditLog;