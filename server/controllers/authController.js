// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const { uploadToGridFS, deleteFromGridFS, getBucket } = require("../config/gridfs");
const mongoose = require("mongoose");
const { requiresSection, getAllowedSections } = require("../constants/academicConfig");

// ==========================================
// HELPER: Get profile photo URL
// ==========================================
const getProfilePhotoUrl = (profilePhoto) => {
  if (!profilePhoto || !profilePhoto.fileId) return null;
  return `/api/auth/photo/${profilePhoto.fileId}`;
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
      password,
      isLabStaff,
      ...customData
    } = req.body;

    // ==========================================
    // CHECK IF ACCOUNT EXISTS
    // ==========================================
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists"
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================
    const hashedPassword = await bcrypt.hash(password, 10);

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
    if (department === "Mechanical Engineering") {
      studentSection = customData?.section ? customData.section.trim() : null;
      if (role === "student" && (!studentSection || !["Mech-A", "Mech-B"].includes(studentSection))) {
        return res.status(400).json({
          success: false,
          message: "Section is mandatory for Mechanical Engineering and must be 'Mech-A' or 'Mech-B'."
        });
      }
    } else {
      studentSection = null;
    }

    // ==========================================
    // CREATE USER
    // ==========================================
    const userData = {
      role,
      fullName,
      department: department || '',
      section: studentSection,
      email,
      password: hashedPassword,
      profilePhoto: profilePhotoData, // null or GridFS object
      isLabStaff: isLabStaffBool,
      customData: customData
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
          email: customData.parentEmail,
          role: "parent"
        });
      }

      await Student.create({
        user: user._id,
        fullName,
        department: department || '',
        semester: customData.semester ? Number(customData.semester) : 1,
        section: studentSection,
        admissionNo: customData.rollNumber,
        batch: customData.batchYear,
        parentEmail: customData.parentEmail || '',
        profilePhoto: profilePhotoData,
        parent: parentUser ? parentUser._id : undefined
      });
    }

    // ==========================================
    // PARENT AUTO LINK
    // ==========================================
    if (role === "parent") {
      const student = await Student.findOne({
        admissionNo: customData.studentRollNumber
      });

      if (student) {
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
    console.error("❌ REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ==========================================
    // FIND USER
    // ==========================================
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found. Please register first."
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
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
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        department: user.department,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
        isLabStaff: user.isLabStaff,
        isTempHOD: user.isTempHOD,
        tempHODDepartment: user.tempHODDepartment,
        tempHODUntil: user.tempHODUntil
      }
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profilePhotoUrl: getProfilePhotoUrl(user.profilePhoto),
        profile
      }
    });
  } catch (error) {
    console.error("❌ PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      console.error('❌ Download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("❌ GET PROFILE PHOTO ERROR:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
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
    console.error("❌ UPDATE PROFILE PHOTO ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    console.error("❌ DELETE PROFILE PHOTO ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    console.error("❌ GET FACULTY LIST ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
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
    console.error("❌ GET LEAVE BALANCE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    console.error("❌ GET ALL USERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    console.error("❌ GET USER BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    console.error("❌ UPDATE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    console.error("❌ DELETE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};