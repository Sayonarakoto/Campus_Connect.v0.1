import { useEffect, useState } from "react";
import axios from "axios";


function SportsStatistics() {


const token = localStorage.getItem("token");



const defaultDashboard = {

pendingVerification:0,

verifiedResults:0,

totalResults:0,

totalActivityPoints:0,

totalHousePoints:0,

goldMedals:0,

silverMedals:0,

bronzeMedals:0,

participationCount:0,

topHouse:"-",

topHousePoints:0,

houseRanking:[],

departmentRanking:[],

eventRanking:[]

};



const [loading,setLoading] =
useState(true);



const [dashboard,setDashboard] =
useState(defaultDashboard);




// ==========================================
// LOAD DASHBOARD
// ==========================================

const loadDashboard = async()=>{


try{


setLoading(true);



const res =
await axios.get(

"http://localhost:5000/api/sports-verification/dashboard",

{

headers:{

Authorization:
`Bearer ${token}`

}

}

);



if(res.data.success){



setDashboard({

...defaultDashboard,


...(res.data.dashboard || {}),



houseRanking:
res.data.dashboard?.houseRanking || [],



departmentRanking:
res.data.dashboard?.departmentRanking || [],



eventRanking:
res.data.dashboard?.eventRanking || []


});


}



}

catch(error){


console.error(
"Sports Dashboard Error:",
error
);



setDashboard(defaultDashboard);



}

finally{


setLoading(false);


}


};





useEffect(()=>{


loadDashboard();


},[]);





// ==========================================
// LOADING
// ==========================================


if(loading){


return(

<div className="sports-page">

<h2>
Loading Sports Statistics...
</h2>

</div>

);


}





return(


<div className="sports-page">



{/* HEADER */}

<div className="sports-header">


<h1>
Sports Statistics
</h1>


<p>
Sports achievements, rankings and analytics
</p>


</div>





{/* SUMMARY */}


<div className="statistics-grid">


<div className="stats-card">

<h3>
Pending Verification
</h3>

<span>
{dashboard.pendingVerification}
</span>

</div>




<div className="stats-card">

<h3>
Verified Results
</h3>

<span>
{dashboard.verifiedResults}
</span>

</div>





<div className="stats-card">

<h3>
Total Results
</h3>

<span>
{dashboard.totalResults}
</span>

</div>





<div className="stats-card">

<h3>
Activity Points
</h3>

<span>
{dashboard.totalActivityPoints}
</span>

</div>





<div className="stats-card">

<h3>
House Points
</h3>

<span>
{dashboard.totalHousePoints}
</span>

</div>





<div className="stats-card">

<h3>
Top House
</h3>

<span>
{dashboard.topHouse}
</span>

</div>


</div>







{/* MEDALS */}


<div className="medal-grid">


<div className="medal-card">

<h3>
🥇 Gold
</h3>

<span>
{dashboard.goldMedals}
</span>

</div>



<div className="medal-card">

<h3>
🥈 Silver
</h3>

<span>
{dashboard.silverMedals}
</span>

</div>




<div className="medal-card">

<h3>
🥉 Bronze
</h3>

<span>
{dashboard.bronzeMedals}
</span>

</div>


</div>








{/* HOUSE RANKING */}


<RankingTable

title="House Rankings"

headers={[
"Rank",
"House",
"Points",
"Medals"
]}

rows={dashboard.houseRanking}

render={(item,index)=>(

<tr key={index}>

<td>{index+1}</td>

<td>{item.house}</td>

<td>{item.points}</td>

<td>{item.medals}</td>

</tr>

)}


/>









{/* DEPARTMENT */}


<RankingTable

title="Department Rankings"

headers={[
"Rank",
"Department",
"Points",
"Students"
]}


rows={dashboard.departmentRanking}


render={(item,index)=>(

<tr key={index}>

<td>{index+1}</td>

<td>{item.department}</td>

<td>{item.points}</td>

<td>{item.students}</td>


</tr>

)}


/>









{/* EVENT */}


<RankingTable

title="Event Rankings"

headers={[
"Rank",
"Event",
"Participants",
"Points"
]}


rows={dashboard.eventRanking}


render={(item,index)=>(

<tr key={index}>


<td>
{index+1}
</td>


<td>
{item.event}
</td>


<td>
{item.participants}
</td>


<td>
{item.points}
</td>


</tr>


)}


/>









<button

className="primary-btn"

onClick={loadDashboard}

>

Refresh Statistics

</button>



</div>


);

}







// =================================================
// REUSABLE TABLE
// =================================================


function RankingTable({

title,

headers,

rows,

render

}){


return(


<div className="table-wrapper">


<h2>
{title}
</h2>


<table className="statistics-table">


<thead>

<tr>

{
headers.map((h)=>(

<th key={h}>
{h}
</th>

))

}

</tr>

</thead>



<tbody>



{
rows.length===0 ?


<tr>

<td

colSpan={headers.length}

className="empty-row"

>

No Data Available

</td>


</tr>



:


rows.map(render)



}



</tbody>


</table>


</div>


);


}





export default SportsStatistics;