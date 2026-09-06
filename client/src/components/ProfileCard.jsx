import "./ProfileCard.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function ProfileCard({ user }) {

  if (!user) return null;

  return (

    <div className="profile-card">

      <img

        className="profile-card-image"

        src={
          user.profilePhoto
            ? `${API}${user.profilePhoto}`
            : "/default-avatar.png"
        }

        alt={user.fullName}

      />

      <div className="profile-card-details">

        <h3>{user.fullName}</h3>

        <p>{user.role}</p>

        {user.department && (

          <p>
            Department : {user.department}
          </p>

        )}

        {user.customData?.rollNumber && (

          <p>
            Roll No : {user.customData.rollNumber}
          </p>

        )}

        {user.customData?.employeeId && (

          <p>
            Faculty ID : {user.customData.employeeId}
          </p>

        )}

      </div>

    </div>

  );

}