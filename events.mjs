import { getStore } from '@netlify/blobs';

const STORE = 'clare-county-events';
const KEY = 'events.json';
const DEFAULT_PIN = '1907';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, x-admin-pin',
      'access-control-allow-methods': 'GET, PUT, POST, OPTIONS',
    },
  });

const pin = () => (process.env.ADMIN_PIN || DEFAULT_PIN).trim();

function store() {
  return getStore({ name: STORE, consistency: 'strong' });
}

async function readAll() {
  try {
    const data = await store().get(KEY, { type: 'json' });
    if (data && Array.isArray(data.events)) return data;
  } catch (err) {
    console.log('blob read failed:', err && err.message);
  }
  return { events: [], updatedAt: null };
}

const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const SECTIONS = ['beavers', 'cubs', 'scouts', 'ventures', 'rovers', 'scouters'];
const CATEGORIES = ['training', 'county', 'national'];
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

function clean(raw, i) {
  if (!raw || typeof raw !== 'object') return null;
  const start = isDate(raw.start) ? raw.start : null;
  if (!start) return null;
  const name = str(raw.name, 160);
  if (!name) return null;
  let end = isDate(raw.end) ? raw.end : '';
  if (end && end < start) end = '';
  const sections = Array.isArray(raw.sections)
    ? [...new Set(raw.sections.filter((s) => SECTIONS.includes(s)))]
    : [];
  return {
    id: str(raw.id, 40) || `ev_${Date.now().toString(36)}_${i}`,
    name,
    start,
    end,
    allDay: raw.allDay === false ? false : true,
    time: str(raw.time, 40),
    category: CATEGORIES.includes(raw.category) ? raw.category : 'county',
    sections: sections.length ? sections : [...SECTIONS],
    description: str(raw.description, 4000),
    host: str(raw.host, 160),
    location: str(raw.location, 200),
    contactName: str(raw.contactName, 120),
    contactEmail: str(raw.contactEmail, 160),
    contactPhone: str(raw.contactPhone, 60),
  };
}

export default async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';

  if (req.method === 'POST' && action === 'auth') {
    let body = {};
    try {
      body = await req.json();
    } catch {}
    return json({ ok: str(body.pin, 32) === pin() });
  }

  if (req.method === 'GET') {
    const data = await readAll();
    return json(data);
  }

  if (req.method === 'PUT') {
    if (str(req.headers.get('x-admin-pin') || '', 32) !== pin()) {
      return json({ error: 'Incorrect PIN' }, 401);
    }
    let body = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Bad JSON' }, 400);
    }
    if (!Array.isArray(body.events)) return json({ error: 'events must be an array' }, 400);
    if (body.events.length > 2000) return json({ error: 'Too many events' }, 400);

    const events = body.events
      .map(clean)
      .filter(Boolean)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.name.localeCompare(b.name)));

    const payload = { events, updatedAt: new Date().toISOString() };
    try {
      await store().setJSON(KEY, payload);
    } catch (err) {
      console.log('blob write failed:', err && err.message);
      return json({ error: 'Could not save. Netlify Blobs may not be enabled for this site.' }, 500);
    }
    return json(payload);
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/events' };
