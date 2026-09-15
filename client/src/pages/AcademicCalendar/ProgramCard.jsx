import React from "react";

const TYPE_COLORS = {
  Workshop: { bg: "#dbeafe", color: "#1e40af" },
  Seminar: { bg: "#ede9fe", color: "#6d28d9" },
  "Guest Lecture": { bg: "#d1fae5", color: "#065f46" },
  Exam: { bg: "#fee2e2", color: "#991b1b" },
  Lab: { bg: "#cffafe", color: "#155e75" },
  Cultural: { bg: "#fce7f3", color: "#9d174d" },
  Sports: { bg: "#ffedd5", color: "#9a3412" },
  Holiday: { bg: "#f1f5f9", color: "#475569" },
  Orientation: { bg: "#e0e7ff", color: "#3730a3" },
  Conference: { bg: "#ccfbf1", color: "#115e59" },
  Other: { bg: "#f3f4f6", color: "#374151" }
};

function ProgramCard({ program, onClick, compact = false }) {
  const colors = TYPE_COLORS[program.programType] || TYPE_COLORS.Other;

  if (compact) {
    return (
      <div
        className={`ac-program-dot ${program.programType}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(program);
        }}
        title={`${program.title} (${program.startTime} - ${program.endTime})`}
      >
        <span className="dot-indicator" />
        {program.title}
      </div>
    );
  }

  return (
    <div
      className="ac-sidebar-item"
      onClick={() => onClick && onClick(program)}
    >
      <span
        className="ac-sidebar-item-type"
        style={{ background: colors.bg, color: colors.color }}
      >
        {program.programType}
      </span>
      <div className="ac-sidebar-item-title">{program.title}</div>
      <div className="ac-sidebar-item-meta">
        {program.startTime} - {program.endTime} | {program.venue}
      </div>
      <div className="ac-sidebar-item-meta" style={{ marginTop: "2px" }}>
        {program.department}
      </div>
    </div>
  );
}

export default ProgramCard;
