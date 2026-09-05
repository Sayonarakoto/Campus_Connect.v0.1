const Contact = require("../models/Contact");

// =====================================
// CREATE CONTACT
// =====================================

exports.createContact = async (req, res) => {

  try {

    const { name, email, role, message } = req.body;

    if (!name || !email || !message) {

      return res.status(400).json({

        success: false,
        message: "Please fill all required fields."

      });

    }

    const contact = await Contact.create({

      name,
      email,
      role,
      message

    });

    res.status(201).json({

      success: true,
      message: "Inquiry submitted successfully.",
      contact

    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};

// =====================================
// GET ALL CONTACTS
// =====================================

exports.getContacts = async (req, res) => {

  try {

    const contacts = await Contact.find()

      .sort({

        createdAt: -1

      });

    res.json({

      success: true,
      contacts

    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};

// =====================================
// UPDATE STATUS
// =====================================

exports.updateStatus = async (req, res) => {

  try {

    const contact = await Contact.findById(req.params.id);

    if (!contact) {

      return res.status(404).json({

        success: false,
        message: "Inquiry not found"

      });

    }

    contact.status = req.body.status;

    await contact.save();

    res.json({

      success: true,
      message: "Status Updated",
      contact

    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};

// =====================================
// DELETE CONTACT
// =====================================

exports.deleteContact = async (req, res) => {

  try {

    await Contact.findByIdAndDelete(req.params.id);

    res.json({

      success: true,
      message: "Inquiry Deleted"

    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};