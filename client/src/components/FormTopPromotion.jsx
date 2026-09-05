import { useEffect, useState } from "react";
import axios from "axios";
import "./GlassPromotion.css";

function FormTopPromotion({ promotion }) {
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
    const handleClick = async () => {
        try {
            await axios.post(
                `http://localhost:5000/api/promotions/click/${promotion._id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

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

    const mediaUrl = getMediaUrl();
    const isVideo = promotion?.mediaType === 'video' || 
                   (promotion?.mimeType && promotion?.mimeType.startsWith('video/'));

    return (
        <div className="glass-form-top" onClick={handleClick}>
            {/* Media Display - GridFS */}
            {mediaUrl && !imageError && (
                <div className="form-top-media">
                    {isVideo ? (
                        <video
                            src={mediaUrl}
                            className="form-top-video"
                            autoPlay
                            muted
                            loop
                            playsInline
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
                            className="form-top-image"
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
                </div>
            )}

            {/* Content */}
            <div className="form-top-content">
                <h1 className="form-top-title">
                    {promotion.title}
                </h1>

                {promotion.description && (
                    <h4 className="form-top-description">
                        {promotion.description}
                    </h4>
                )}

                {/* CTA Button */}
                {promotion.destinationUrl && (
                    <button className="form-top-cta">
                        Learn More →
                    </button>
                )}
            </div>

            {/* Style overrides */}
            <style>{`
                .glass-form-top {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 16px 24px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
                    margin-bottom: 20px;
                }

                .glass-form-top:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                    background: rgba(255, 255, 255, 0.15);
                }

                .form-top-media {
                    flex-shrink: 0;
                    width: 120px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.05);
                }

                .form-top-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .form-top-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .form-top-content {
                    flex: 1;
                    min-width: 0;
                }

                .form-top-title {
                    margin: 0 0 4px 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .form-top-description {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: 400;
                    color: #555;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .form-top-cta {
                    flex-shrink: 0;
                    padding: 8px 20px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #4a6cf7, #6b8cff);
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }

                .form-top-cta:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.3);
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .glass-form-top {
                        flex-direction: column;
                        align-items: stretch;
                        padding: 16px;
                        gap: 12px;
                    }

                    .form-top-media {
                        width: 100%;
                        height: 120px;
                    }

                    .form-top-title {
                        font-size: 1rem;
                    }

                    .form-top-description {
                        font-size: 0.85rem;
                    }

                    .form-top-cta {
                        width: 100%;
                        text-align: center;
                    }
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .glass-form-top {
                        background: rgba(0, 0, 0, 0.4);
                        border-color: rgba(255, 255, 255, 0.1);
                    }

                    .glass-form-top:hover {
                        background: rgba(0, 0, 0, 0.5);
                    }

                    .form-top-title {
                        color: #f0f0f0;
                    }

                    .form-top-description {
                        color: #aaa;
                    }

                    .form-top-media {
                        background: rgba(255, 255, 255, 0.05);
                    }
                }

                /* Small screens */
                @media (max-width: 480px) {
                    .glass-form-top {
                        padding: 12px;
                        border-radius: 8px;
                    }

                    .form-top-media {
                        height: 100px;
                    }

                    .form-top-title {
                        font-size: 0.95rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default FormTopPromotion;