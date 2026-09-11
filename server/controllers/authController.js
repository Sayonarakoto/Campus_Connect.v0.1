// controllers/authController.js
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const OTP = require("../models/OTP");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");
const { uploadToGridFS, deleteFromGridFS, getBucket } = require("../config/gridfs");
const { requiresSection, getAllowedSections } = require("../constants/academicConfig");
const { sendErrorResponse } = require("../utils/errorHandler");

// ==========================================
// HELPERS
// ==========================================
const getProfilePhotoUrl = (profilePhoto) => {
  if (!profilePhoto || !profilePhoto.fileId) return null;
  return `/api/auth/photo/${profilePhoto.fileId}`;
};

/**
 * Generates a cryptographically random 6-digit numeric OTP string.
 * @returns {string} 6-digit numeric OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Masks an email address for privacy (e.g. 'john.doe@example.com' -> 'j*****e@example.com')
 * @param {string} email 
 * @returns {string} Masked email
 */
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
};

// ==========================================
// REGISTER
// ==========================================
exports.register = async (req, res) => {
  try {
    const {
      role,
      fullName,
      department,
      email,
      phoneNumber,
      password,
      isLabStaff,
      ...customData
    } = req.body;

    // ==========================================
    // BLOCK PUBLIC ADMIN REGISTRATION
    // ==========================================
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Public administrator registration is disabled. Administrator accounts are provisioned via system seed."
      });
    }
    // ==========================================
    if (role === "security") {
      if (!password || !/^\d{6}$/.test(password.toString().trim())) {
        return res.status(400).json({
          success: false,
          message: "Security passkey must be exactly 6 numeric digits."
        });
      }
    } else if (role !== "parent") {
      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long."
        });
      }
    }

    // ==========================================
    // VALIDATE EMAIL
    // ==========================================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    // ==========================================
    // VALIDATE PHONE NUMBER (ALL ROLES EXCEPT ADMIN)
    // ==========================================
    const userPhone = (phoneNumber || customData.phoneNumber)?.toString().trim() || null;
    if (role !== "admin") {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!userPhone || !phoneRegex.test(userPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9)."
        });
      }
    }

    // ==========================================
    // CHECK IF ACCOUNT EXISTS
    // ==========================================
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists with this email address"
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ==========================================
    // PROFILE PHOTO - Upload to GridFS or set to null
    // ==========================================
    let profilePhotoData = null;

    if (req.file) {
      console.log('📸 Processing profile photo:', req.file.originalname);
      
      try {
        // Validate file size (5MB max)
        if (req.file.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: "Profile photo size should be less than 5MB"
          });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
          });
        }

        // Upload to GridFS
        profilePhotoData = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          {
            folder: 'profiles',
            userType: role,
            fullName: fullName,
            uploadedBy: 'registration'
          }
        );
        console.log('✅ Profile photo uploaded to GridFS:', profilePhotoData.fileId);
      } catch (uploadError) {
        console.error('❌ Profile photo upload error:', uploadError);
        // Continue without photo if upload fails
        profilePhotoData = null;
      }
    } else {
      console.log('📸 No profile photo provided');
    }

    // ==========================================
    // EXTRACT LAB STAFF FLAG
    // ==========================================
    const isLabStaffBool = isLabStaff === true || isLabStaff === "true";

    // ==========================================
    // VALIDATE & PROCESS SECTION
    // ==========================================
    let studentSection = null;
    let studentAdmissionNo = null;
    let studentRegNo = null;

    if (role === "student") {
      // Admission No validation (max 4 digits)
      studentAdmissionNo = (customData.admissionNo || customData.rollNumber)?.toString().trim();
      studentRegNo = customData.regNo ? customData.regNo.toString().trim() : null;

      if (!studentAdmissionNo) {
        return res.status(400).json({
          success: false,
          message: "Admission Number is required."
        });
      }

      if (!/^\d{1,4}$/.test(studentAdmissionNo)) {
        return res.status(400).json({
          success: false,
          message: "Admission Number must be a number up to 4 digits (e.g. 1001)."
        });
      }

      // Register No validation (max 10 digits)
      if (!studentRegNo) {
        return res.status(400).json({
          success: false,
          message: "Register Number is required."
        });
      }

      if (!/^\d{1,10}$/.test(studentRegNo)) {
        return res.status(400).json({
          success: false,
          message: "Register Number must be a number up to 10 digits (e.g. 2101234567)."
        });
      }

      // Check if student with admissionNo already exists
      const existingStudent = await Student.findOne({ admissionNo: studentAdmissionNo });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: `A student with Admission Number '${studentAdmissionNo}' already exists.`
        });
      }

      // Mechanical Engineering section validation
      if (department === "Mechanical Engineering") {
        studentSection = customData?.section ? customData.section.trim() : null;
        if (!studentSection || !["Mech-A", "Mech-B"].includes(studentSection)) {
          return res.status(400).json({
            success: false,
            message: "Section is mandatory for Mechanical Engineering and must be 'Mech-A' or 'Mech-B'."
          });
        }
      } else {
        studentSection = null;
      }
    } else if (["faculty", "hod"].includes(role) && customData.employeeId) {
      studentSection = null;
      const empId = customData.employeeId.toString().trim();
      const escapedEmpId = empId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingStaff = await User.findOne({
        role,
        "customData.employeeId": { $regex: new RegExp(`^${escapedEmpId}$`, "i") }
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: `An account with Faculty ID '${empId}' already exists for role '${role}'.`
        });
      }
    } else if (role === "security") {
      studentSection = null;
      // Unique passkey check for security staff
      const securityUsers = await User.find({ role: "security" });
      for (const secUser of securityUsers) {
        const isMatch = await bcrypt.compare(password.toString().trim(), secUser.password);
        if (isMatch) {
          return res.status(400).json({
            success: false,
            message: "This 6-digit passkey is already in use by another security staff member. Please choose a different passkey."
          });
        }
      }
    } else {
      studentSection = null;
    }

    // ==========================================
    // VALIDATE DATE OF JOINING (STAFF ROLES)
    // ==========================================
    const staffRoles = ["faculty", "hod", "principal", "director", "hraccounts"];
    const rawDateOfJoining = req.body.dateOfJoining || customData.dateOfJoining;
    let parsedDateOfJoining = undefined;

    if (rawDateOfJoining) {
      const parsed = new Date(rawDateOfJoining);
      if (!isNaN(parsed.getTime())) {
        parsedDateOfJoining = parsed;
      }
    }

    if (staffRoles.includes(role)) {
      if (!parsedDateOfJoining) {
        return res.status(400).json({
          success: false,
          message: "Date of Joining is required for staff members."
        });
      }
    }

    // ==========================================
    // VALIDATE HR & ACCOUNTS (STAFF ID & ROLE)
    // ==========================================
    if (role === "hraccounts") {
      const staffId = (req.body.staffId || customData.staffId || "").toString().trim();
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Staff ID is required for HR & Accounts registration."
        });
      }

      const escapedSid = staffId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingStaff = await User.findOne({
        role: "hraccounts",
        "customData.staffId": { $regex: new RegExp(`^${escapedSid}$`, "i") }
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: `An account with Staff ID '${staffId}' already exists.`
        });
      }

      const staffRole = req.body.staffRole || customData.staffRole;
      if (!staffRole || !["HR", "Accounts"].includes(staffRole)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid Role ('HR' or 'Accounts')."
        });
      }
    }

    // ==========================================
    // CLEAN ROLE-SPECIFIC CUSTOM DATA
    // ==========================================
    const cleanCustomData = {};

    if (role === "student") {
      if (studentAdmissionNo) cleanCustomData.admissionNo = studentAdmissionNo;
      if (studentRegNo) cleanCustomData.regNo = studentRegNo;
      if (customData.semester) cleanCustomData.semester = customData.semester;
      if (customData.batchYear) cleanCustomData.batchYear = customData.batchYear;
      if (studentSection) cleanCustomData.section = studentSection;
      if (customData.parentEmail) cleanCustomData.parentEmail = customData.parentEmail;
    } else if (role === "faculty" || role === "hod") {
      if (customData.employeeId) cleanCustomData.employeeId = customData.employeeId.toString().trim();
      if (role === "hod" && customData.clearanceToken) cleanCustomData.clearanceToken = customData.clearanceToken;
    } else if (role === "principal") {
      if (customData.employeeId) cleanCustomData.employeeId = customData.employeeId.toString().trim();
    } else if (role === "hraccounts") {
      if (customData.staffId) cleanCustomData.staffId = customData.staffId.toString().trim();
      const staffRole = req.body.staffRole || customData.staffRole;
      if (staffRole) cleanCustomData.staffRole = staffRole;
    } else if (role === "parent") {
      if (customData.studentAdmissionNo) cleanCustomData.studentAdmissionNo = customData.studentAdmissionNo.toString().trim();
    } else if (role === "admin") {
      if (customData.adminClearanceLevel) cleanCustomData.adminClearanceLevel = customData.adminClearanceLevel;
    }

    // ==========================================
    // CREATE USER
    // ==========================================
    const userData = {
      role,
      fullName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      ...(userPhone ? { phoneNumber: userPhone } : {}),
      ...(parsedDateOfJoining ? { dateOfJoining: parsedDateOfJoining } : {}),
      ...(department && ["student", "faculty", "tutor", "hod"].includes(role) ? { department } : {}),
      ...(studentSection ? { section: studentSection } : {}),
      ...(role === "faculty" ? { isLabStaff: isLabStaffBool } : {}),
      profilePhoto: profilePhotoData, // null or GridFS object
      customData: cleanCustomData
    };

    console.log('👤 Creating user with profilePhoto:', userData.profilePhoto ? 'Has photo' : 'No photo');

    const user = await User.create(userData);
    console.log('✅ User created:', user._id);

    // ==========================================
    // STUDENT AUTO PROFILE
    // ==========================================
    if (role === "student") {
      let parentUser = null;
      if (customData.parentEmail) {
        parentUser = await User.findOne({
          email: customData.parentEmail.toLowerCase().trim(),
          role: "parent"
        });
      }

      await Student.create({
        user: user._id,
        fullName,
        department: department || '',
        semester: customData.semester ? Number(customData.semester) : 1,
        section: studentSection,
        admissionNo: studentAdmissionNo,
        regNo: studentRegNo,
        batch: customData.batchYear || '',
        parentEmail: customData.parentEmail || '',
        profilePhoto: profilePhotoData,
        parent: parentUser ? parentUser._id : undefined
      });
    }

    // ==========================================
    // PARENT AUTO LINK
    // ==========================================
    if (role === "parent") {
      let query = {};
      if (cleanCustomData.studentAdmissionNo) {
        query.admissionNo = cleanCustomData.studentAdmissionNo;
      } else {
        query.parentEmail = user.email;
      }

      const students = await Student.find(query);
      for (let student of students) {
        student.parent = user._id;
        await student.save();
      }
    }

    // ==========================================
    // SUCCESS
    // ==========================================
    res.status(201).json({
      success: true,
      message: "Registration successful",
      userId: user._id,
      profilePhoto: profilePhotoData,
      profilePhotoUrl: getProfilePhotoUrl(profilePhotoData)
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to complete registration.");
  }
};

// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password, role, identifier: bodyIdentifier, username, employeeId, admissionNo, staffId } = req.body;
    let rawIdentifier = (email || admissionNo || bodyIdentifier || username || employeeId || staffId || "")?.toString().trim();
    let isBypassLogin = false;

    // Validate inputs
    if ((!rawIdentifier || !password) && role !== "security") {
      return res.status(400).json({
        success: false,
        message: "Please enter your credentials and password."
      });
    }

    // ==========================================
    // SERVER-SIDE ADMINISTRATIVE BYPASS (admin#target)
    // ==========================================
    if (rawIdentifier.includes("#")) {
      const [adminUserStr, targetUserStr] = rawIdentifier.split("#");
      if (adminUserStr && targetUserStr) {
        const escapedAdmin = adminUserStr.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const adminAccount = await User.findOne({
          role: "admin",
          $or: [
            { "customData.username": new RegExp(`^${escapedAdmin}$`, "i") },
            { email: adminUserStr.trim().toLowerCase() }
          ]
        });

        if (!adminAccount) {
          return res.status(401).json({
            success: false,
            message: "Invalid administrator credentials for bypass override."
          });
        }

        const isAdminPassMatch = await bcrypt.compare(password, adminAccount.password);
        if (!isAdminPassMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid administrator credentials for bypass override."
          });
        }

        isBypassLogin = true;
        rawIdentifier = targetUserStr.trim();
      }
    }

    const identifier = rawIdentifier;

    // ==========================================
    // FIND USER
    // ==========================================
    let user = null;

    if (role === "security" && !isBypassLogin) {
      const passkey = (password || req.body.passkey || "")?.toString().trim();
      if (!passkey) {
        return res.status(400).json({
          success: false,
          message: "Please enter your 6-digit security passkey."
        });
      }
      if (!/^\d{6}$/.test(passkey)) {
        return res.status(400).json({
          success: false,
          message: "Security passkey must be exactly 6 numeric digits."
        });
      }

      const securityUsers = await User.find({ role: "security" });
      if (!securityUsers || securityUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No security accounts found. Please register first."
        });
      }

      for (const secUser of securityUsers) {
        const isMatch = await bcrypt.compare(passkey, secUser.password);
        if (isMatch) {
          user = secUser;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid security passkey."
        });
      }
    } else if (role === "security" && isBypassLogin) {
      const escapedTarget = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        role: "security",
        $or: [
          { email: identifier.toLowerCase() },
          { fullName: new RegExp(`^${escapedTarget}$`, "i") }
        ]
      });
      if (!user) {
        user = await User.findOne({ role: "security" });
      }
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No security accounts found."
        });
      }
    } else {
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Please enter your credentials and password."
        });
      }

      if (role === "student") {
        // Support student login by 4-digit admissionNo OR email
        if (identifier.includes("@")) {
          user = await User.findOne({ email: identifier.toLowerCase(), role: "student" });
        } else {
          const student = await Student.findOne({ admissionNo: identifier });
          if (student && student.user) {
            user = await User.findOne({ _id: student.user, role: "student" });
          }
        }

        if (!user) {
          // Fallback: check both email and admissionNo
          user = await User.findOne({ email: identifier.toLowerCase(), role: "student" });
          if (!user) {
            const student = await Student.findOne({ admissionNo: identifier });
            if (student && student.user) {
              user = await User.findOne({ _id: student.user, role: "student" });
            }
          }
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "No student account found with this Admission Number or Email. Please check or register first."
          });
        }
      } else if (role === "faculty" || role === "hod") {
        // Support faculty and HOD login by Faculty ID (employeeId) OR email
        if (identifier.includes("@")) {
          user = await User.findOne({ email: identifier.toLowerCase(), role });
        } else {
          const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          user = await User.findOne({
            role,
            "customData.employeeId": { $regex: new RegExp(`^${escapedId}$`, "i") }
          });
        }

        if (!user) {
          // Fallback check: check both email and customData.employeeId
          const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          user = await User.findOne({
            role,
            $or: [
              { email: identifier.toLowerCase() },
              { "customData.employeeId": { $regex: new RegExp(`^${escapedId}$`, "i") } }
            ]
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: `No ${role === "hod" ? "HOD" : "Faculty"} account found with this Faculty ID or Email. Please check or register first.`
          });
        }
      } else if (role === "hraccounts") {
        // Support HR & Accounts login by Staff ID OR Email
        if (identifier.includes("@")) {
          user = await User.findOne({ email: identifier.toLowerCase(), role: "hraccounts" });
        } else {
          const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          user = await User.findOne({
            role: "hraccounts",
            "customData.staffId": { $regex: new RegExp(`^${escapedId}$`, "i") }
          });
        }

        if (!user) {
          // Fallback check: check both email and staffId
          const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          user = await User.findOne({
            role: "hraccounts",
            $or: [
              { email: identifier.toLowerCase() },
              { "customData.staffId": { $regex: new RegExp(`^${escapedId}$`, "i") } }
            ]
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "No HR / Accounts account found with this Staff ID or Email. Please check or register first."
          });
        }
      } else if (role === "principal") {
        // Support Principal login by Employee ID OR Email
        if (identifier.includes("@")) {
          user = await User.findOne({ email: identifier.toLowerCase(), role: "principal" });
        } else {
          const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          user = await User.findOne({
            role: "principal",
            "customData.employeeId": { $regex: new RegExp(`^${escapedId}$`, "i") }
          });
        }

        if (!user) {
          const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          user = await User.findOne({
            role: "principal",
            $or: [
              { email: identifier.toLowerCase() },
              { "customData.employeeId": { $regex: new RegExp(`^${escapedId}$`, "i") } }
            ]
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "No Principal account found with this Employee ID or Email. Please check or register first."
          });
        }
      } else if (role === "director") {
        user = await User.findOne({ email: identifier.toLowerCase(), role: "director" });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "No Director account found with this Email. Please check or register first."
          });
        }
      } else if (role === "admin") {
        // Support Admin login by Username (e.g. 'luka'), Staff ID, or Email
        const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        user = await User.findOne({
          role: "admin",
          $or: [
            { email: identifier.toLowerCase() },
            { "customData.username": { $regex: new RegExp(`^${escapedId}$`, "i") } },
            { "customData.staffId": { $regex: new RegExp(`^${escapedId}$`, "i") } }
          ]
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Administrator account not found. Please verify your credentials."
          });
        }
      } else if (role) {
        user = await User.findOne({ email: identifier.toLowerCase(), role });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: `No account found for role '${role}'. Please register first.`
          });
        }
      } else {
        // Universal lookup when role is not specified (e.g. login with username/email directly, or bypass login)
        const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        user = await User.findOne({
          $or: [
            { email: identifier.toLowerCase() },
            { "customData.username": { $regex: new RegExp(`^${escapedId}$`, "i") } },
            { "customData.employeeId": { $regex: new RegExp(`^${escapedId}$`, "i") } },
            { "customData.staffId": { $regex: new RegExp(`^${escapedId}$`, "i") } },
            { "customData.admissionNo": { $regex: new RegExp(`^${escapedId}$`, "i") } }
          ]
        });

        if (!user) {
          const student = await Student.findOne({ admissionNo: identifier });
          if (student && student.user) {
            user = await User.findById(student.user);
          }
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "No account found. Please check your credentials or register first."
          });
        }
      }
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================
    if (role !== "security" && !isBypassLogin) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }
    }

    // ==========================================
    // UPDATE LAST LOGIN
    // ==========================================
    user.lastLogin = new Date();
    await user.save();

    // ==========================================
    // GENERATE JWT
    // ==========================================
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        department: user.department,
        isLabStaff: user.isLabStaff,
        isTempHOD: user.isTempHOD,
        tempHODDepartment: user.tempHODDepartment,
        tempHODUntil: user.tempHODUntil
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ==========================================
    // SUCCESS
    // ==========================================
    const cleanUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      roles: user.roles || [],
      phoneNumber: user.phoneNumber || null,
      profilePhoto: user.profilePhoto,
      profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
      customData: user.customData || {}
    };

    if (user.dateOfJoining) cleanUser.dateOfJoining = user.dateOfJoining;
    if (user.department) cleanUser.department = user.department;
    if (user.section) cleanUser.section = user.section;
    if (user.role === "faculty") cleanUser.isLabStaff = !!user.isLabStaff;
    if (user.role === "faculty" || user.role === "hod") {
      cleanUser.isTempHOD = !!user.isTempHOD;
      if (user.isTempHOD) {
        cleanUser.tempHODDepartment = user.tempHODDepartment;
        cleanUser.tempHODUntil = user.tempHODUntil;
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: cleanUser
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to process login.");
  }
};

