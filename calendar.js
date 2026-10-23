// Календарь: ссылка для Google Календаря и файл .ics (Apple, Outlook и др.)
function pad2(n) { return String(n).padStart(2, "0"); }

function fmtLocal(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
        "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00";
}

function icsEscape(t) {
    return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// data: { date: "2026-11-07", time: "19:30", place, activity, note }
function buildEvent(data) {
    const [y, m, d] = data.date.split("-").map(Number);
    const [hh, mm] = data.time.split(":").map(Number);
    const start = new Date(y, m - 1, d, hh, mm);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // свидание ~2 часа
    const title = "Свидание ❤️";
    const details = ["Куда пойдём: " + data.activity, data.note ? "Пожелания: " + data.note : ""]
        .filter(Boolean).join("\n");

    const google = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(title) +
        "&dates=" + fmtLocal(start) + "/" + fmtLocal(end) +
        "&details=" + encodeURIComponent(details) +
        "&location=" + encodeURIComponent(data.place);

    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Svidanie//RU",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        "UID:" + stamp + "-" + Math.random().toString(36).slice(2) + "@svidanie",
        "DTSTAMP:" + stamp,
        "DTSTART:" + fmtLocal(start),
        "DTEND:" + fmtLocal(end),
        "SUMMARY:" + icsEscape(title),
        "LOCATION:" + icsEscape(data.place),
        "DESCRIPTION:" + icsEscape(details),
        "BEGIN:VALARM",
        "TRIGGER:-PT2H",
        "ACTION:DISPLAY",
        "DESCRIPTION:Скоро свидание",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    return { google: google, ics: ics };
}

function downloadIcs(ev) {
    const blob = new Blob([ev.ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "svidanie.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
