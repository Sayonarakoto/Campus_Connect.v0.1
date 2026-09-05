import { useNavigate } from "react-router-dom";

function FacultySportsDashboard() {

  const navigate = useNavigate();


  const modules = [

    {
      id: "verification",

      title: "Sports Verification",

      description:
        "Verify sports results, activity points and medals submitted by the Sports Committee.",

      route:
        "/faculty/sports/verification",

      icon:
        "✅",
    },


    {
      id: "history",

      title: "Sports History",

      description:
        "View department-wise and semester-wise verified sports participation records.",

      route:
        "/faculty/sports/history",

      icon:
        "📜",
    },


    {
      id: "profiles",

      title: "Student Sports Profiles",

      description:
        "View individual student achievements, medals and activity points.",

      route:
        "/faculty/sports/profile",

      icon:
        "🏅",
    },


    {
      id: "statistics",

      title: "Sports Statistics",

      description:
        "View participation statistics and activity point summaries.",

      route:
        "/faculty/sports/statistics",

      icon:
        "📊",
    },

  ];


  return (

    <div className="workspace-container">


      <div className="dashboard-header">

        <h1>
          Sports Management
        </h1>


        <p>

          Manage sports verification,
          student achievements and activity points.

        </p>


      </div>



      <div className="dashboard-grid">


        {
          modules.map((module) => (

            <div

              key={module.id}

              className="module-card"

              onClick={() =>
                navigate(module.route)
              }

            >


              <div className="module-icon">

                {module.icon}

              </div>



              <h2>

                {module.title}

              </h2>



              <p>

                {module.description}

              </p>


            </div>


          ))
        }


      </div>


    </div>

  );

}


export default FacultySportsDashboard;