import "./ProfileCard.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function ProfileCard({ user }) {

  if (!user) return null;

  const photoSrc = user.profilePhotoUrl
    ? `${API}${user.profilePhotoUrl}`
    : (user.profilePhoto?.url
        ? `${API}${user.profilePhoto.url}`
        : (typeof user.profilePhoto === "string"
            ? `${API}${user.profilePhoto}`
            : "/default-avatar.png"));

  return (

    <div className="profile-card">

      <img
        className="profile-card-image"
        src={photoSrc}
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

        {(user.customData?.admissionNo || user.customData?.rollNumber) && (

          <p>
            Admission No : {user.customData.admissionNo || user.customData.rollNumber}
          </p>

        )}

        {user.customData?.regNo && (

          <p>
            Register No : {user.customData.regNo}
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