import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import ProgramCard from "./ProgramCard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarGrid({
  currentYear,
  currentMonth,
  programs,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onProgramClick
}) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonthLast = new Date(currentYear, currentMonth - 1, 0).getDate();

  const cells = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    cells.push({
      day,
      currentMonth: false,
      date: new Date(currentYear, currentMonth - 2, day)
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      currentMonth: true,
      date: new Date(currentYear, currentMonth - 1, d)
    });
  }

  // Next month leading days
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      day: i,
      currentMonth: false,
      date: new Date(currentYear, currentMonth, i)
    });
  }

  // Group programs by date
  const programsByDate = {};
  programs.forEach((prog) => {
    const start = new Date(prog.startDate);
    const end = new Date(prog.endDate);

    const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    let current = new Date(sDate);
    while (current <= eDate) {
      const key = current.toISOString().split("T")[0];
      if (!programsByDate[key]) programsByDate[key] = [];
      programsByDate[key].push(prog);
      current.setDate(current.getDate() + 1);
    }
  });

  const MAX_VISIBLE = 3;

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="ac-calendar-wrapper">
      <div className="ac-calendar-nav">
        <button className="ac-calendar-nav-btn" onClick={onPrevMonth}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h3>
          {monthNames[currentMonth - 1]} {currentYear}
        </h3>
        <button className="ac-calendar-nav-btn" onClick={onNextMonth}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      <div className="ac-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="ac-calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="ac-calendar-days">
        {cells.map((cell, idx) => {
          const dateKey = cell.date.toISOString().split("T")[0];
          const dayPrograms = programsByDate[dateKey] || [];

          return (
            <div
              key={idx}
              className={`ac-calendar-day ${!cell.currentMonth ? "other-month" : ""} ${isToday(cell.date) ? "today" : ""}`}
              onClick={() => onDayClick && onDayClick(cell.date, dayPrograms)}
            >
              <div className="ac-day-number">
                {isToday(cell.date) ? (
                  <span>{cell.day}</span>
                ) : (
                  cell.day
                )}
              </div>
              <div className="ac-day-programs">
                {dayPrograms.slice(0, MAX_VISIBLE).map((prog, pIdx) => (
                  <ProgramCard
                    key={`${prog._id}-${pIdx}`}
                    program={prog}
                    compact
                    onClick={onProgramClick}
                  />
                ))}
                {dayPrograms.length > MAX_VISIBLE && (
                  <span className="ac-more-programs">
                    +{dayPrograms.length - MAX_VISIBLE} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarGrid;
