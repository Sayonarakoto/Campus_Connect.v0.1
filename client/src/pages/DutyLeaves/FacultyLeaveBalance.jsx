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

return(

<div className="module-card">

<h3>

Annual Leave Pool

</h3>

<h1>

{user.annualLeavePool}

 Days

</h1>

<p>

Used:

{user.usedLeaveDays}

 Days

</p>

<p>

Remaining:

{

user.annualLeavePool-
user.usedLeaveDays

}

 Days

</p>

</div>

);

}

export default
FacultyLeaveBalance;