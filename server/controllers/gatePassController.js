const GatePass = require("../models/GatePass");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");


// =============================
// STUDENT - CREATE REQUEST (With Approver Selection)
// =============================

exports.createGatePass = async (req, res) => {
  try {
    const {
      purpose,
      departureTime,
      returnTime,
      selectedApproverRole,
      selectedApproverId
    } = req.body;

    if (
      !purpose ||
      !departureTime ||
      !returnTime ||
      !selectedApproverRole
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including approver selection are required"
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

    const gatePass = await GatePass.create({
      studentId: req.user.id,
      purpose,
      departureTime,
      returnTime,
      selectedApproverRole,
      selectedApproverId: selectedApproverRole === "other" ? selectedApproverId : null
    });

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
    .sort({ createdAt: -1 });

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

    // For HOD: Show all pending requests from their department
    // For Faculty: Show requests assigned to them or "faculty" role
    if (currentUser.role === "hod") {
      // HOD can see all pending requests from their department
      const students = await User.find({ 
        department: currentUser.department,
        role: "student"
      }).select("_id");
      
      query.studentId = { $in: students.map(s => s._id) };
    } else if (currentUser.role === "faculty") {
      // Faculty can see:
      // 1. Requests where they are specifically selected (selectedApproverRole = "other" AND selectedApproverId = their ID)
      // 2. Requests where faculty is selected as approver (selectedApproverRole = "faculty")
      // 3. Requests from their department students
      
      const students = await User.find({ 
        department: currentUser.department,
        role: "student"
      }).select("_id");
      
      query.$or = [
        { 
          selectedApproverRole: "other",
          selectedApproverId: currentUser._id
        },
        { 
          selectedApproverRole: "faculty",
          studentId: { $in: students.map(s => s._id) }
        },
        {
          selectedApproverRole: "hod",
          studentId: { $in: students.map(s => s._id) }
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
// HOD/FACULTY - APPROVE (With Role-Based Validation)
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

    // 1. Check if user is HOD and request is from their department
    if (currentUser.role === "hod") {
      if (gatePass.studentId.department === currentUser.department) {
        isAuthorized = true;
      }
    }
    // 2. Check if user is faculty and:
    else if (currentUser.role === "faculty") {
      // a. Faculty is specifically selected as approver
      if (gatePass.selectedApproverRole === "other" && 
          gatePass.selectedApproverId && 
          gatePass.selectedApproverId._id.toString() === currentUser._id.toString()) {
        isAuthorized = true;
      }
      // b. Faculty is approving as general faculty (selectedApproverRole = "faculty")
      else if (gatePass.selectedApproverRole === "faculty" && 
               gatePass.studentId.department === currentUser.department) {
        isAuthorized = true;
      }
      // c. Faculty is approving HOD requests from their department
      else if (gatePass.selectedApproverRole === "hod" && 
               gatePass.studentId.department === currentUser.department) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this gate pass"
      });
    }

    // Generate unique token & 3-digit verification OTP
    const qrToken = uuidv4();
    const otpCode = Math.floor(100 + Math.random() * 900).toString();

    gatePass.status = "approved";
    gatePass.approverId = req.user.id;
    gatePass.qrToken = qrToken;
    gatePass.otp = otpCode;
    gatePass.qrExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000);
    
    // Track if approved by delegation (faculty approving HOD requests)
    if (currentUser.role === "faculty" && gatePass.selectedApproverRole === "hod") {
      gatePass.approvedByDelegation = true;
    }

    await gatePass.save();

    const qrImage = await QRCode.toDataURL(qrToken);

    res.json({
      success: true,
      message: "Gate Pass Approved Successfully",
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
// HOD/FACULTY - REJECT (With Role-Based Validation)
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

    if (currentUser.role === "hod") {
      if (gatePass.studentId.department === currentUser.department) {
        isAuthorized = true;
      }
    } else if (currentUser.role === "faculty") {
      if (gatePass.selectedApproverRole === "other" && 
          gatePass.selectedApproverId && 
          gatePass.selectedApproverId._id.toString() === currentUser._id.toString()) {
        isAuthorized = true;
      }
      else if (gatePass.selectedApproverRole === "faculty" && 
               gatePass.studentId.department === currentUser.department) {
        isAuthorized = true;
      }
      else if (gatePass.selectedApproverRole === "hod" && 
               gatePass.studentId.department === currentUser.department) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this gate pass"
      });
    }

    gatePass.status = "rejected";
    gatePass.approverId = req.user.id;

    await gatePass.save();

    res.json({
      success: true,
      message: "Gate Pass Rejected Successfully"
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

    const qrKey = token || qr_token;
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

      // Fallback: If OTP wasn't stored on an older pass, check if pass matches student and is approved
      if (!gatePass && studentUserIds.length > 0) {
        gatePass = await GatePass.findOne({
          studentId: { $in: studentUserIds },
          status: "approved"
        })
          .sort({ updatedAt: -1, createdAt: -1 })
          .populate("studentId", "fullName email department customData")
          .populate("approverId", "fullName email role")
          .populate("selectedApproverId", "fullName email role");
      }
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

    if (gatePass.status === "used" && gatePass.checkOutTime && gatePass.checkInTime) {
      return res.status(400).json({
        success: false,
        is_valid: false,
        display_status: "ALREADY USED",
        message: "Pass has already been completed (Check-in & Check-out recorded)."
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
    gatePass.status = "used";
    gatePass.scannedAt = now;
    gatePass.scannedBy = req.user.id;

    if (!gatePass.checkOutTime) {
      gatePass.checkOutTime = now;
    } else if (!gatePass.checkInTime) {
      gatePass.checkInTime = now;
    }

    await gatePass.save();

    const studentInfo = gatePass.studentId || {};
    const passDetails = {
      student_id: studentInfo.customData?.admissionNo || studentInfo.customData?.rollNumber || studentInfo.customData?.regNo || studentInfo._id || "N/A",
      student_name: studentInfo.fullName || "Student",
      pass_type: gatePass.passType === "special" ? "Special Pass" : "Gate Pass",
      department: studentInfo.department || gatePass.department || "N/A",
      date_valid_to: gatePass.qrExpiry || gatePass.returnTime,
      approved_by: gatePass.approverId?.fullName || gatePass.selectedApproverId?.fullName || "Faculty/HOD",
      purpose: gatePass.purpose || gatePass.reason || "N/A",
      departure_time: gatePass.departureTime,
      return_time: gatePass.returnTime,
      check_out_time: gatePass.checkOutTime,
      check_in_time: gatePass.checkInTime
    };

    return res.json({
      success: true,
      is_valid: true,
      display_status: "ACCESS GRANTED",
      message: `Pass verified successfully for ${passDetails.student_name}.`,
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
      $or: [
        { status: "used" },
        { scannedAt: { $ne: null } },
        { status: "approved" }
      ]
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
    
    if (!currentUser || !currentUser.department) {
      return res.status(400).json({
        success: false,
        message: "User department not found"
      });
    }

    // Get all faculty and HOD from the same department
    const approvers = await User.find({
      department: currentUser.department,
      role: { $in: ["faculty", "hod"] }
    })
    .select("fullName email role department")
    .sort({ role: 1, fullName: 1 });

    // Categorize approvers
    const hod = approvers.filter(a => a.role === "hod");
    const faculty = approvers.filter(a => a.role === "faculty");

    res.json({
      success: true,
      department: currentUser.department,
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