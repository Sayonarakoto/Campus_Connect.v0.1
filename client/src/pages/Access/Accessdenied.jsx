import { Link } from "react-router-dom";

function AccessDenied() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
        padding: "40px"
      }}
    >
      <h1 style={{ fontSize: "64px", color: "#dc2626" }}>
        403
      </h1>

      <h2>Access Denied</h2>

      <p>
        You do not have permission to access this page.
      </p>

      <p>
        Logged in as: <strong>{user?.role}</strong>
      </p>

      <Link
        to={`/${user?.role}/workdashboard`}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: "#2563eb",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "8px"
        }}
      >
        Go to My Dashboard
      </Link>
    </div>
  );
}

export default AccessDenied;