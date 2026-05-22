// Builds WhatsApp-ready announcement text for talks and recaps. WhatsApp
// renders *bold* with single asterisks. Paste the result into your channel
// (and attach the poster image there — clipboard text can't carry the image).

const LOCATION = "Mochachos, Rosebank Mall";

function formatDate(dateStr: string): string {
  // Parse as local midnight so the weekday/day don't shift across time zones.
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatTalkAnnouncement(t: {
  title: string;
  talkDate: string;
  startTime: string;
  description?: string;
}): string {
  const lines = [
    "*This Week at B.O.L.D. Bible Discussions* 🔥📖",
    "",
    `*Topic: ${t.title}*`,
  ];
  if (t.description?.trim()) {
    lines.push("", t.description.trim());
  }
  lines.push(
    "",
    `📅 ${formatDate(t.talkDate)} · ${formatTime(t.startTime)}`,
    `📍 ${LOCATION}`,
    "",
    "Come share, listen, and grow with us. Everyone's welcome. 🌱",
  );
  return lines.join("\n");
}

export function formatRecapAnnouncement(r: {
  title: string;
  talkDate: string;
  content?: string;
}): string {
  const lines = [
    "*Recap — B.O.L.D. Bible Discussions* 📖",
    "",
    `*${r.title}*`,
    `📅 ${formatDate(r.talkDate)}`,
  ];
  if (r.content?.trim()) {
    lines.push("", r.content.trim());
  }
  return lines.join("\n");
}
