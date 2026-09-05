import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WorkDashboard.css";

function AdminDashboard() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    used: 0,
    expired: 0
  });
  
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch all gate passes
  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if token exists
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/gatepass/admin/all",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("API Response:", res.data); // Debug log

      // Safely extract data with fallback
      const gatePasses = res.data?.gatePasses || res.data?.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(gatePasses)) {
        console.error("Expected array but got:", typeof gatePasses);
        setPasses([]);
        setStats(prev => ({ ...prev, total: 0 }));
      } else {
        setPasses(gatePasses);
        calculateStats(gatePasses);
      }
      
    } catch (err) {
      console.error("Fetch error:", err);
      
      // Handle different error types
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        // Optionally redirect to login
        // navigate('/login');
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else if (err.response?.status === 404) {
        setError("Admin endpoint not found. Please check API configuration.");
      } else {
        setError(err.response?.data?.message || "Failed to load gate passes. Please try again.");
      }
      
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (passesArray) => {
    if (!Array.isArray(passesArray) || passesArray.length === 0) {
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        used: 0,
        expired: 0
      });
      return;
    }

    const stats = {
      total: passesArray.length,
      pending: passesArray.filter(p => p.status === 'pending').length,
      approved: passesArray.filter(p => p.status === 'approved').length,
      rejected: passesArray.filter(p => p.status === 'rejected').length,
      used: passesArray.filter(p => p.status === 'used').length,
      expired: passesArray.filter(p => p.status === 'expired').length
    };
    
    setStats(stats);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#22c55e"; // green
      case "pending":
        return "#f59e0b"; // orange
      case "rejected":
        return "#ef4444"; // red
      case "used":
        return "#3b82f6"; // blue
      case "expired":
        return "#6b7280"; // gray
      default:
        return "#333";
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      approved: '#dcfce7',
      pending: '#fef3c7',
      rejected: '#fee2e2',
      used: '#dbeafe',
      expired: '#f3f4f6'
    };
    return {
      color: getColor(status),
      background: colors[status?.toLowerCase()] || '#f3f4f6'
    };
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading gate passes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={fetchAll} className="retry-btn">
            Retry
          </button>
          <button onClick={() => navigate('/')} className="home-btn">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Gate Pass Dashboard</h1>
        <div className="header-actions">
          <button onClick={fetchAll} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/')} className="home-btn">
            🏠 Home
          </button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Total Passes</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <p className="stat-number">{stats.pending}</p>
        </div>
        <div className="stat-card approved">
          <h3>Approved</h3>
          <p className="stat-number">{stats.approved}</p>
        </div>
        <div className="stat-card rejected">
          <h3>Rejected</h3>
          <p className="stat-number">{stats.rejected}</p>
        </div>
        <div className="stat-card used">
          <h3>Used</h3>
          <p className="stat-number">{stats.used}</p>
        </div>
        <div className="stat-card expired">
          <h3>Expired</h3>
          <p className="stat-number">{stats.expired}</p>
        </div>
      </div>

      {/* Gate Passes Grid */}
      <div className="admin-grid">
        {passes.length === 0 ? (
          <div className="empty-state">
            <p>No gate passes found</p>
          </div>
        ) : (
          passes.map((p) => {
            const badgeStyle = getStatusBadge(p.status);
            return (
              <div key={p._id} className="admin-card">
                <div className="card-header">
                  <h3>{p.studentId?.fullName || "Unknown Student"}</h3>
                  <span 
                    className="status-badge"
                    style={{
                      color: badgeStyle.color,
                      background: badgeStyle.background,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '0.8rem'
                    }}
                  >
                    {p.status || "N/A"}
                  </span>
                </div>
                
                <p className="student-email">
                  {p.studentId?.email || "No email available"}
                </p>

                <div className="card-details">
                  <p><strong>Purpose:</strong> {p.purpose || "Not specified"}</p>
                  
                  <p><strong>Approved By:</strong> {p.approverId?.fullName || "Not yet"}</p>
                  
                  <p><strong>Scanned By:</strong> {p.scannedBy?.fullName || "Not scanned"}</p>
                  
                  <p><strong>Departure:</strong> {p.departureTime ? new Date(p.departureTime).toLocaleString() : "N/A"}</p>
                  
                  <p><strong>Return:</strong> {p.returnTime ? new Date(p.returnTime).toLocaleString() : "N/A"}</p>
                  
                  <p><strong>Created:</strong> {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Action Modules */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="modules-grid">
          <div
            className="module-card"
            onClick={() => navigate("/audit-dashboard")}
          >
            <h4> Audit Trail</h4>
            <p>View complete leave history and audit logs</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/temp-hod")}
          >
            <h4> Temporary HOD</h4>
            <p>Assign faculty as acting HOD during leave periods</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/admin/promotions")}
          >
            <h4> Promotions & Ads</h4>
            <p>Manage ad campaigns and promotions</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/faculty/sports")}
          >
            <h4>Create Sports Events</h4>
            <p>Create and manage new sports events</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;