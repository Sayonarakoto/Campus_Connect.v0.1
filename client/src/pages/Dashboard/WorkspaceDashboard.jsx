import { Navigate, useParams } from "react-router-dom";
import "./WorkDashboard.css";

import StudentDashboard from "./StudentDashboard";
import ParentDashboard from "./ParentDashboard";
import FacultyDashboard from "./FacultyDashboard";
import HODDashboard from "./HODDashboard";
import SecurityDashboard from "./SecurityDashboard";
import AdminDashboard from "./AdminDashboard";
import DirectorDashboard from "./DirectorDashboard";
import HRDashboard from "./HRDashboard";
import PrincipalDashboard from "./PrincipalDashboard";


function WorkspaceDashboard() {

  const { role } = useParams();


  const token =
    localStorage.getItem("token");


  let user = null;


  try {

    user =
      JSON.parse(
        localStorage.getItem("user")
      );

  } catch(error){

    console.error(
      "USER JSON ERROR:",
      error
    );

    localStorage.removeItem("user");

  }



  console.log(
    "WORKSPACE TOKEN:",
    token
  );


  console.log(
    "WORKSPACE USER:",
    user
  );


  console.log(
    "URL ROLE:",
    role
  );



  // Not logged in

  if (!token || !user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }



  // Prevent wrong role access

  if (
    user.role?.toLowerCase()
    !==
    role?.toLowerCase()
  ) {

    console.log(
      "ROLE MISMATCH",
      user.role,
      role
    );


    return (
      <Navigate
        to="/403"
        replace
      />
    );

  }



  switch(
    user.role.toLowerCase()
  ) {


    case "student":

      return <StudentDashboard />;



    case "parent":

      return <ParentDashboard />;



    case "faculty":

      return <FacultyDashboard />;



    case "hod":

      return <HODDashboard />;



    case "security":

      return <SecurityDashboard />;



    case "admin":

      return <AdminDashboard />;



    case "director":

      return <DirectorDashboard />;



    case "hraccounts":

      return <HRDashboard />;



    case "principal":

      return <PrincipalDashboard />;



    default:

      return (
        <Navigate
          to="/403"
          replace
        />
      );

  }

}


export default WorkspaceDashboard;