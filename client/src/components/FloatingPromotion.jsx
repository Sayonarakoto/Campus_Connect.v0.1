import { useEffect, useState } from "react";
import axios from "axios";
import "./GlassPromotion.css";

function FloatingPromotion({ promotion }) {
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
        e.stopPropagation();
        
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

    const mediaUrl = getMediaUrl();
    const isVideo = promotion?.mediaType === 'video' || 
                   (promotion?.mimeType && promotion?.mimeType.startsWith('video/'));

    // Close floating promotion
    const handleClose = (e) => {
        e.stopPropagation();
        const floatingElement = e.currentTarget.closest('.glass-floating');
        if (floatingElement) {
            floatingElement.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                floatingElement.style.display = 'none';
            }, 300);
        }
    };

    return (
        <div className="glass-floating">
            {/* Close button */}
            <button 
                className="floating-close-btn" 
                onClick={handleClose}
                aria-label="Close promotion"
            >
                ✕
            </button>

            {/* Media Display - GridFS */}
            {mediaUrl && !imageError ? (
                <div className="floating-media-container" onClick={handleClick}>
                    {isVideo ? (
                        <video
                            src={mediaUrl}
                            className="floating-media"
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
                            className="floating-media"
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
                        <div className="floating-loading">
                            <span>Loading...</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="floating-fallback" onClick={handleClick}>
                    <span>🖼️</span>
                    <span className="fallback-text">Image not available</span>
                </div>
            )}

            {/* Content */}
            <div className="floating-content" onClick={handleClick}>
                <h4 className="floating-title">{promotion.title}</h4>
                
                {promotion.description && (
                    <p className="floating-description">{promotion.description}</p>
                )}
            </div>

            {/* CTA Button */}
            {promotion.destinationUrl && (
                <button 
                    className="floating-cta-btn"
                    onClick={handleClick}
                >
                    Learn More →
                </button>
            )}

            {/* Add animation keyframes */}
            <style>{`
                .glass-floating {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 320px;
                    max-width: 90vw;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    animation: slideIn 0.5s ease forwards;
                    transition: all 0.3s ease;
                }

                .glass-floating:hover {
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
                    background: rgba(255, 255, 255, 0.2);
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100px);
                        opacity: 0;
                    }
                }

                .floating-close-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 28px;
                    height: 28px;
                    border: none;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.2);
                    color: #fff;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 10;
                }

                .floating-close-btn:hover {
                    background: rgba(0, 0, 0, 0.4);
                    transform: scale(1.1);
                }

                .floating-media-container {
                    position: relative;
                    width: 100%;
                    padding-top: 56.25%;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    margin-bottom: 12px;
                }

                .floating-media {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .floating-loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #999;
                    font-size: 0.85rem;
                }

                .floating-fallback {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 30px 20px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 8px;
                    color: #999;
                    font-size: 2rem;
                    gap: 8px;
                    cursor: pointer;
                    margin-bottom: 12px;
                }

                .fallback-text {
                    font-size: 0.85rem;
                }

                .floating-content {
                    cursor: pointer;
                    margin-bottom: 12px;
                }

                .floating-title {
                    margin: 0 0 6px 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .floating-description {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #555;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .floating-cta-btn {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #4a6cf7, #6b8cff);
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .floating-cta-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(74, 108, 247, 0.4);
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .glass-floating {
                        background: rgba(0, 0, 0, 0.5);
                        border-color: rgba(255, 255, 255, 0.1);
                    }

                    .glass-floating:hover {
                        background: rgba(0, 0, 0, 0.6);
                    }

                    .floating-title {
                        color: #f0f0f0;
                    }

                    .floating-description {
                        color: #aaa;
                    }

                    .floating-fallback {
                        background: rgba(255, 255, 255, 0.05);
                        color: #666;
                    }

                    .fallback-text {
                        color: #666;
                    }
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .glass-floating {
                        bottom: 20px;
                        right: 20px;
                        width: calc(100% - 40px);
                        max-width: 400px;
                        padding: 16px;
                    }

                    .floating-media-container {
                        padding-top: 66.67%;
                    }

                    .floating-title {
                        font-size: 0.95rem;
                    }

                    .floating-description {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default FloatingPromotion;