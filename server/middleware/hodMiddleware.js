const User =
  require("../models/User");

module.exports =
async (req, res, next) => {

  try {

    const user =
      await User.findById(
        req.user.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Real HOD
    if (
      user.role === "hod"
    ) {
      return next();
    }

    // Temporary HOD
    if (
      user.isTempHOD === true &&
      user.tempHODUntil &&
      new Date(user.tempHODUntil) >
        new Date()
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message:
        "HOD access required"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message:
        error.message
    });

  }

};