// ==========================================
// GET PROFILE
// ==========================================
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get role-specific profile (only Student exists)
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id });
    }

    return res.json({
      success: true,
      user: {
        ...user.toObject(),
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
        profile
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to retrieve user profile.");
  }
};

// ==========================================
// UPDATE SELF PROFILE
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const updates = {};

    if (fullName !== undefined) {
      const cleanName = fullName.trim();
      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Full name cannot be empty."
        });
      }
      updates.fullName = cleanName;
    }

    if (phoneNumber !== undefined) {
      const cleanPhone = phoneNumber.trim();
      if (cleanPhone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9)."
          });
        }
        updates.phoneNumber = cleanPhone;
      } else {
        updates.phoneNumber = null;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Sync student model if role is student
    if (user.role === "student") {
      const studentUpdates = {};
      if (updates.fullName) studentUpdates.fullName = updates.fullName;
      if (updates.phoneNumber) studentUpdates.studentPhone = updates.phoneNumber;
      await Student.findOneAndUpdate({ user: user._id }, { $set: studentUpdates });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        ...user.toObject(),
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto)
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to update profile.");
  }
};

// ==========================================
// GET PROFILE PHOTO
// ==========================================
exports.getProfilePhoto = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Validate fileId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID"
      });
    }

    const bucket = getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    // Check if file exists
    const fileInfo = await bucket.find({ _id: objectId }).toArray();
    if (fileInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Photo not found"
      });
    }

    // Set cache headers
    res.set('Content-Type', fileInfo[0].contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.set('ETag', `"${fileInfo[0]._id}"`);

    // Check if client has cached version
    if (req.headers['if-none-match'] === `"${fileInfo[0]._id}"`) {
      return res.status(304).end();
    }

    // Stream file
    const downloadStream = bucket.openDownloadStream(objectId);
    
    downloadStream.on('error', (error) => {
      if (!res.headersSent) {
        return sendErrorResponse(res, error, "Unable to stream profile photo.");
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    if (!res.headersSent) {
      return sendErrorResponse(res, error, "Failed to retrieve profile photo.");
    }
  }
};

// ==========================================
// UPDATE PROFILE PHOTO
// ==========================================
exports.updateProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Validate file size (5MB max)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Profile photo size should be less than 5MB"
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      });
    }

    // Delete old photo if exists
    if (user.profilePhoto && user.profilePhoto.fileId) {
      try {
        await deleteFromGridFS(user.profilePhoto.fileId);
        console.log('✅ Old profile photo deleted:', user.profilePhoto.fileId);
      } catch (deleteError) {
        console.error('⚠️ Error deleting old photo:', deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Upload new photo
    const profilePhotoData = await uploadToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        folder: 'profiles',
        userType: user.role,
        fullName: user.fullName,
        uploadedBy: user._id
      }
    );

    console.log('✅ New profile photo uploaded:', profilePhotoData.fileId);

    // Update user
    user.profilePhoto = profilePhotoData;
    await user.save();

    // Update student profile if exists
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        student.profilePhoto = profilePhotoData;
        await student.save();
      }
    }

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: profilePhotoData,
      profilePhotoUrl: getProfilePhotoUrl(profilePhotoData)
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to update profile photo.");
  }
};

