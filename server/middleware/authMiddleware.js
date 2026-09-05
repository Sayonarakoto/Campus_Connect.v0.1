const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  try {




    const authHeader =
      req.headers.authorization;


    if (!authHeader) {

      return res.status(401).json({

        success:false,

        message:"No Authorization Header"

      });

    }


    if (!authHeader.startsWith("Bearer ")) {

      return res.status(401).json({

        success:false,

        message:"Wrong Bearer Format"

      });

    }


    const token =
      authHeader.split(" ")[1];




    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    req.user = {

      id: decoded.id,

      role: decoded.role,

      department: decoded.department,

      isLabStaff: decoded.isLabStaff,

      isTempHOD: decoded.isTempHOD,

      tempHODDepartment:
        decoded.tempHODDepartment,

      tempHODUntil:
        decoded.tempHODUntil

    };


    next();


  }
  catch(err){

    return res.status(401).json({

      success:false,

      message:
      err.message

    });

  }

};