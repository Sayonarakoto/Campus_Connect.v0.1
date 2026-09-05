import {
useState
} from "react";

import {
useParams,
useNavigate
} from "react-router-dom";

import "./SpecialAttendance.css";


function SpecialAttendanceStudent(){


const {
studentId
}=useParams();


const navigate=useNavigate();


const [date,setDate]=useState("");

const [hour,setHour]=useState("");



return(

<div className="workspace-container">


<h2>
Request Special Attendance
</h2>


<div className="module-card">


<label>
Select Date
</label>


<input

type="date"

value={date}

onChange={
e=>setDate(e.target.value)
}

/>



<label>
Select Hour
</label>


<select

value={hour}

onChange={
e=>setHour(e.target.value)
}

>


<option>
Select Hour
</option>

<option value="1">
Hour 1
</option>

<option value="2">
Hour 2
</option>

<option value="3">
Hour 3
</option>

<option value="4">
Hour 4
</option>


</select>



<button

disabled={
!date || !hour
}


onClick={()=>{


navigate(
`/attendance/special/request/${studentId}/${date}/${hour}`
)


}}

>

Request Special Attendance

</button>



</div>


</div>

)


}


export default SpecialAttendanceStudent;