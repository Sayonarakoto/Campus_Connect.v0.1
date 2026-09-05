import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

function AdminPromotionDashboard() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role || "student";

  const isAdmin = userRole === "admin" || userRole === "ADMIN";

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    destinationUrl: "",
    placement: "FLOATING_CORNER",
    audienceRole: "ALL",
    department: "ALL",
    semester: 0
  });
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const loadingRef = useRef(false);
  const isFormDirtyRef = useRef(false);
  const loadPromotionsRef = useRef(() => {});
  const intervalRef = useRef(null);

  // Handle window resize for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    isFormDirtyRef.current =
      editingId !== null ||
      form.title.trim() !== "" ||
      form.description.trim() !== "" ||
      media !== null;
  }, [editingId, form.title, form.description, media]);

  const loadPromotions = useCallback(
    async ({ silent = false } = {}) => {
      if (silent && isFormDirtyRef.current) return;
      if (loadingRef.current) return;

      loadingRef.current = true;
      try {
        if (!silent) setLoading(true);
        setError(null);

        const endpoint = isAdmin
          ? "http://localhost:5000/api/promotions/all"
          : "http://localhost:5000/api/promotions/visible";

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setPromotions(res.data.promotions || []);
        localStorage.setItem(
          "promotions_cache",
          JSON.stringify(res.data.promotions || [])
        );
      } catch (err) {
        console.error("Load promotions error:", err);
        setError(err.response?.data?.message || "Failed to load promotions");

        const cached = localStorage.getItem("promotions_cache");
        if (cached) {
          try {
            setPromotions(JSON.parse(cached));
          } catch (e) {
            console.error("Cache parse error:", e);
          }
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [isAdmin, token]
  );

  useEffect(() => {
    loadPromotionsRef.current = loadPromotions;
  }, [loadPromotions]);

  useEffect(() => {
    loadPromotions();
  }, [refreshKey, isAdmin]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      loadPromotionsRef.current({ silent: true });
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [refreshKey]);

  const handleRefresh = () => {
    if (loadingRef.current) return;
    setRefreshKey((prev) => prev + 1);
  };

  const createPromotion = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Only administrators can create promotions");
      return;
    }
    if (!media) {
      alert("Please select a media file");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description || "");
      data.append("destinationUrl", form.destinationUrl || "");
      data.append("placement", form.placement);
      data.append("audienceRole", form.audienceRole);
      data.append("department", form.department || "ALL");
      data.append("semester", form.semester.toString());
      data.append("media", media);

      await axios.post("http://localhost:5000/api/promotions/create", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Promotion Created Successfully");
      resetForm();
      handleRefresh();
    } catch (err) {
      console.error("Create error:", err);
      alert(err.response?.data?.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  const updatePromotion = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Only administrators can update promotions");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description || "");
      data.append("destinationUrl", form.destinationUrl || "");
      data.append("placement", form.placement);
      data.append("audienceRole", form.audienceRole);
      data.append("department", form.department || "ALL");
      data.append("semester", form.semester.toString());
      if (media) data.append("media", media);

      await axios.put(`http://localhost:5000/api/promotions/${editingId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Promotion Updated Successfully");
      resetForm();
      handleRefresh();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.message || "Failed to update promotion");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      destinationUrl: "",
      placement: "FLOATING_CORNER",
      audienceRole: "ALL",
      department: "ALL",
      semester: 0
    });
    setMedia(null);
    setMediaPreview(null);
  };

  const publish = async (id) => {
    if (!isAdmin) return;
    try {
      await axios.put(
        `http://localhost:5000/api/promotions/publish/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleRefresh();
    } catch (err) {
      console.error("Publish error:", err);
      alert(err.response?.data?.message || "Failed to publish");
    }
  };

  const unpublish = async (id) => {
    if (!isAdmin) return;
    try {
      await axios.put(
        `http://localhost:5000/api/promotions/unpublish/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleRefresh();
    } catch (err) {
      console.error("Unpublish error:", err);
      alert(err.response?.data?.message || "Failed to unpublish");
    }
  };

  const deletePromotion = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this promotion?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleRefresh();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleEdit = (promotion) => {
    if (!isAdmin) return;
    setEditingId(promotion._id);
    setForm({
      title: promotion.title || "",
      description: promotion.description || "",
      destinationUrl: promotion.destinationUrl || "",
      placement: promotion.placement || "FLOATING_CORNER",
      audienceRole: promotion.audienceRole || "ALL",
      department: promotion.department || "ALL",
      semester: promotion.semester || 0
    });
    setMedia(null);
    setMediaPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        e.target.value = "";
        return;
      }
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4"
      ];
      if (!validTypes.includes(file.type)) {
        alert("Only images and MP4 videos are allowed");
        e.target.value = "";
        return;
      }
      setMedia(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setMediaPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null);
      }
    }
  };

  const getMediaUrl = (promotion) => {
    if (!promotion?.mediaFileId) return null;
    return `http://localhost:5000/api/promotions/media/${promotion.mediaFileId.toString()}`;
  };

  const getPlacementLabel = (placement) => {
    const labels = {
      FLOATING_CORNER: "Floating Corner",
      FORM_TOP: "Form Top",
      FORM_BOTTOM: "Form Bottom",
      LEFT_MARGIN: "Left Margin",
      RIGHT_MARGIN: "Right Margin",
      DASHBOARD_CARD: "Dashboard Card"
    };
    return labels[placement] || placement;
  };

  const getStatusBadge = (published) =>
    published ? (
      <span style={styles.badgePublished}>Published</span>
    ) : (
      <span style={styles.badgeDraft}>Draft</span>
    );

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  const isVideo = (promotion) =>
    promotion.mediaType === "video" ||
    (promotion.mimeType && promotion.mimeType.startsWith("video/"));

  const handleImageError = (e) => {
    e.target.style.display = "none";
    const parent = e.target.parentElement;
    const fallback = document.createElement("div");
    fallback.style.cssText =
      "padding:40px;text-align:center;color:#999;background:#f5f5f5;border-radius:8px;";
    fallback.textContent = "Image not available";
    parent.appendChild(fallback);
  };

  if (loading && promotions.length === 0) {
    return (
      <div className="workspace-container">
        <div style={styles.loadingContainer}>
          <div className="spinner"></div>
          <p>Loading promotions...</p>
        </div>
      </div>
    );
  }

  if (error && promotions.length === 0) {
    return (
      <div className="workspace-container">
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Error: {error}</p>
          <button onClick={handleRefresh} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container" style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>{isAdmin ? "Promotions & Ad Blocks" : "Active Promotions"}</h1>
        <div style={styles.headerActions}>
          {!isAdmin && <span style={styles.roleBadge}>Student View</span>}
          <div style={styles.headerButtons}>
            {!isMobile && (
              <span style={styles.autoRefreshBadge}>Auto-refresh: 30s</span>
            )}
            <button onClick={handleRefresh} style={styles.refreshBtn} disabled={loading}>
              {isMobile ? "⟳" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {isAdmin && (
        <form
          className="admin-card"
          onSubmit={editingId ? updatePromotion : createPromotion}
          style={styles.form}
        >
          <h3 style={styles.formTitle}>{editingId ? "Edit Campaign" : "Create Campaign"}</h3>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Campaign Title *</label>
              <input
                type="text"
                placeholder="Enter campaign title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Destination URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={form.destinationUrl}
                onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              placeholder="Campaign description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Placement</label>
              <select
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
                style={styles.select}
              >
                <option value="FLOATING_CORNER">Floating Corner</option>
                <option value="FORM_TOP">Form Top</option>
                <option value="FORM_BOTTOM">Form Bottom</option>
                <option value="LEFT_MARGIN">Left Margin</option>
                <option value="RIGHT_MARGIN">Right Margin</option>
                <option value="DASHBOARD_CARD">Dashboard Card</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Audience</label>
              <select
                value={form.audienceRole}
                onChange={(e) => setForm({ ...form, audienceRole: e.target.value })}
                style={styles.select}
              >
                <option value="ALL">Global</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="parent">Parents</option>
                <option value="hod">HOD</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Semester</label>
              <input
                type="number"
                placeholder="0 for all"
                value={form.semester}
                onChange={(e) =>
                  setForm({ ...form, semester: parseInt(e.target.value) || 0 })
                }
                style={styles.input}
                min="0"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Department</label>
              <input
                type="text"
                placeholder="ALL"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Media File * {editingId && "(Optional)"}
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={styles.fileInput}
              required={!editingId}
            />
            <small style={styles.fileHint}>
              Supported formats: JPG, PNG, GIF, WEBP, MP4 (Max 10MB)
            </small>

            {mediaPreview && (
              <div style={styles.previewContainer}>
                <img src={mediaPreview} alt="Preview" style={styles.previewImage} />
                <span style={styles.previewName}>{media.name}</span>
                <span style={styles.previewSize}>{formatFileSize(media.size)}</span>
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Processing..." : editingId ? "Update Campaign" : "Create Campaign"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div style={styles.campaignsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            {isAdmin ? `Existing Campaigns (${promotions.length})` : "Active Promotions"}
          </h2>
          {!isMobile && (
            <span style={styles.lastUpdated}>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>

        {promotions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No promotions available</p>
            <button onClick={handleRefresh} style={styles.refreshBtn}>
              Refresh
            </button>
          </div>
        ) : (
          <div style={styles.campaignsGrid}>
            {promotions.map((promotion) => {
              const mediaUrl = getMediaUrl(promotion);
              return (
                <div
                  key={promotion._id || Math.random()}
                  className="admin-card"
                  style={styles.campaignCard}
                >
                  <div style={styles.campaignHeader}>
                    <h3 style={styles.campaignTitle}>{promotion.title || "Untitled"}</h3>
                    {isAdmin && getStatusBadge(promotion.published)}
                  </div>

                  {mediaUrl && (
                    <div style={styles.mediaPreviewContainer}>
                      {isVideo(promotion) ? (
                        <video
                          src={mediaUrl}
                          style={styles.mediaPreview}
                          controls
                          preload="metadata"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={promotion.title || "Promotion"}
                          style={styles.mediaPreview}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                  )}

                  {promotion.mediaFileId && !isMobile && (
                    <div style={styles.fileIdInfo}>
                      File ID: {promotion.mediaFileId.toString()}
                      <br />
                      Type: {promotion.mediaType || "unknown"}
                    </div>
                  )}

                  <div style={styles.campaignDetails}>
                    <p style={styles.campaignDescription}>
                      {promotion.description || "No description"}
                    </p>

                    <div style={styles.campaignMeta}>
                      <span style={styles.metaTag}>{getPlacementLabel(promotion.placement)}</span>
                      <span style={styles.metaTag}>{promotion.audienceRole || "ALL"}</span>
                      {promotion.semester > 0 && (
                        <span style={styles.metaTag}>Semester {promotion.semester}</span>
                      )}
                      {promotion.department !== "ALL" && promotion.department && (
                        <span style={styles.metaTag}>{promotion.department}</span>
                      )}
                    </div>

                    <div style={styles.campaignStats}>
                      <span style={styles.statItem}>Views: {promotion.views || 0}</span>
                      <span style={styles.statItem}>Clicks: {promotion.clicks || 0}</span>
                      {promotion.views > 0 && (
                        <span style={styles.statItem}>
                          CTR: {((promotion.clicks / promotion.views) * 100).toFixed(1)}%
                        </span>
                      )}
                      {promotion.fileSize && (
                        <span style={styles.statItem}>
                          Size: {formatFileSize(promotion.fileSize)}
                        </span>
                      )}
                      <span style={styles.statItem}>Type: {promotion.mediaType || "image"}</span>
                    </div>

                    <div style={styles.campaignDates}>
                      <span style={styles.dateItem}>
                        Created:{" "}
                        {promotion.createdAt
                          ? new Date(promotion.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                      {promotion.startDate && (
                        <span style={styles.dateItem}>
                          Start: {new Date(promotion.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {promotion.endDate && (
                        <span style={styles.dateItem}>
                          End: {new Date(promotion.endDate).toLocaleDateString()}
                        </span>
                      )}
                      {promotion.mediaFileName && !isMobile && (
                        <span style={styles.dateItem}>File: {promotion.mediaFileName}</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={styles.campaignActions}>
                      <button onClick={() => handleEdit(promotion)} style={styles.editBtn}>
                        Edit
                      </button>

                      {!promotion.published ? (
                        <button
                          onClick={() => publish(promotion._id)}
                          style={styles.publishBtn}
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => unpublish(promotion._id)}
                          style={styles.unpublishBtn}
                        >
                          Unpublish
                        </button>
                      )}

                      <button
                        onClick={() => deletePromotion(promotion._id)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile last updated */}
      {isMobile && (
        <div style={styles.mobileLastUpdated}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    fontSize: 'clamp(1.2rem, 3vw, 2rem)',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  autoRefreshBadge: {
    padding: '4px 12px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  roleBadge: {
    padding: '6px 12px',
    background: '#e0f2fe',
    color: '#0369a1',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  refreshBtn: {
    padding: '10px 20px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    minWidth: '60px',
    transition: 'all 0.2s'
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  form: {
    padding: 'clamp(16px, 3vw, 30px)',
    marginBottom: 'clamp(20px, 3vw, 40px)',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  formTitle: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: 'clamp(1rem, 2vw, 1.3rem)'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#333'
  },
  input: {
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box'
  },
  textarea: {
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    resize: 'vertical',
    width: '100%',
    boxSizing: 'border-box'
  },
  select: {
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    background: 'white',
    width: '100%',
    boxSizing: 'border-box'
  },
  fileInput: {
    padding: '10px',
    border: '2px dashed #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box'
  },
  fileHint: {
    color: '#6b7280',
    fontSize: '0.8rem',
    marginTop: '5px'
  },
  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    padding: '10px',
    background: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap'
  },
  previewImage: {
    width: '60px',
    height: '60px',
    borderRadius: '4px',
    objectFit: 'cover'
  },
  previewName: {
    fontWeight: '500',
    fontSize: '0.9rem',
    wordBreak: 'break-all'
  },
  previewSize: {
    color: '#6b7280',
    fontSize: '0.8rem'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    flexWrap: 'wrap'
  },
  submitBtn: {
    padding: '12px 30px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: 'clamp(0.85rem, 1vw, 1rem)',
    flex: '1 1 auto',
    minWidth: '150px'
  },
  cancelBtn: {
    padding: '12px 30px',
    background: '#e2e8f0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: 'clamp(0.85rem, 1vw, 1rem)',
    flex: '1 1 auto',
    minWidth: '100px'
  },
  campaignsSection: {
    marginTop: '20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: 'clamp(1rem, 2vw, 1.3rem)'
  },
  lastUpdated: {
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  mobileLastUpdated: {
    textAlign: 'center',
    fontSize: '0.7rem',
    color: '#6b7280',
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e2e8f0'
  },
  campaignsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  campaignCard: {
    padding: 'clamp(12px, 2vw, 20px)',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  campaignHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
    gap: '10px',
    flexWrap: 'wrap'
  },
  campaignTitle: {
    margin: 0,
    fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
    wordBreak: 'break-word'
  },
  badgePublished: {
    padding: '4px 12px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  badgeDraft: {
    padding: '4px 12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  mediaPreviewContainer: {
    marginBottom: '15px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#f1f5f9'
  },
  mediaPreview: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover'
  },
  fileIdInfo: {
    fontSize: '0.7rem',
    color: '#999',
    marginBottom: '10px',
    wordBreak: 'break-all'
  },
  campaignDetails: {
    marginBottom: '15px'
  },
  campaignDescription: {
    color: '#4b5563',
    marginBottom: '10px',
    fontSize: 'clamp(0.85rem, 1vw, 0.95rem)',
    wordBreak: 'break-word'
  },
  campaignMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '10px'
  },
  metaTag: {
    padding: '4px 10px',
    background: '#f1f5f9',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#475569',
    wordBreak: 'break-word'
  },
  campaignStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '8px'
  },
  statItem: {
    fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)',
    color: '#475569'
  },
  campaignDates: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  dateItem: {
    padding: '2px 8px',
    background: '#f8fafc',
    borderRadius: '4px',
    wordBreak: 'break-word'
  },
  campaignActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '15px',
    borderTop: '1px solid #e2e8f0'
  },
  editBtn: {
    padding: '6px 14px',
    background: '#f1f5f9',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: '1 1 auto',
    minWidth: '60px'
  },
  publishBtn: {
    padding: '6px 14px',
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: '1 1 auto',
    minWidth: '60px'
  },
  unpublishBtn: {
    padding: '6px 14px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: '1 1 auto',
    minWidth: '60px'
  },
  deleteBtn: {
    padding: '6px 14px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: '1 1 auto',
    minWidth: '60px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '1.1rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'clamp(30px, 5vw, 60px)',
    background: '#f9fafb',
    borderRadius: '12px',
    color: '#6b7280'
  }
};

export default AdminPromotionDashboard;