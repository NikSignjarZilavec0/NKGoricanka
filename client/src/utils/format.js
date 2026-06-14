/** Slovenian labels and formatting helpers. */

export const POSITION_LABELS = {
  goalkeeper: 'Vratar',
  defender: 'Branilec',
  midfielder: 'Vezist',
  forward: 'Napadalec',
};

export const POSITION_GROUPS = [
  { key: 'goalkeeper', label: 'Vratarji' },
  { key: 'defender', label: 'Branilci' },
  { key: 'midfielder', label: 'Vezisti' },
  { key: 'forward', label: 'Napadalci' },
];

export const STATUS_LABELS = {
  upcoming: 'Prihajajoča',
  finished: 'Odigrana',
  cancelled: 'Odpovedana',
};

const dateFmt = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('sl-SI', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const shortFmt = new Intl.DateTimeFormat('sl-SI', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function formatDate(value) {
  if (!value) return '';
  return dateFmt.format(new Date(value));
}
export function formatDateTime(value) {
  if (!value) return '';
  return dateTimeFmt.format(new Date(value));
}
export function formatShortDate(value) {
  if (!value) return '';
  return shortFmt.format(new Date(value));
}

/** Age in whole years from a birthdate. */
export function ageFrom(birthdate) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

/** "yyyy-mm-dd" for <input type="date"> / "datetime-local". */
export function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
export function toDateTimeInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
