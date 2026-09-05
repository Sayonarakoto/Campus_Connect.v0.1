const mongoose = require("mongoose");

const HRLedgerSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  leave: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StaffLeave"
  },

  days: Number,

  status: String,

  startDate: Date,
  endDate: Date
},
{ timestamps: true });

module.exports =
mongoose.model(
 "HRLedger",
 HRLedgerSchema
);