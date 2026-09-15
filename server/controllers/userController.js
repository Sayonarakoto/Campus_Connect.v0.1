const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcrypt");

// Helper to get photo URL
const getProfilePhotoUrl = (photoObj) => {
  if (photoObj && photoObj.fileId) {
    return `/api/auth/photo/${photoObj.fileId}`;
  }
  return null;
};

async function getUserManagementAccess(req) {
  const account = await User.findById(req.user.id).select("role roles department tempHODDepartment");
  const roles = new Set([
    String(req.user.role || "").toLowerCase(),
    ...(Array.isArray(req.user.roles) ? req.user.roles : []).map((role) => String(role).toLowerCase().trim()),
    String(account?.role || "").toLowerCase(),
    ...(Array.isArray(account?.roles) ? account.roles : []).map((role) => String(role).toLowerCase().trim())
  ]);

  const isAdmin = roles.has("admin");
  const isHod = !isAdmin && roles.has("hod");
  const department = req.user.department || account?.department || (isHod ? account?.tempHODDepartment : null);

  return {
    account,
    roles,
    isAdmin,
    isHod,
    activeRole: isAdmin ? "admin" : isHod ? "hod" : String(account?.role || req.user.role || "").toLowerCase(),
    department
  };
}

// GET /api/users/tutors-by-department?department=XYZ
exports.getTutorsByDepartment = async (req, res) => {
  try {
    const { activeRole, department: accessDepartment } = await getUserManagementAccess(req);
    const targetDept = req.query.department || accessDepartment;

    if (!targetDept) {
      return res.status(400).json({ success: false, message: "Department is required." });
    }

    const tutors = await User.find({
      department: new RegExp(`^${targetDept.trim()}$`, "i"),
      $or: [{ role: "tutor" }, { roles: "tutor" }]
    }).select("fullName email department");

    return res.status(200).json({ success: true, tutors });
  } catch (err) {
    console.error("Error fetching tutors:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch tutors." });
  }
};

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const { activeRole, isHod, department: accessDepartment } = await getUserManagementAccess(req);
    const institutionalRoles = ["admin", "hraccounts", "principal", "director"];
    let query = {};

    if (isHod) {
      if (!accessDepartment) {
        return res.status(403).json({ success: false, message: "Your HOD account has no department assigned. Contact an administrator." });
      }
      query.department = accessDepartment;
      query.role = { $in: ["faculty", "student", "tutor"] };
    } else if (!institutionalRoles.includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { role, department, search } = req.query;
    if (role && role !== "all") {
      if (isHod) {
        if (["faculty", "student", "tutor"].includes(role.toLowerCase())) {
          query.role = role.toLowerCase();
        }
      } else {
        query.role = role.toLowerCase();
      }
    }
    if (department && department !== "all") {
      if (!isHod) {
        query.department = department;
      }
    }
    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$or = [{ fullName: sRegex }, { email: sRegex }];
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    
    // Fetch any student records for these users to include admission numbers
    const studentUserIds = users.filter(u => u.role === "student").map(u => u._id);
    let studentMap = {};
    if (studentUserIds.length > 0) {
      const students = await Student.find({ user: { $in: studentUserIds } })
        .select("user admissionNo regNo semester section tutor primaryDepartment isGeneralDepartment")
        .populate("tutor", "fullName email");
      students.forEach(s => {
        studentMap[s.user.toString()] = s;
      });
    }

    const usersWithPhotoUrls = users.map(user => {
      const uObj = user.toObject();
      const studentInfo = studentMap[user._id.toString()];
      return {
        ...uObj,
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
        admissionNo: studentInfo ? studentInfo.admissionNo : (uObj.customData?.admissionNo || null),
        regNo: studentInfo ? studentInfo.regNo : null,
        semester: studentInfo ? studentInfo.semester : null,
        tutor: studentInfo && studentInfo.tutor ? studentInfo.tutor : null,
        studentRecordId: studentInfo ? studentInfo._id : null,
        primaryDepartment: studentInfo ? studentInfo.primaryDepartment : null,
        isGeneralDepartment: studentInfo ? studentInfo.isGeneralDepartment : false
      };
    });

    res.json({ success: true, users: usersWithPhotoUrls });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { activeRole, isHod, department: accessDepartment } = await getUserManagementAccess(req);
    const { fullName, email, role, department: requestedDepartment, password, section, isLabStaff } = req.body;

    if (!fullName || !email || !role || (!password && role !== "parent")) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // RBAC validation
    if (isHod) {
      if (!["faculty", "student", "tutor"].includes(role)) {
        return res.status(403).json({ success: false, message: "HODs can only create faculty, student, or tutor roles." });
      }
      if (requestedDepartment !== accessDepartment) {
        return res.status(403).json({ success: false, message: "HODs can only create users in their own department." });
      }
    } else if (!["admin", "hraccounts"].includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const roleLower = (role || "").toLowerCase().trim();
    const secondaryRoles = Array.isArray(req.body.roles)
      ? req.body.roles.map((r) => r.toLowerCase().trim())
      : [];

    // Enforce Class Tutor department quota: maximum 3 per department
    const isAssigningTutor = roleLower === "tutor" || secondaryRoles.includes("tutor");
    if (isAssigningTutor) {
      if (!requestedDepartment || !requestedDepartment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department is required when assigning the Class Tutor role."
        });
      }
      const activeTutorCount = await User.countDocuments({
        department: new RegExp(`^${requestedDepartment.trim()}$`, "i"),
        $or: [{ role: "tutor" }, { roles: "tutor" }]
      });
      if (activeTutorCount >= 3) {
        return res.status(400).json({
          success: false,
          message: `Department '${requestedDepartment}' has already reached the maximum limit of 3 Class Tutors.`
        });
      }
    }

    let hashedPassword = undefined;
    if (password && roleLower !== "parent") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = new User({
      fullName,
      email: email.toLowerCase().trim(),
      role: roleLower,
      roles: secondaryRoles,
      ...(roleLower !== "parent" && hashedPassword ? { password: hashedPassword } : {}),
      department: requestedDepartment,
      section,
      isLabStaff: Boolean(isLabStaff)
    });

    await newUser.save();
    
    // Convert to object and omit password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: "User created successfully", user: userResponse });
  } catch (err) {
    console.error("Error creating user:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: err.message || "Failed to create user" });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { activeRole, isHod, department: accessDepartment } = await getUserManagementAccess(req);
    const { id } = req.params;
    const { fullName, email, department: requestedDepartment, section, isLabStaff, role, roles, password } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    if (isHod) {
      if (!accessDepartment || targetUser.department !== accessDepartment || !["faculty", "student", "tutor"].includes(targetUser.role)) {
        return res.status(403).json({ success: false, message: "Unauthorized to update this user" });
      }
      if (requestedDepartment !== undefined && requestedDepartment !== accessDepartment) {
        return res.status(403).json({ success: false, message: "HODs can only keep users in their own department." });
      }
    } else if (!["admin", "hraccounts"].includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const targetDept = requestedDepartment !== undefined ? requestedDepartment.trim() : targetUser.department;
    const newRoleLower = role ? role.toLowerCase().trim() : targetUser.role;
    const newSecondaryRoles = roles !== undefined
      ? (Array.isArray(roles) ? roles.map((r) => r.toLowerCase().trim()) : [])
      : (targetUser.roles || []);

    // Enforce Class Tutor department quota: maximum 3 per department
    const isAssigningTutor = newRoleLower === "tutor" || newSecondaryRoles.includes("tutor");
    if (isAssigningTutor) {
      if (!targetDept) {
        return res.status(400).json({
          success: false,
          message: "Department is required when assigning the Class Tutor role."
        });
      }
      const activeTutorCount = await User.countDocuments({
        _id: { $ne: targetUser._id },
        department: new RegExp(`^${targetDept}$`, "i"),
        $or: [{ role: "tutor" }, { roles: "tutor" }]
      });
      if (activeTutorCount >= 3) {
        return res.status(400).json({
          success: false,
          message: `Department '${targetDept}' has already reached the maximum limit of 3 Class Tutors.`
        });
      }
    }

    targetUser.fullName = fullName || targetUser.fullName;
    targetUser.email = email ? email.toLowerCase().trim() : targetUser.email;
    if (requestedDepartment !== undefined) targetUser.department = requestedDepartment;
    if (section !== undefined) targetUser.section = section;
    if (isLabStaff !== undefined) targetUser.isLabStaff = isLabStaff;
    if (role && ["admin", "hraccounts", "hod"].includes(activeRole)) targetUser.role = newRoleLower;
    if (roles !== undefined) targetUser.roles = newSecondaryRoles;
    if (password && targetUser.role !== "parent") targetUser.password = await bcrypt.hash(password, 10);

    await targetUser.save();
    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { activeRole } = await getUserManagementAccess(req);
    const { id } = req.params;

    if (!["admin", "hraccounts"].includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Only Admins or HR/Accounts can delete users" });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};
