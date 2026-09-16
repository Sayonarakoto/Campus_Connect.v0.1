import {useEffect,useState} from "react";

import axios from "axios";

function FacultyLeaveBalance(){

const[token]=useState(
localStorage.getItem("token")
);

const[user,setUser]=
useState(null);

useEffect(()=>{

load();

},[]);

const load=
async()=>{

const res=
await axios.get(

"http://localhost:5000/api/auth/profile",

{

headers:{
Authorization:
`Bearer ${token}`
}

}

);

setUser(res.data.user);

};

if(!user){

return null;

}

const annualLeavePool = user.annualLeavePool ?? 0;
const usedLeaveDays = user.usedLeaveDays ?? 0;
const remainingLeaveDays = annualLeavePool - usedLeaveDays;

return(

<div className="module-card">

<h3>

Annual Leave Pool

</h3>

<h1>

{annualLeavePool}

 Days

</h1>

<p>

Used:

{usedLeaveDays}

 Days

</p>

<p>

Remaining:

{

remainingLeaveDays

}

 Days

</p>

</div>

);

}

export default
FacultyLeaveBalance;
