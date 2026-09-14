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

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const activeRole = req.user.role.toLowerCase();
    const institutionalRoles = ["admin", "hraccounts", "principal", "director"];
    let query = {};

    if (activeRole === "hod") {
      query.department = req.user.department;
      query.role = { $in: ["faculty", "student", "tutor"] };
    } else if (!institutionalRoles.includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { role, department, search } = req.query;
    if (role && role !== "all") {
      if (activeRole === "hod") {
        if (["faculty", "student", "tutor"].includes(role.toLowerCase())) {
          query.role = role.toLowerCase();
        }
      } else {
        query.role = role.toLowerCase();
      }
    }
    if (department && department !== "all") {
      if (activeRole !== "hod") {
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
      const students = await Student.find({ user: { $in: studentUserIds } }).select("user admissionNo regNo semester section");
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
        semester: studentInfo ? studentInfo.semester : null
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
    const activeRole = req.user.role.toLowerCase();
    const { fullName, email, role, department, password, section, isLabStaff } = req.body;

    if (!fullName || !email || !role || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // RBAC validation
    if (activeRole === "hod") {
      if (!["faculty", "student", "tutor"].includes(role)) {
        return res.status(403).json({ success: false, message: "HODs can only create faculty, student, or tutor roles." });
      }
      if (department !== req.user.department) {
        return res.status(403).json({ success: false, message: "HODs can only create users in their own department." });
      }
    } else if (!["admin", "hraccounts"].includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      role: role.toLowerCase(),
      password: hashedPassword,
      department,
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
    const activeRole = req.user.role.toLowerCase();
    const { id } = req.params;
    const { fullName, email, department, section, isLabStaff, role, password } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    if (activeRole === "hod") {
      if (targetUser.department !== req.user.department || !["faculty", "student", "tutor"].includes(targetUser.role)) {
        return res.status(403).json({ success: false, message: "Unauthorized to update this user" });
      }
    } else if (!["admin", "hraccounts"].includes(activeRole)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    targetUser.fullName = fullName || targetUser.fullName;
    targetUser.email = email ? email.toLowerCase() : targetUser.email;
    if (department) targetUser.department = department;
    if (section) targetUser.section = section;
    if (isLabStaff !== undefined) targetUser.isLabStaff = isLabStaff;
    if (role && ["admin", "hraccounts"].includes(activeRole)) targetUser.role = role.toLowerCase();
    if (password) targetUser.password = await bcrypt.hash(password, 10);

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
    const activeRole = req.user.role.toLowerCase();
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
