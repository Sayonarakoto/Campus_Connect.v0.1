const GatePass = require("../models/GatePass");
const User = require("../models/User");
const ApprovalInstance = require("../models/ApprovalInstance");
const {
  resolveWorkflowSteps,
  initializeWorkflowInstance
} = require("../services/workflowService");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const {
  generateGatePassOtp,
  isValidGatePassOtp
} = require("../utils/gatePassSecurity");


// =============================
// STUDENT - CREATE REQUEST (With Approver Selection & Workflow Hierarchy)
// =============================

exports.createGatePass = async (req, res) => {
  try {
    const {
      purpose,
      departureTime,
      returnTime,
      selectedApproverRole,
      selectedApproverId,
      isHalfDay
    } = req.body;

    const isHalfDayBool = isHalfDay === true || isHalfDay === "true";

    if (
      !purpose ||
      !departureTime ||
      (!isHalfDayBool && !returnTime) ||
      !selectedApproverRole
    ) {
      return res.status(400).json({
        success: false,
        message: isHalfDayBool
          ? "Purpose, exit time, and approver selection are required for a half day pass."
          : "All fields including departure time, return time, and approver are required."
      });
    }

    // Validate approver selection
    if (selectedApproverRole === "other" && !selectedApproverId) {
      return res.status(400).json({
        success: false,
        message: "Please select a faculty member when choosing 'Other'"
      });
    }

    // If "other" is selected, verify the selected user exists and is faculty
    if (selectedApproverRole === "other") {
      const selectedUser = await User.findById(selectedApproverId);
      if (!selectedUser) {
        return res.status(404).json({
          success: false,
          message: "Selected faculty not found"
        });
      }
      if (!["faculty", "hod"].includes(selectedUser.role)) {
        return res.status(400).json({
          success: false,
          message: "Selected user is not authorized as approver"
        });
      }
    }

    const currentUser = await User.findById(req.user.id);
    const Student = require("../models/Student");
    const studentProfile = await Student.findOne({ user: currentUser._id });
    const semester = studentProfile?.semester || Number(currentUser.customData?.semester) || 1;
    const isSem1or2 = semester < 3;
    const effectiveDepartment = isSem1or2
      ? "General Department"
      : (currentUser.primaryDepartment || currentUser.department);

    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dateStr = now.toISOString().split("T")[0];
    const dayStr = days[now.getDay()];

    // Resolve workflow steps for GatePass
    let firstStepRole = "faculty";
    let firstStepName = "Tutor / Faculty Review";
    let totalWorkflowSteps = 2;

    try {
      const workflowResolution = await resolveWorkflowSteps("GatePass");
      if (workflowResolution && Array.isArray(workflowResolution.steps) && workflowResolution.steps.length > 0) {
        firstStepRole = (workflowResolution.steps[0].roleRequired || "faculty").toLowerCase();
        firstStepName = workflowResolution.steps[0].actionName || "Tutor / Faculty Review";
        totalWorkflowSteps = workflowResolution.steps.length;
      }
    } catch (wfErr) {
      console.warn("Could not resolve workflow for GatePass, falling back to defaults:", wfErr.message);
    }

    const gatePass = await GatePass.create({
      studentId: req.user.id,
      purpose,
      department: effectiveDepartment,
      date: dateStr,
      day: dayStr,
      isHalfDay: isHalfDayBool,
      departureTime,
      returnTime: isHalfDayBool ? null : returnTime,
      selectedApproverRole,
      selectedApproverId: selectedApproverRole === "other" ? selectedApproverId : null,
      currentStepOrder: 1,
      totalSteps: totalWorkflowSteps,
      currentRoleRequired: firstStepRole,
      currentStepName: firstStepName,
      workflowHistory: []
    });

    // Initialize ApprovalInstance for workflow tracking
    try {
      const { instance } = await initializeWorkflowInstance({
        moduleName: "GatePass",
        targetRefId: gatePass._id,
        applicantId: req.user.id,
        department: effectiveDepartment,
        metadata: {
          purpose,
          isHalfDay: isHalfDayBool,
          departureTime,
          returnTime: isHalfDayBool ? null : returnTime,
          selectedApproverRole,
          selectedApproverId: selectedApproverRole === "other" ? selectedApproverId : null
        }
      });
      if (instance) {
        gatePass.workflowInstanceId = instance._id;
        await gatePass.save();
      }
    } catch (instErr) {
      console.warn("Could not initialize ApprovalInstance for GatePass:", instErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Gate Pass Request Submitted Successfully",
      gatePass
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// STUDENT - MY REQUESTS
// =============================

exports.getMyGatePasses = async (req, res) => {
  try {
    const gatePasses = await GatePass.find({
      studentId: req.user.id
    })
    .populate("selectedApproverId", "fullName email role")
    .populate("approverId", "fullName email role")
    .populate("workflowHistory.approverId", "fullName email role")
    .sort({ createdAt: -1 });

    // Fallback: If an approved pass is missing OTP, generate and save one
    for (const pass of gatePasses) {
      if (pass.status === "approved" && !isValidGatePassOtp(pass.otp)) {
        pass.otp = generateGatePassOtp();
        await pass.save();
      }
    }

    res.json(gatePasses);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// HOD/FACULTY - PENDING LIST (Filtered by role and department)
// =============================

exports.getPendingRequests = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser || !currentUser.department) {
      return res.status(400).json({
        success: false,
        message: "User department not found"
      });
    }

    let query = {
      status: "pending"
    };

    const isGeneralDeptHOD = currentUser.role === "hod" && currentUser.department === "General Department";

    if (currentUser.role === "hod") {
      if (isGeneralDeptHOD) {
        // General Department HOD sees all Sem 1 & 2 requests
        const genStudents = await User.find({
          $or: [{ department: "General Department" }, { isGeneralDepartment: true }],
          role: "student"
        }).select("_id");

        query.$or = [
          { department: "General Department" },
          { studentId: { $in: genStudents.map(s => s._id) } }
        ];
      } else {
        // Core Department HOD (e.g. Mechanical, Computer) sees:
        // - Core branch requests (Sem 3+)
        // - Requests explicitly directed to them
        const coreStudents = await User.find({
          $or: [
            { department: currentUser.department },
            { primaryDepartment: currentUser.department }
          ],
          role: "student"
        }).select("_id");

        query.$or = [
          { department: currentUser.department },
          { studentId: { $in: coreStudents.map(s => s._id) } },
          { selectedApproverId: currentUser._id }
        ];
      }
    } else if (currentUser.role === "faculty") {
      const isGeneralDeptFaculty = currentUser.department === "General Department";
      const facultyStudents = await User.find({
        $or: isGeneralDeptFaculty
          ? [{ department: "General Department" }, { isGeneralDepartment: true }]
          : [{ department: currentUser.department }, { primaryDepartment: currentUser.department }],
        role: "student"
      }).select("_id");

      query.$or = [
        { 
          selectedApproverRole: "other",
          selectedApproverId: currentUser._id
        },
        { 
          selectedApproverRole: "faculty",
          studentId: { $in: facultyStudents.map(s => s._id) }
        },
        {
          selectedApproverRole: "hod",
          studentId: { $in: facultyStudents.map(s => s._id) }
        }
      ];
    }

    const requests = await GatePass.find(query)
      .populate("studentId", "fullName email role department")
      .populate("selectedApproverId", "fullName email role")
      .sort({ createdAt: -1 });

    res.json(requests);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// HOD/FACULTY - APPROVE (With Role-Based Validation & Workflow Stepping)
// =============================

exports.approveGatePass = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id)
      .populate("studentId")
      .populate("selectedApproverId");

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate Pass not found"
      });
    }

    if (gatePass.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed"
      });
    }

    const currentUser = await User.findById(req.user.id);
    
    // Check if user is authorized to approve this request
    let isAuthorized = false;
    const isGeneralDeptHOD = currentUser.role === "hod" && currentUser.department === "General Department";
    const studentDept = gatePass.studentId?.department;
    const studentPrimaryDept = gatePass.studentId?.primaryDepartment;
    const passDept = gatePass.department;

    // 1. Check if user is HOD
    if (currentUser.role === "hod") {
      if (isGeneralDeptHOD && (studentDept === "General Department" || passDept === "General Department")) {
        isAuthorized = true;
      } else if (!isGeneralDeptHOD && (studentDept === currentUser.department || studentPrimaryDept === currentUser.department || passDept === currentUser.department)) {
        isAuthorized = true;
      } else if (gatePass.selectedApproverId && gatePass.selectedApproverId._id?.toString() === currentUser._id.toString()) {
        isAuthorized = true;
      }
    }
    // 2. Check if user is faculty
    else if (currentUser.role === "faculty") {
      const isGeneralDeptFaculty = currentUser.department === "General Department";
      const matchesDept = isGeneralDeptFaculty
        ? (studentDept === "General Department" || passDept === "General Department")
        : (studentDept === currentUser.department || studentPrimaryDept === currentUser.department || passDept === currentUser.department);

      // a. Faculty is specifically selected as approver
      if (gatePass.selectedApproverRole === "other" && 
          gatePass.selectedApproverId && 
          gatePass.selectedApproverId._id.toString() === currentUser._id.toString()) {
        isAuthorized = true;
      }
      // b. Faculty is approving as general faculty (selectedApproverRole = "faculty")
      else if (gatePass.selectedApproverRole === "faculty" && matchesDept) {
        isAuthorized = true;
      }
      // c. Faculty is approving HOD requests from their department
      else if (gatePass.selectedApproverRole === "hod" && matchesDept) {
        isAuthorized = true;
      }
    } else if (currentUser.role === "admin") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this gate pass"
      });
    }

    // Resolve workflow definition to check multi-tier pipeline
    let workflowResolution = null;
    try {
      workflowResolution = await resolveWorkflowSteps("GatePass");
    } catch (wfErr) {
      console.warn("Could not resolve workflow for GatePass, defaulting to 2-tier:", wfErr.message);
    }

    const steps = (workflowResolution && workflowResolution.steps && workflowResolution.steps.length > 0)
      ? workflowResolution.steps
      : [
          { stepOrder: 1, roleRequired: "faculty", actionName: "Tutor / Faculty Review" },
          { stepOrder: 2, roleRequired: "hod", actionName: "HOD Approval" }
        ];

    const currentStepOrder = gatePass.currentStepOrder || 1;
    const nextStep = steps.find((s) => s.stepOrder > currentStepOrder);

    // If currentUser is faculty and a next step exists (e.g., Step 2: HOD):
    // Advance pipeline, keep status pending for HOD!
    if (currentUser.role === "faculty" && nextStep) {
      gatePass.workflowHistory.push({
        stepOrder: currentStepOrder,
        approverId: currentUser._id,
        role: currentUser.role,
        action: "Approved",
        comment: req.body.comment || "Recommended to HOD for final sanction",
        timestamp: new Date()
      });

      gatePass.currentStepOrder = nextStep.stepOrder;
      gatePass.currentRoleRequired = nextStep.roleRequired.toLowerCase();
      gatePass.currentStepName = nextStep.actionName || `Step ${nextStep.stepOrder} Approval`;
      gatePass.status = "pending";

      if (gatePass.workflowInstanceId) {
        await ApprovalInstance.findByIdAndUpdate(gatePass.workflowInstanceId, {
          currentStepOrder: nextStep.stepOrder,
          currentRoleRequired: nextStep.roleRequired.toLowerCase(),
          $push: {
            history: {
              stepOrder: currentStepOrder,
              approverId: currentUser._id,
              role: currentUser.role,
              action: "Approved",
              comment: req.body.comment || "Recommended to HOD",
              timestamp: new Date()
            }
          }
        });
      }

      await gatePass.save();

      return res.json({
        success: true,
        isComplete: false,
        message: `Step ${currentStepOrder} approved. Forwarded to ${nextStep.actionName || "HOD"} for final authorization.`,
        currentStepOrder: nextStep.stepOrder,
        currentRoleRequired: nextStep.roleRequired,
        gatePass
      });
    }

    // FINAL APPROVAL: Either HOD approving or last step in pipeline
    const qrToken = uuidv4();
    const otpCode = generateGatePassOtp();

    gatePass.status = "approved";
    gatePass.approverId = req.user.id;
    gatePass.qrToken = qrToken;
    gatePass.otp = otpCode;
    const minimumQrExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const plannedEnd = gatePass.returnTime || gatePass.departureTime;
    gatePass.qrExpiry = plannedEnd && new Date(plannedEnd) > minimumQrExpiry
      ? new Date(plannedEnd)
      : minimumQrExpiry;
    gatePass.currentStepOrder = steps.length;
    gatePass.currentStepName = "Approved & Issued";

    // Track if approved by delegation (faculty approving HOD requests directly)
    if (currentUser.role === "faculty" && gatePass.selectedApproverRole === "hod") {
      gatePass.approvedByDelegation = true;
    }

    gatePass.workflowHistory.push({
      stepOrder: currentStepOrder,
      approverId: currentUser._id,
      role: currentUser.role,
      action: "Approved",
      comment: req.body.comment || "Final Approval Granted",
      timestamp: new Date()
    });

    if (gatePass.workflowInstanceId) {
      await ApprovalInstance.findByIdAndUpdate(gatePass.workflowInstanceId, {
        status: "Approved",
        $push: {
          history: {
            stepOrder: currentStepOrder,
            approverId: currentUser._id,
            role: currentUser.role,
            action: "Approved",
            comment: req.body.comment || "Final Approval Granted",
            timestamp: new Date()
          }
        }
      });
    }

    await gatePass.save();

    const qrImage = await QRCode.toDataURL(qrToken);

    res.json({
      success: true,
      isComplete: true,
      message: "Gate Pass fully approved! Digital QR Pass and OTP generated.",
      qrToken,
      otp: otpCode,
      qrImage,
      gatePass
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// HOD/FACULTY - REJECT (With Role-Based Validation & Workflow Tracking)
// =============================

exports.rejectGatePass = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id)
      .populate("studentId")
      .populate("selectedApproverId");

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate Pass not found"
      });
    }

    const currentUser = await User.findById(req.user.id);
    
    // Same authorization logic as approve
    let isAuthorized = false;
    const isGeneralDeptHOD = currentUser.role === "hod" && currentUser.department === "General Department";
    const studentDept = gatePass.studentId?.department;
    const studentPrimaryDept = gatePass.studentId?.primaryDepartment;
    const passDept = gatePass.department;

    if (currentUser.role === "hod") {
      if (isGeneralDeptHOD && (studentDept === "General Department" || passDept === "General Department")) {
        isAuthorized = true;
      } else if (!isGeneralDeptHOD && (studentDept === currentUser.department || studentPrimaryDept === currentUser.department || passDept === currentUser.department)) {
        isAuthorized = true;
      } else if (gatePass.selectedApproverId && gatePass.selectedApproverId._id?.toString() === currentUser._id.toString()) {
        isAuthorized = true;
      }
    } else if (currentUser.role === "faculty") {
      const isGeneralDeptFaculty = currentUser.department === "General Department";
      const matchesDept = isGeneralDeptFaculty
        ? (studentDept === "General Department" || passDept === "General Department")
        : (studentDept === currentUser.department || studentPrimaryDept === currentUser.department || passDept === currentUser.department);

      if (gatePass.selectedApproverRole === "other" && 
          gatePass.selectedApproverId && 
          gatePass.selectedApproverId._id.toString() === currentUser._id.toString()) {
        isAuthorized = true;
      }
      else if (gatePass.selectedApproverRole === "faculty" && matchesDept) {
        isAuthorized = true;
      }
      else if (gatePass.selectedApproverRole === "hod" && matchesDept) {
        isAuthorized = true;
      }
    } else if (currentUser.role === "admin") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this gate pass"
      });
    }

    const rejectionComment = req.body.comment || req.body.remarks || "Rejected";

    gatePass.status = "rejected";
    gatePass.approverId = req.user.id;
    gatePass.approvalRemarks = rejectionComment;

    gatePass.workflowHistory.push({
      stepOrder: gatePass.currentStepOrder || 1,
      approverId: currentUser._id,
      role: currentUser.role,
      action: "Rejected",
      comment: rejectionComment,
      timestamp: new Date()
    });

    if (gatePass.workflowInstanceId) {
      await ApprovalInstance.findByIdAndUpdate(gatePass.workflowInstanceId, {
        status: "Rejected",
        $push: {
          history: {
            stepOrder: gatePass.currentStepOrder || 1,
            approverId: currentUser._id,
            role: currentUser.role,
            action: "Rejected",
            comment: rejectionComment,
            timestamp: new Date()
          }
        }
      });
    }

    await gatePass.save();

    res.json({
      success: true,
      message: "Gate Pass Rejected Successfully",
      gatePass
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// STUDENT - VIEW QR
// =============================

exports.getGatePassQR = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id)
      .populate("selectedApproverId", "fullName email role");

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate Pass not found"
      });
    }

    if (gatePass.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (gatePass.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Pass not approved"
      });
    }

    // Repair credentials for older approved passes created before the
    // four-digit gate-pass OTP format was introduced.
    let credentialsChanged = false;
    if (!isValidGatePassOtp(gatePass.otp)) {
      gatePass.otp = generateGatePassOtp();
      credentialsChanged = true;
    }
    if (!gatePass.qrToken) {
      gatePass.qrToken = uuidv4();
      credentialsChanged = true;
    }
    if (credentialsChanged) await gatePass.save();

    const qrImage = await QRCode.toDataURL(gatePass.qrToken);

    res.json({
      success: true,
      qrImage,
      gatePass
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// SECURITY - VERIFY QR / OTP / MANUAL ENTRY
// =============================

exports.verifyGatePass = async (req, res) => {
  try {
    const { token, qr_token, studentId, studentIdString, student_id, otp, verification_otp } = req.body;

    const qrKey = (token || qr_token || "").toString().trim();
    const inputOtp = otp || verification_otp;
    const inputStudent = studentId || studentIdString || student_id;

    let gatePass = null;

    if (qrKey) {
      // 1. Search by QR token
      gatePass = await GatePass.findOne({
        qrToken: qrKey
      })
        .populate("studentId", "fullName email department customData")
        .populate("approverId", "fullName email role")
        .populate("selectedApproverId", "fullName email role");
    } else if (inputStudent || inputOtp) {
      if (!inputStudent || !inputOtp) {
        return res.status(400).json({
          success: false,
          is_valid: false,
          display_status: "INVALID INPUT",
          message: "Student ID and the four-digit gate-pass OTP are both required."
        });
      }

      if (!isValidGatePassOtp(inputOtp)) {
        return res.status(400).json({
          success: false,
          is_valid: false,
          display_status: "INVALID OTP",
          message: "Gate-pass OTP must contain exactly four digits."
        });
      }

      // 2. Manual search: Find student if provided
      let studentUserIds = [];
      if (inputStudent && typeof inputStudent === "string") {
        const queryStr = inputStudent.trim();
        const matchedUsers = await User.find({
          $or: [
            { email: queryStr.toLowerCase() },
            { fullName: { $regex: queryStr, $options: "i" } },
            { "customData.admissionNo": queryStr },
            { "customData.rollNumber": queryStr },
            { "customData.regNo": queryStr }
          ]
        }).select("_id");
        studentUserIds = matchedUsers.map((u) => u._id);
        if (queryStr.match(/^[0-9a-fA-F]{24}$/)) {
          studentUserIds.push(queryStr);
        }
      }

      const passQuery = {
        status: { $in: ["approved", "used"] }
      };

      if (studentUserIds.length > 0) {
        passQuery.studentId = { $in: studentUserIds };
      }

      if (inputOtp) {
        passQuery.otp = inputOtp.trim();
      }

      gatePass = await GatePass.findOne(passQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .populate("studentId", "fullName email department customData")
        .populate("approverId", "fullName email role")
        .populate("selectedApproverId", "fullName email role");

    } else {
      return res.status(400).json({
        success: false,
        is_valid: false,
        display_status: "INVALID INPUT",
        message: "QR code token or Student ID / OTP is required"
      });
    }

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        is_valid: false,
        display_status: "PASS NOT FOUND",
        message: "No matching approved gate pass found for the provided details."
      });
    }

    if (gatePass.qrExpiry && gatePass.qrExpiry < new Date()) {
      gatePass.status = "expired";
      await gatePass.save();

      return res.status(400).json({
        success: false,
        is_valid: false,
        display_status: "EXPIRED",
        message: "This pass has expired."
      });
    }

    const now = new Date();
    let actionType = "VERIFIED";

    if (gatePass.isHalfDay) {
      // Half-Day Pass: Single exit cycle only
      if (gatePass.checkOutTime) {
        return res.status(400).json({
          success: false,
          is_valid: false,
          display_status: "ALREADY USED",
          message: `Half-day pass has already been used for exit at ${new Date(gatePass.checkOutTime).toLocaleTimeString()}.`
        });
      }
      gatePass.checkOutTime = now;
      gatePass.status = "used";
      gatePass.scannedAt = now;
      gatePass.scannedBy = req.user.id;
      actionType = "CHECK-OUT (HALF DAY EXIT)";
    } else {
      // Regular Pass: Supports both Check-Out and Check-In with same QR and OTP
      if (!gatePass.checkOutTime) {
        // First scan/OTP: Student Exits Campus
        gatePass.checkOutTime = now;
        gatePass.scannedAt = now;
        gatePass.scannedBy = req.user.id;
        // Keep status as "approved" so student can check in with the same OTP / QR code upon return!
        gatePass.status = "approved";
        actionType = "CHECK-OUT (EXIT)";
      } else if (!gatePass.checkInTime) {
        // Second scan/OTP: Student Returns to Campus
        if (now < new Date(gatePass.checkOutTime)) {
          return res.status(409).json({
            success: false,
            is_valid: false,
            display_status: "INVALID TIME",
            message: "Check-in cannot be recorded before the check-out time."
          });
        }
        gatePass.checkInTime = now;
        gatePass.status = "used"; // Marked completed upon return
        gatePass.scannedAt = now;
        gatePass.scannedBy = req.user.id;
        actionType = "CHECK-IN (RETURN)";
      } else {
        return res.status(400).json({
          success: false,
          is_valid: false,
          display_status: "ALREADY USED",
          message: "Pass has already completed both exit check-out and return check-in."
        });
      }
    }

    await gatePass.save();

    const studentInfo = gatePass.studentId || {};
    const passDetails = {
      student_id: studentInfo.customData?.admissionNo || studentInfo.customData?.rollNumber || studentInfo.customData?.regNo || studentInfo._id || "N/A",
      student_name: studentInfo.fullName || "Student",
      pass_type: gatePass.passType === "special" ? "Special Pass" : (gatePass.isHalfDay ? "Half Day Pass" : "Gate Pass"),
      department: studentInfo.department || gatePass.department || "N/A",
      date_valid_to: gatePass.qrExpiry || gatePass.returnTime || gatePass.departureTime,
      approved_by: gatePass.approverId?.fullName || gatePass.selectedApproverId?.fullName || "Faculty/HOD",
      purpose: gatePass.purpose || gatePass.reason || "N/A",
      departure_time: gatePass.departureTime,
      return_time: gatePass.returnTime,
      check_out_time: gatePass.checkOutTime,
      check_in_time: gatePass.checkInTime,
      otp: gatePass.otp || "N/A",
      action_type: actionType
    };

    return res.json({
      success: true,
      is_valid: true,
      display_status: "ACCESS GRANTED",
      action_type: actionType,
      message: `${actionType} recorded successfully for ${passDetails.student_name}.`,
      studentName: passDetails.student_name,
      email: studentInfo.email || "N/A",
      department: passDetails.department,
      approvedBy: passDetails.approved_by,
      purpose: passDetails.purpose,
      departureTime: gatePass.departureTime,
      returnTime: gatePass.returnTime,
      status: "Verified & Used",
      pass_details: passDetails
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      is_valid: false,
      display_status: "SERVER ERROR",
      message: error.message
    });
  }
};

