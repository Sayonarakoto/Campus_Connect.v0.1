import { useEffect, useState } from "react";
import axios from "axios";
import "./GlassPromotion.css";

function DashboardPromotion({ promotion }) {
    const token = localStorage.getItem("token");
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Get the media URL from GridFS
    const getMediaUrl = () => {
        if (!promotion?.mediaFileId) {
            return null;
        }
        const fileId = promotion.mediaFileId.toString();
        return `http://localhost:5000/api/promotions/media/${fileId}`;
    };

    // Handle click tracking
    const handleClick = async (e) => {
        // Don't trigger if clicking on the image or video
        if (e.target.closest('.promotion-media-container')) {
            return;
        }

        try {
            // Track the click
            await axios.post(
                `http://localhost:5000/api/promotions/click/${promotion._id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Open destination URL if exists
            if (promotion.destinationUrl) {
                window.open(promotion.destinationUrl, "_blank");
            }
        } catch (error) {
            console.error("Error tracking click:", error);
            // Still open the URL even if tracking fails
            if (promotion.destinationUrl) {
                window.open(promotion.destinationUrl, "_blank");
            }
        }
    };

    // Track view when component mounts
    useEffect(() => {
        const trackView = async () => {
            try {
                await axios.post(
                    `http://localhost:5000/api/promotions/view/${promotion._id}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } catch (error) {
                console.error("Error tracking view:", error);
            }
        };

        if (promotion?._id) {
            trackView();
        }
    }, [promotion?._id, token]);

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return null;
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    };

    const mediaUrl = getMediaUrl();
    const isVideo = promotion?.mediaType === 'video' || 
                   (promotion?.mimeType && promotion?.mimeType.startsWith('video/'));

    return (
        <div
            className="glass-dashboard-card"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e);
                }
            }}
        >
            {/* Media Display - GridFS */}
            {mediaUrl && !imageError && (
                <div className="promotion-media-container">
                    {isVideo ? (
                        <video
                            src={mediaUrl}
                            className="promotion-media"
                            controls
                            preload="metadata"
                            onClick={(e) => e.stopPropagation()}
                            onError={(e) => {
                                console.error("Video load error:", e);
                                setImageError(true);
                            }}
                            onLoadedData={() => {
                                console.log("✅ Video loaded:", promotion.title);
                                setImageLoaded(true);
                            }}
                        />
                    ) : (
                        <img
                            src={mediaUrl}
                            alt={promotion.title || "Promotion image"}
                            className="promotion-media"
                            onError={(e) => {
                                console.error("Image load error:", e);
                                console.log("Failed URL:", mediaUrl);
                                setImageError(true);
                            }}
                            onLoad={() => {
                                console.log("✅ Image loaded:", promotion.title);
                                setImageLoaded(true);
                            }}
                            loading="lazy"
                        />
                    )}
                    
                    {/* Loading indicator */}
                    {!imageLoaded && !imageError && (
                        <div className="promotion-media-loading">
                            <span>Loading...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Fallback when image fails to load */}
            {imageError && (
                <div className="promotion-media-fallback">
                    <span>🖼️</span>
                    <span className="fallback-text">Image not available</span>
                </div>
            )}

            {/* Content */}
            <div className="promotion-content">
                <h3 className="promotion-title">{promotion.title}</h3>
                
                {promotion.description && (
                    <p className="promotion-description">{promotion.description}</p>
                )}

                {/* Metadata */}
                <div className="promotion-meta">
                    {promotion.placement && (
                        <span className="promotion-tag">
                            📍 {promotion.placement.replace('_', ' ')}
                        </span>
                    )}
                    {promotion.audienceRole && promotion.audienceRole !== 'ALL' && (
                        <span className="promotion-tag">
                            👥 {promotion.audienceRole}
                        </span>
                    )}
                    {promotion.fileSize && (
                        <span className="promotion-tag">
                            📁 {formatFileSize(promotion.fileSize)}
                        </span>
                    )}
                    {promotion.mediaType && (
                        <span className="promotion-tag">
                            {promotion.mediaType === 'video' ? '🎬' : '🖼️'} {promotion.mediaType}
                        </span>
                    )}
                    {promotion.views > 0 && (
                        <span className="promotion-tag">
                            👁️ {promotion.views}
                        </span>
                    )}
                </div>

                {/* CTA if no destination URL in the main card */}
                {promotion.destinationUrl && (
                    <div className="promotion-cta">
                        <span className="promotion-cta-text">Click to learn more →</span>
                    </div>
                )}
            </div>

            {/* Style overrides for better Glass effect */}
            <style>{`
                .glass-dashboard-card {
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    padding: 0;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .glass-dashboard-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
                    background: rgba(255, 255, 255, 0.15);
                }

                .promotion-media-container {
                    position: relative;
                    width: 100%;
                    padding-top: 56.25%; /* 16:9 aspect ratio */
                    background: rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }

                .promotion-media {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .promotion-media-loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #999;
                    font-size: 0.9rem;
                }

                .promotion-media-fallback {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    background: rgba(0, 0, 0, 0.03);
                    color: #999;
                    font-size: 2rem;
                    gap: 10px;
                }

                .fallback-text {
                    font-size: 0.85rem;
                    color: #999;
                }

                .promotion-content {
                    padding: 16px 20px 20px;
                }

                .promotion-title {
                    margin: 0 0 8px 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .promotion-description {
                    margin: 0 0 12px 0;
                    font-size: 0.9rem;
                    color: #555;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .promotion-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 10px;
                }

                .promotion-tag {
                    padding: 2px 10px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 12px;
                    font-size: 0.7rem;
                    color: #666;
                    white-space: nowrap;
                }

                .promotion-cta {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid rgba(0, 0, 0, 0.05);
                }

                .promotion-cta-text {
                    font-size: 0.85rem;
                    color: #4a6cf7;
                    font-weight: 500;
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .glass-dashboard-card {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(255, 255, 255, 0.1);
                    }

                    .glass-dashboard-card:hover {
                        background: rgba(255, 255, 255, 0.08);
                    }

                    .promotion-title {
                        color: #f0f0f0;
                    }

                    .promotion-description {
                        color: #aaa;
                    }

                    .promotion-tag {
                        background: rgba(255, 255, 255, 0.08);
                        color: #aaa;
                    }

                    .promotion-media-fallback {
                        background: rgba(255, 255, 255, 0.03);
                        color: #666;
                    }

                    .fallback-text {
                        color: #666;
                    }

                    .promotion-cta-text {
                        color: #6b8cff;
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .promotion-content {
                        padding: 12px 16px 16px;
                    }

                    .promotion-title {
                        font-size: 1rem;
                    }

                    .promotion-description {
                        font-size: 0.85rem;
                    }

                    .promotion-media-container {
                        padding-top: 66.67%; /* 3:2 aspect ratio for mobile */
                    }
                }
            `}</style>
        </div>
    );
}

export default DashboardPromotion;