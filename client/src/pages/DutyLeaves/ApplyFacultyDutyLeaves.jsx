import {useState} from "react";
import axios from "axios";

function ApplyFacultyDutyLeave(){

const[dutyType,setDutyType]=useState("");

const[eventName,setEventName]=useState("");

const[dutyDate,setDutyDate]=useState("");

const[description,setDescription]=useState("");

const token=
localStorage.getItem("token");

const submit=
async()=>{

try{

await axios.post(

"http://localhost:5000/api/faculty-duty-leave/apply",

{

dutyType,

eventName,

dutyDate,

description

},

{

headers:{

Authorization:`Bearer ${token}`

}

}

);

alert("Submitted");

setDutyType("");
setEventName("");
setDutyDate("");
setDescription("");

}catch(error){

alert(error.response?.data?.message);

}

};

return(

<div className="workspace-container">

<h1>Apply Duty Leave</h1>

<input

placeholder="Duty Type"

value={dutyType}

onChange={(e)=>setDutyType(e.target.value)}

/>

<input

placeholder="Event Name"

value={eventName}

onChange={(e)=>setEventName(e.target.value)}

/>

<input

type="date"

value={dutyDate}

onChange={(e)=>setDutyDate(e.target.value)}

/>

<textarea

placeholder="Description"

value={description}

onChange={(e)=>setDescription(e.target.value)}

/>

<button onClick={submit}>

Submit

</button>

</div>

);

}

export default ApplyFacultyDutyLeave;