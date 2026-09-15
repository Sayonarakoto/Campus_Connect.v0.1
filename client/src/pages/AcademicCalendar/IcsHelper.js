/**
 * ICS Helper - Generate .ics files for Google Calendar import
 * Lightweight client-side implementation, no dependencies
 */

export function generateIcsFile(program) {
  const formatIcsDate = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    const [hours, minutes] = timeStr.split(":").map(Number);
    d.setHours(hours, minutes, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${year}${month}${day}T${hh}${mm}00`;
  };

  const escapeIcsText = (text) => {
    return (text || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const now = new Date();
  const stamp = formatIcsDate(now.toISOString(), `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusConnect//AcademicCalendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatIcsDate(program.startDate, program.startTime)}`,
    `DTEND:${formatIcsDate(program.endDate, program.endTime)}`,
    `SUMMARY:${escapeIcsText(program.title)}`,
    `DESCRIPTION:${escapeIcsText(program.description)}`,
    `LOCATION:${escapeIcsText(program.venue)}`,
    `UID:${program._id || Date.now()}@campusconnect`,
    `DTSTAMP:${stamp}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return icsContent;
}

export function downloadIcsFile(program) {
  const icsContent = generateIcsFile(program);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${(program.title || "event").replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(program) {
  const formatGCalDate = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    const [hours, minutes] = timeStr.split(":").map(Number);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: program.title || "",
    dates: `${formatGCalDate(program.startDate, program.startTime)}/${formatGCalDate(program.endDate, program.endTime)}`,
    details: program.description || "",
    location: program.venue || ""
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
