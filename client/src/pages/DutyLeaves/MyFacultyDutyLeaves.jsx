import {useEffect,useState} from "react";
import axios from "axios";

function MyFacultyDutyLeaves(){

const[leaves,setLeaves]=useState([]);

const token=
localStorage.getItem("token");

useEffect(()=>{

load();

},[]);

const load=
async()=>{

const res=
await axios.get(

"http://localhost:5000/api/faculty-duty-leave/my",

{

headers:{

Authorization:`Bearer ${token}`

}

}

);

setLeaves(res.data.leaves);

};

return(

<div className="workspace-container">

<h1>My Duty Leave Requests</h1>

<table className="director-table">

<thead>

<tr>

<th>Duty</th>

<th>Event</th>

<th>Date</th>

<th>Status</th>

<th>Reason</th>

</tr>

</thead>

<tbody>

{

leaves.map(

leave=>(

<tr key={leave._id}>

<td>

{leave.dutyType}

</td>

<td>

{leave.eventName}

</td>

<td>

{leave.dutyDate.substring(0,10)}

</td>

<td>

{leave.status}

</td>

<td>

{leave.rejectionReason || "-"}

</td>

</tr>

)

)

}

</tbody>

</table>

</div>

);

}

export default MyFacultyDutyLeaves;