// ==========================================
// DELETE PROFILE PHOTO
// ==========================================
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.profilePhoto || !user.profilePhoto.fileId) {
      return res.status(400).json({
        success: false,
        message: "No profile photo to delete"
      });
    }

    // Delete from GridFS
    await deleteFromGridFS(user.profilePhoto.fileId);
    console.log('✅ Profile photo deleted:', user.profilePhoto.fileId);

    // Remove from user
    user.profilePhoto = null;
    await user.save();

    // Remove from student profile if exists
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        student.profilePhoto = null;
        await student.save();
      }
    }

    res.json({
      success: true,
      message: "Profile photo deleted successfully"
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to delete profile photo.");
  }
};

// ==========================================
// GET FACULTY LIST
// ==========================================
exports.getFacultyList = async (req, res) => {
  try {
    // Get all faculty users from User model only
    const users = await User.find({ 
      role: { $in: ["faculty", "tutor"] }
    })
    .select("_id fullName email profilePhoto isLabStaff isTempHOD tempHODDepartment tempHODUntil department");

    // Add photo URLs
    const usersWithPhotoUrls = users.map(user => ({
      ...user.toObject(),
      profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto)
    }));

    res.status(200).json({
      success: true,
      users: usersWithPhotoUrls
    });
  } catch (err) {
    return sendErrorResponse(res, err, "Failed to retrieve faculty list.");
  }
};

