const mongoose = require("mongoose");

const PayrollLedgerSchema =
new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  leave: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StaffLeave"
  },

  days: Number,

  salaryImpact: {
    type: Number,
    default: 0
  }
},
{ timestamps: true });

module.exports =
mongoose.model(
 "PayrollLedger",
 PayrollLedgerSchema
);