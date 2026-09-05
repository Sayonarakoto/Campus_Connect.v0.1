import { useEffect, useState } from "react";
import axios from "axios";
import "./GlassPromotion.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function SidePromotion({ promotion, side }) {
  const token = localStorage.getItem("token");
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  /* =====================================================
     CLICK TRACKING
  ===================================================== */

  const handleClick = async () => {
    try {
      await axios.post(
        `${API}/api/promotions/click/${promotion._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Promotion click tracking failed:", err);
    }

    /* =================================================
       DESTINATION
    ================================================= */

    if (promotion.destinationUrl) {
      window.open(
        promotion.destinationUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  /* =====================================================
     VIEW TRACKING
  ===================================================== */

  useEffect(() => {
    const trackView = async () => {
      try {
        await axios.post(
          `${API}/api/promotions/view/${promotion._id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error("Promotion view tracking failed:", err);
      }
    };

    if (promotion?._id) {
      trackView();
    }
  }, [promotion?._id, token]);

  /* =====================================================
     GRIDFS MEDIA URL - FIXED: Use mediaFileId
  ===================================================== */

  const getMediaUrl = () => {
    // Use mediaFileId from the new GridFS schema
    if (promotion?.mediaFileId) {
      const fileId = promotion.mediaFileId.toString();
      return `${API}/api/promotions/media/${fileId}`;
    }
    
    // Fallback for backward compatibility
    if (promotion?.media) {
      return `${API}/api/promotions/media/${promotion.media}`;
    }
    
    return null;
  };

  const mediaUrl = getMediaUrl();

  /* =====================================================
     IS VIDEO
  ===================================================== */

  const isVideo = promotion?.mediaType === 'video' || 
                  (promotion?.mimeType && promotion?.mimeType.startsWith('video/'));

  /* =====================================================
     HANDLE MEDIA ERROR
  ===================================================== */

  const handleMediaError = (e) => {
    console.error("Side promotion media failed:", {
      promotionId: promotion?._id,
      title: promotion?.title,
      mediaUrl: mediaUrl,
      mediaFileId: promotion?.mediaFileId,
      error: e
    });
    setImageError(true);
  };

  /* =====================================================
     NO MEDIA
  ===================================================== */

  if (!mediaUrl) {
    console.warn("Side promotion has no media:", {
      promotionId: promotion?._id,
      title: promotion?.title,
      mediaFileId: promotion?.mediaFileId
    });
    return null;
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`glass-side ${side}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
    >
      {/* Media Display */}
      <div className="side-media-container">
        {!imageError ? (
          isVideo ? (
            <video
              src={mediaUrl}
              muted
              autoPlay
              loop
              playsInline
              className="side-media"
              onError={handleMediaError}
              onLoadedData={() => {
                console.log("✅ Side video loaded:", promotion?.title);
                setImageLoaded(true);
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={promotion?.title || "Promotion"}
              className="side-media"
              onError={handleMediaError}
              onLoad={() => {
                console.log("✅ Side image loaded:", promotion?.title);
                setImageLoaded(true);
              }}
              loading="lazy"
            />
          )
        ) : (
          <div className="side-fallback">
            <span>🖼️</span>
            <span className="fallback-text">Image not available</span>
          </div>
        )}

        {/* Loading indicator */}
        {!imageLoaded && !imageError && (
          <div className="side-loading">
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Style overrides */}
      <style>{`
        .glass-side {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          width: 120px;
          max-height: 200px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          animation: slideInSide 0.5s ease forwards;
        }

        .glass-side:hover {
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.15);
        }

        .glass-side.left {
          left: 20px;
          border-radius: 12px 12px 12px 0;
        }

        .glass-side.right {
          right: 20px;
          border-radius: 12px 12px 0 12px;
        }

        @keyframes slideInSide {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .glass-side.right {
          animation: slideInSideRight 0.5s ease forwards;
        }

        @keyframes slideInSideRight {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .side-media-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 120px;
          background: rgba(0, 0, 0, 0.05);
        }

        .side-media {
          width: 100%;
          height: 100%;
          max-height: 200px;
          object-fit: cover;
          display: block;
        }

        .side-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #999;
          font-size: 0.75rem;
        }

        .side-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 10px;
          min-height: 120px;
          background: rgba(0, 0, 0, 0.03);
          color: #999;
          font-size: 1.5rem;
          gap: 5px;
        }

        .fallback-text {
          font-size: 0.7rem;
          color: #999;
          text-align: center;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .glass-side {
            background: rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .glass-side:hover {
            background: rgba(0, 0, 0, 0.6);
          }

          .side-fallback {
            background: rgba(255, 255, 255, 0.05);
            color: #666;
          }

          .fallback-text {
            color: #666;
          }
        }

        /* Mobile responsive - hide side promotions on small screens */
        @media (max-width: 768px) {
          .glass-side {
            display: none;
          }
        }

        /* Tablet */
        @media (min-width: 769px) and (max-width: 1024px) {
          .glass-side {
            width: 80px;
            max-height: 140px;
          }

          .glass-side.left {
            left: 10px;
          }

          .glass-side.right {
            right: 10px;
          }

          .side-media {
            max-height: 140px;
          }
        }

        /* Large screens */
        @media (min-width: 1440px) {
          .glass-side {
            width: 150px;
            max-height: 250px;
          }

          .side-media {
            max-height: 250px;
          }

          .glass-side.left {
            left: 30px;
          }

          .glass-side.right {
            right: 30px;
          }
        }

        /* Accessibility - focus styles */
        .glass-side:focus-visible {
          outline: 2px solid #4a6cf7;
          outline-offset: 2px;
        }

        /* Optional: Pulse animation */
        @keyframes sidePulse {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 4px 24px rgba(74, 108, 247, 0.15);
          }
        }

        .glass-side {
          animation: slideInSide 0.5s ease forwards, sidePulse 3s ease-in-out 0.5s infinite;
        }

        .glass-side.right {
          animation: slideInSideRight 0.5s ease forwards, sidePulse 3s ease-in-out 0.5s infinite;
        }
      `}</style>
    </div>
  );
}

export default SidePromotion;