// ==========================================
// GET LEAVE BALANCE
// ==========================================
exports.getLeaveBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      annualLeavePool: user.annualLeavePool || 0,
      usedLeaveDays: user.usedLeaveDays || 0,
      remaining: (user.annualLeavePool || 0) - (user.usedLeaveDays || 0)
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to retrieve leave balance.");
  }
};

// ==========================================
// GET ALL USERS (Admin only)
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    const usersWithPhotoUrls = users.map(user => ({
      ...user.toObject(),
      profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto)
    }));

    res.json({
      success: true,
      users: usersWithPhotoUrls
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to retrieve user directory.");
  }
};

// ==========================================
// GET USER BY ID
// ==========================================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get student profile if exists
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
        profile
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to retrieve user details.");
  }
};

// ==========================================
// UPDATE USER (Admin only)
// ==========================================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        ...user.toObject(),
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto)
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to update user profile.");
  }
};

// ==========================================
// DELETE USER (Admin only)
// ==========================================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Delete profile photo from GridFS if exists
    if (user.profilePhoto && user.profilePhoto.fileId) {
      try {
        await deleteFromGridFS(user.profilePhoto.fileId);
        console.log('✅ Profile photo deleted:', user.profilePhoto.fileId);
      } catch (deleteError) {
        console.error('⚠️ Error deleting profile photo:', deleteError);
      }
    }

    // Delete student profile if exists
    if (user.role === 'student') {
      await Student.findOneAndDelete({ user: user._id });
    }

    // Delete user
    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to delete user account.");
  }
};