// =============================
// SECURITY - GET LIVE CHECK-IN LOGS (9 Columns)
// =============================

exports.getSecurityLogs = async (req, res) => {
  try {
    const passes = await GatePass.find({
      scannedAt: { $ne: null }
    })
      .populate("studentId", "fullName email department customData")
      .populate("approverId", "fullName email role")
      .populate("selectedApproverId", "fullName email role")
      .sort({ scannedAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(100);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const logs = passes.map((pass) => {
      const depDate = pass.departureTime ? new Date(pass.departureTime) : new Date(pass.createdAt);
      const retDate = pass.returnTime ? new Date(pass.returnTime) : null;
      const scanDate = pass.scannedAt ? new Date(pass.scannedAt) : null;
      const checkIn = pass.checkInTime ? new Date(pass.checkInTime) : null;
      const checkOut = pass.checkOutTime ? new Date(pass.checkOutTime) : scanDate;

      const dateStr = pass.date || depDate.toLocaleDateString();
      const dayStr = pass.day || days[depDate.getDay()];

      return {
        _id: pass._id,
        pass_id: pass._id,
        studentName: pass.studentId?.fullName || "N/A",
        studentId: pass.studentId?.customData?.admissionNo || pass.studentId?.customData?.rollNumber || pass.studentId?._id || "N/A",
        passType: pass.passType === "special" ? "Special Pass" : "Gate Pass",
        reason: pass.purpose || pass.reason || "Campus Exit",
        department: pass.studentId?.department || pass.department || "N/A",
        approver: pass.approverId?.fullName || pass.selectedApproverId?.fullName || "Faculty/HOD",
        date: dateStr,
        day: dayStr,
        time: checkOut
          ? checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : depDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        returnTime: retDate
          ? retDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A",
        checkInTime: checkIn
          ? checkIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A",
        checkOutTime: checkOut
          ? checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A",
        status: pass.status,
        timestamp: pass.scannedAt || pass.updatedAt || pass.createdAt
      };
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// ADMIN - GET ALL GATE PASSES
// =============================

exports.getAllGatePassesAdmin = async (req, res) => {
  try {
    const passes = await GatePass.find()
      .populate("studentId", "fullName email department")
      .populate("approverId", "fullName email role")
      .populate("selectedApproverId", "fullName email role")
      .sort({ createdAt: -1 });

    res.json(passes);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================
// UTILITY - GET AVAILABLE APPROVERS
// =============================

exports.getAvailableApprovers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const Student = require("../models/Student");
    const studentProfile = await Student.findOne({ user: currentUser._id });
    const semester = studentProfile?.semester || Number(currentUser.customData?.semester) || 1;
    const isSem1or2 = semester < 3;

    // For Sem 1 & 2 students, request goes to General Department HOD / Faculty
    // For Sem 3+ students, request goes to Core Department (primaryDepartment or department)
    let targetDepartments = [];
    if (isSem1or2) {
      targetDepartments = ["General Department"];
    } else {
      const coreDept = currentUser.primaryDepartment || currentUser.department;
      targetDepartments = [coreDept].filter(Boolean);
    }

    // Get all faculty and HOD from target department
    let approvers = await User.find({
      department: { $in: targetDepartments },
      role: { $in: ["faculty", "hod"] }
    })
    .select("fullName email role department")
    .sort({ role: 1, fullName: 1 });

    // Fallback: If student is in Sem 1 & 2 and no staff are assigned specifically to General Department yet,
    // fallback to approvers from student's core department so student is not blocked
    if (approvers.length === 0 && isSem1or2) {
      const fallbackDept = currentUser.primaryDepartment || currentUser.department;
      if (fallbackDept && fallbackDept !== "General Department") {
        approvers = await User.find({
          department: fallbackDept,
          role: { $in: ["faculty", "hod"] }
        })
        .select("fullName email role department")
        .sort({ role: 1, fullName: 1 });
      }
    }

    // Categorize approvers
    const hod = approvers.filter(a => a.role === "hod");
    const faculty = approvers.filter(a => a.role === "faculty");

    res.json({
      success: true,
      department: isSem1or2 ? "General Department" : (currentUser.primaryDepartment || currentUser.department),
      primaryDepartment: currentUser.primaryDepartment || currentUser.department,
      semester,
      hod: hod,
      faculty: faculty,
      all: approvers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// ADMIN CONTROLLER - FIX THIS
// =====================================
exports.getAllGatePassesAdmin = async (req, res) => {
  try {
    // Fetch all gate passes with populated fields
    const gatePasses = await GatePass.find()
      .populate('studentId', 'fullName email rollNumber department')
      .populate('approverId', 'fullName email')
      .populate('scannedBy', 'fullName email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const total = gatePasses.length;
    const pending = gatePasses.filter(p => p.status === 'pending').length;
    const approved = gatePasses.filter(p => p.status === 'approved').length;
    const rejected = gatePasses.filter(p => p.status === 'rejected').length;
    const used = gatePasses.filter(p => p.status === 'used').length;
    const expired = gatePasses.filter(p => p.status === 'expired').length;

    // Return in the format frontend expects
    res.status(200).json({
      success: true,
      gatePasses: gatePasses,
      stats: {
        total,
        pending,
        approved,
        rejected,
        used,
        expired
      }
    });

  } catch (error) {
    console.error("Error in getAllGatePassesAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching gate passes",
      error: error.message
    });
  }
};
