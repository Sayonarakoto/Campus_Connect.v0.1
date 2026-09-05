const mongoose = require("mongoose");
const FacultyDutyLeaveSchema =
new mongoose.Schema(
{
    faculty:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    dutyType:{
        type:String,
        required:true
    },

    eventName:{
        type:String,
        required:true
    },

    dutyDate:{
        type:Date,
        required:true
    },

    description:{
        type:String,
        default:""
    },

    attachment:{
        type:String,
        default:""
    },

    auditLogs:[
{
action:String,

performedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

remarks:String,

timestamp:{
type:Date,
default:Date.now
}
}
],

    status:{
        type:String,
        enum:[
            "Pending",
            "Approved",
            "Rejected"
        ],
        default:"Pending"
    },

    rejectionReason:{
        type:String,
        default:""
    },

    approvedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    compensationGranted:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
}
);

module.exports =
mongoose.models.FacultyDutyLeave ||
mongoose.model(
"FacultyDutyLeave",
FacultyDutyLeaveSchema
);