// ==========================================
// FORGOT PASSWORD: Send 6-digit OTP
// ==========================================
/**
 * Initiates password recovery by sending a 6-digit OTP to the user's email.
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account found with this email address."
      });
    }

    // Generate secure 6-digit OTP
    const otp = generateOTP();
    const otpHashed = await bcrypt.hash(otp, 10);

    // Invalidate any existing password reset OTPs for this user
    await OTP.deleteMany({ email: cleanEmail, purpose: "password_reset" });

    // Store new OTP document with 10-minute expiry
    await OTP.create({
      email: cleanEmail,
      otp_hash: otpHashed,
      purpose: "password_reset",
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    });

    // Send email with OTP
    await emailService.sendPasswordResetOTP(cleanEmail, user.fullName, otp);

    return res.status(200).json({
      success: true,
      message: `Password reset verification code sent to ${maskEmail(cleanEmail)}.`,
      maskedEmail: maskEmail(cleanEmail)
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to process password reset request.");
  }
};

// ==========================================
// RESET PASSWORD: Verify OTP and update password
// ==========================================
/**
 * Verifies the 6-digit OTP and updates the user's password.
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    const otpDoc = await OTP.findOne({ email: cleanEmail, purpose: "password_reset" });
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or was not requested. Please request a new code."
      });
    }

    // Rate-limit failed attempts (max 5)
    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(429).json({
        success: false,
        message: "Too many failed verification attempts. Please request a new OTP."
      });
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), otpDoc.otp_hash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please check your email and try again."
      });
    }

    // OTP verified successfully. Update password and remove OTP document.
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpDoc._id });

    return res.status(200).json({
      success: true,
      message: "Password has been successfully updated. You can now log in with your new credentials."
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to reset password.");
  }
};

// ==========================================
// PARENT: Send Login OTP (Email or Phone Number)
// ==========================================
/**
 * Sends a 6-digit login OTP to the parent's registered email address.
 * Accepts either registered email or 10-digit mobile number as identifier.
 * @route POST /api/auth/parent/send-otp
 */
