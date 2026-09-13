import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function DashboardCard({ title, description, icon, iconClass, onClick }) {
  return (
    <div onClick={onClick} className="bento-card group">
      <div>
        <div className="bento-card-header">
          <div className="bento-icon-wrapper">
            {icon && <FontAwesomeIcon icon={icon} className="bento-icon" />}
            {iconClass && <i className={`${iconClass} bento-icon`}></i>}
          </div>
          <FontAwesomeIcon icon={faArrowRight} className="bento-arrow" />
        </div>
        <h3 className="bento-card-title">{title}</h3>
        <p className="bento-card-desc">{description}</p>
      </div>
    </div>
  );
}
