import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function StudentSportsProfile() {

  const token =
    localStorage.getItem("token");

  const [loading, setLoading] =
    useState(true);

  const [students, setStudents] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [department, setDepartment] =
    useState("ALL");

  const [house, setHouse] =
    useState("ALL");

  // ==========================================
  // LOAD STUDENT PROFILES
  // ==========================================

  const loadProfiles = async () => {

    try {

      setLoading(true);

      const res =
        await axios.get(

          "http://localhost:5000/api/sports-verification/profile",

          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }

        );

      if (res.data.success) {

        setStudents(
          res.data.students || []
        );

      }

    }

    catch (error) {

      console.error(error);

      alert(

        error.response?.data?.message ||

        "Unable to load student profiles."

      );

    }

    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadProfiles();

  }, []);

  // ==========================================
  // DEPARTMENT FILTER
  // ==========================================

  const departments =
    useMemo(() => {

      const unique =
        new Set();

      students.forEach((student) => {

        if (student.department) {

          unique.add(
            student.department
          );

        }

      });

      return [

        "ALL",

        ...Array.from(unique)

      ];

    }, [students]);

  // ==========================================
  // HOUSE FILTER
  // ==========================================

  const houses =
    useMemo(() => {

      const unique =
        new Set();

      students.forEach((student) => {

        if (student.house) {

          unique.add(
            student.house
          );

        }

      });

      return [

        "ALL",

        ...Array.from(unique)

      ];

    }, [students]);

  // ==========================================
  // FILTER
  // ==========================================

  const filteredStudents =
    useMemo(() => {

      return students.filter((student) => {

        const keyword =
          search.toLowerCase();

        const name =
          student.fullName
            ?.toLowerCase() || "";

        const register =
          student.registerNumber
            ?.toLowerCase() ||

          student.admissionNo
            ?.toLowerCase() ||

          "";

        const matchesSearch =

          name.includes(keyword) ||

          register.includes(keyword);

        const matchesDepartment =

          department === "ALL" ||

          student.department ===
          department;

        const matchesHouse =

          house === "ALL" ||

          student.house ===
          house;

        return (

          matchesSearch &&

          matchesDepartment &&

          matchesHouse

        );

      });

    }, [

      students,

      search,

      department,

      house

    ]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="sports-page">

        <div className="sports-loading">

          Loading Student Profiles...

        </div>

      </div>

    );

  }
  // ==========================================
// UI
// ==========================================

return (

  <div className="sports-page">


    {/* ===========================
        HEADER
    =========================== */}

    <div className="sports-header">

      <h1>
        Student Sports Profiles
      </h1>

      <p>
        View student achievements,
        activity points and sports participation records.
      </p>

    </div>



    {/* ===========================
        TOOLBAR
    =========================== */}

    <div className="profile-toolbar">


      <input

        type="text"

        placeholder="Search Student..."

        value={search}

        onChange={(e) =>
          setSearch(e.target.value)
        }

      />


      <select

        value={department}

        onChange={(e) =>
          setDepartment(
            e.target.value
          )
        }

      >

        {
          departments.map((dept) => (

            <option

              key={dept}

              value={dept}

            >

              {dept}

            </option>

          ))
        }

      </select>



      <select

        value={house}

        onChange={(e) =>
          setHouse(
            e.target.value
          )
        }

      >

        {
          houses.map((item) => (

            <option

              key={item}

              value={item}

            >

              {item}

            </option>

          ))
        }

      </select>


      <button

        className="secondary-btn"

        onClick={loadProfiles}

      >

        Refresh

      </button>


    </div>




    {/* ===========================
        TABLE
    =========================== */}


    <div className="table-wrapper">


      <table className="profile-table">


        <thead>

          <tr>

            <th>
              Student
            </th>

            <th>
              Register No
            </th>

            <th>
              Department
            </th>

            <th>
              Semester
            </th>

            <th>
              House
            </th>

            <th>
              Activity Points
            </th>

            <th>
              Events
            </th>

            <th>
              Gold
            </th>

            <th>
              Silver
            </th>

            <th>
              Bronze
            </th>


          </tr>

        </thead>



        <tbody>


        {

          filteredStudents.length === 0

          ?

          (

            <tr>

              <td

                colSpan="10"

                className="empty-row"

              >

                No Student Profiles Found

              </td>

            </tr>

          )


          :


          (

            filteredStudents.map((student) => (


              <tr

                key={student._id}

              >


                <td>

                  {student.fullName}

                </td>



                <td>

                  {
                    student.registerNumber ||

                    student.admissionNo
                  }

                </td>



                <td>

                  {student.department}

                </td>



                <td>

                  {student.semester}

                </td>



                <td>

                  {student.house}

                </td>



                <td>

                  {student.activityPoints}

                </td>



                <td>

                  {student.eventsParticipated}

                </td>



                <td>

                  {student.goldMedals}

                </td>



                <td>

                  {student.silverMedals}

                </td>



                <td>

                  {student.bronzeMedals}

                </td>



              </tr>


            ))

          )


        }


        </tbody>


      </table>


    </div>


  </div>

);


}


export default StudentSportsProfile;