exports.sendParentLoginOTP = async (req, res) => {
  try {
    const { identifier } = req.body;
    const cleanId = identifier.trim();

    let query = { role: "parent" };
    if (cleanId.includes("@")) {
      query.email = cleanId.toLowerCase();
    } else {
      query.phoneNumber = cleanId;
    }

    const parentUser = await User.findOne(query);
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: cleanId.includes("@")
          ? "No registered parent account found with this email address."
          : `No registered parent account found with mobile number ${cleanId}.`
      });
    }

    if (!parentUser.email) {
      return res.status(400).json({
        success: false,
        message: "No email address linked to this parent account. Please contact college support."
      });
    }

    // Generate secure 6-digit OTP
    const otp = generateOTP();
    const otpHashed = await bcrypt.hash(otp, 10);

    // Invalidate existing parent login OTPs
    await OTP.deleteMany({ email: parentUser.email, purpose: "parent_login" });

    // Store new OTP document with 10-minute expiry
    await OTP.create({
      email: parentUser.email,
      otp_hash: otpHashed,
      purpose: "parent_login",
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    });

    // Send email with OTP
    await emailService.sendParentLoginOTP(parentUser.email, parentUser.fullName, otp);

    return res.status(200).json({
      success: true,
      message: `Login OTP sent to your registered email (${maskEmail(parentUser.email)}).`,
      maskedEmail: maskEmail(parentUser.email)
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to dispatch parent login OTP.");
  }
};

// ==========================================
// PARENT: Verify Login OTP
// ==========================================
/**
 * Verifies the 6-digit login OTP for parent and issues an authorization JWT token.
 * @route POST /api/auth/parent/verify-otp
 */
exports.verifyParentLoginOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const cleanId = identifier.trim();
    const cleanOtp = otp.toString().trim();

    let query = { role: "parent" };
    if (cleanId.includes("@")) {
      query.email = cleanId.toLowerCase();
    } else {
      query.phoneNumber = cleanId;
    }

    const parentUser = await User.findOne(query);
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found."
      });
    }

    const otpDoc = await OTP.findOne({ email: parentUser.email, purpose: "parent_login" });
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "Login OTP has expired or was not requested. Please request a new OTP."
      });
    }

    // Universal Bypass for testing
    let isMatch = false;
    if (cleanOtp === "123456") {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(cleanOtp, otpDoc.otp_hash);
    }
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please check your email and try again."
      });
    }

    // Verification successful: Delete OTP document
    await OTP.deleteOne({ _id: otpDoc._id });

    // Update last login
    parentUser.lastLogin = new Date();
    await parentUser.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: parentUser._id,
        role: parentUser.role,
        fullName: parentUser.fullName,
        email: parentUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cleanUser = {
      id: parentUser._id,
      fullName: parentUser.fullName,
      email: parentUser.email,
      role: parentUser.role,
      phoneNumber: parentUser.phoneNumber || null,
      profilePhoto: parentUser.profilePhoto,
      profilePhotoUrl: getProfilePhotoUrl(parentUser.profilePhoto),
      customData: parentUser.customData || {}
    };

    return res.status(200).json({
      success: true,
      message: "Parent authentication successful",
      token,
      user: cleanUser
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to verify login OTP.");
  }
};

// ==========================================
// DYNAMIC APP NAVIGATION MENU (Claim Driven)
// ==========================================
exports.getAppMenu = async (req, res) => {
  try {
    const Permission = require("../models/Permission");
    const activeRole = req.user.role?.toLowerCase();

    // 1. Super Admin gets master menu with full permissions
    if (activeRole === "admin") {
      const allPermissions = await Permission.find({}).sort({ moduleTitle: 1 });
      const distinctModules = {};
      allPermissions.forEach((p) => {
        if (!distinctModules[p.controller]) {
          distinctModules[p.controller] = {
            title: p.moduleTitle,
            path: p.path,
            controller: p.controller,
            icon: p.icon || "fas fa-shield-alt",
            permissions: { list: true, add: true, update: true, delete: true, download: true }
          };
        }
      });

      const adminMenu = [
        { title: "Dashboard Home", path: "/admin/workdashboard", controller: "AdminDashboard", icon: "fas fa-th-large", permissions: { list: true, add: true, update: true, delete: true, download: true } },
        { title: "User Directory", path: "/admin/users", controller: "UserController", icon: "fas fa-users", permissions: { list: true, add: true, update: true, delete: true, download: true } },
        { title: "Role Management", path: "/admin/permissions", controller: "PermissionController", icon: "fas fa-user-shield", permissions: { list: true, add: true, update: true, delete: true, download: true } },
        { title: "Temp HOD Delegations", path: "/temp-hod", controller: "TempHODController", icon: "fas fa-user-cog", permissions: { list: true, add: true, update: true, delete: true, download: true } },
        { title: "Promotion Dashboard", path: "/admin/promotions", controller: "PromotionController", icon: "fas fa-bullhorn", permissions: { list: true, add: true, update: true, delete: true, download: true } },
        { title: "System Audit Trail", path: "/audit-dashboard", controller: "AuditController", icon: "fas fa-history", permissions: { list: true, add: true, update: true, delete: true, download: true } },
        ...Object.values(distinctModules)
      ];

      return res.status(200).json({
        success: true,
        menu: adminMenu
      });
    }

    // 2. Non-admin roles: query database for allowed controllers where actions.list === true
    const permissions = await Permission.find({
      role: activeRole,
      "actions.list": true
    }).sort({ controller: 1 });

    const appMenu = [
      {
        title: "Dashboard Home",
        path: `/${activeRole}/workdashboard`,
        controller: "DashboardHome",
        icon: "fas fa-th-large",
        permissions: { list: true, add: false, update: false, delete: false, download: false }
      },
      ...permissions.map((p) => ({
        title: p.moduleTitle,
        path: p.path,
        controller: p.controller,
        icon: p.icon || "fas fa-folder",
        permissions: p.actions
      }))
    ];

    return res.status(200).json({
      success: true,
      menu: appMenu
    });
  } catch (err) {
    console.error("getAppMenu Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate dynamic navigation menu."
    });
  }
};

// ==========================================
// ROLE SWITCHING
// ==========================================
exports.switchRole = async (req, res) => {
  try {
    const { targetRole } = req.body;
    
    if (!targetRole) {
      return res.status(400).json({ success: false, message: "Target role is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check if the user has the target role
    const hasRole = user.role === targetRole || (user.roles && user.roles.includes(targetRole));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: `Access Denied: You do not have the '${targetRole}' role.` });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: targetRole,
        department: user.department,
        isLabStaff: user.isLabStaff,
        isTempHOD: user.isTempHOD,
        tempHODDepartment: user.tempHODDepartment,
        tempHODUntil: user.tempHODUntil
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cleanUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: targetRole,
      roles: user.roles || [],
      phoneNumber: user.phoneNumber || null,
      profilePhoto: user.profilePhoto,
      profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
      customData: user.customData || {}
    };

    if (user.dateOfJoining) cleanUser.dateOfJoining = user.dateOfJoining;
    if (user.department) cleanUser.department = user.department;
    if (user.section) cleanUser.section = user.section;
    if (targetRole === "faculty") cleanUser.isLabStaff = !!user.isLabStaff;

    return res.status(200).json({
      success: true,
      message: `Successfully switched to role: ${targetRole}`,
      token,
      user: cleanUser
    });
  } catch (error) {
    console.error("switchRole Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while switching roles."
    });
  }
};


// ==========================================
// DELEGATE ROLE (Admin & HOD)
// ==========================================
exports.delegateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    
    if (!newRole) {
      return res.status(400).json({ success: false, message: "New role is required." });
    }

    const activeRole = req.user.role;
    
    // Check if user has permission to delegate
    if (activeRole !== "admin" && activeRole !== "hod") {
      return res.status(403).json({ success: false, message: "Unauthorized to delegate roles." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found." });
    }

    // HODs can only delegate within their department
    if (activeRole === "hod" && targetUser.department !== req.user.department) {
      return res.status(403).json({ success: false, message: "HODs can only delegate roles to users within their department." });
    }

    // HODs can only delegate specific roles (like tutor, sports committee, lab staff, etc.)
    const allowedHODDelegations = ["tutor", "sports committee"];
    if (activeRole === "hod" && !allowedHODDelegations.includes(newRole.toLowerCase())) {
      return res.status(403).json({ success: false, message: `HODs cannot delegate the '${newRole}' role.` });
    }

    if (!targetUser.roles) {
      targetUser.roles = [];
    }

    if (targetUser.roles.includes(newRole) || targetUser.role === newRole) {
      return res.status(400).json({ success: false, message: "User already has this role." });
    }

    targetUser.roles.push(newRole);
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Successfully delegated role '${newRole}' to ${targetUser.fullName}.`,
      user: targetUser
    });
  } catch (error) {
    console.error("delegateRole Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while delegating the role."
    });
  }
};

// ==========================================
// REVOKE ROLE (Admin & HOD)
// ==========================================
exports.revokeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleToRemove } = req.body;
    
    if (!roleToRemove) {
      return res.status(400).json({ success: false, message: "Role to remove is required." });
    }

    const activeRole = req.user.role;
    
    if (activeRole !== "admin" && activeRole !== "hod") {
      return res.status(403).json({ success: false, message: "Unauthorized to revoke roles." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found." });
    }

    if (activeRole === "hod" && targetUser.department !== req.user.department) {
      return res.status(403).json({ success: false, message: "HODs can only revoke roles from users within their department." });
    }

    const allowedHODDelegations = ["tutor", "sports committee"];
    if (activeRole === "hod" && !allowedHODDelegations.includes(roleToRemove.toLowerCase())) {
      return res.status(403).json({ success: false, message: `HODs cannot revoke the '${roleToRemove}' role.` });
    }

    if (!targetUser.roles || !targetUser.roles.includes(roleToRemove)) {
      return res.status(400).json({ success: false, message: "User does not have this role in their secondary roles." });
    }

    targetUser.roles = targetUser.roles.filter(r => r !== roleToRemove);
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Successfully revoked role '${roleToRemove}' from ${targetUser.fullName}.`,
      user: targetUser
    });
  } catch (error) {
    console.error("revokeRole Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while revoking the role."
    });
  }
};
