// Emulator lokal Supabase untuk pengujian keamanan.
//
// MESIN DATABASE ASLI: PostgreSQL (PGlite/WASM) menjalankan migrasi SQL sungguhan, role
// anon/authenticated/service_role sungguhan, RLS, GRANT, dan SECURITY DEFINER sungguhan.
// LAPISAN API yang DIEMULASI: PostgREST (/rest/v1) dan Storage (/storage/v1) — termasuk
// verifikasi JWT HS256, SET ROLE per-permintaan, dan RLS pada storage.objects.
// Emulator ini TIDAK menggantikan uji di proyek Supabase staging yang sebenarnya.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');

const b64u = (buf) => Buffer.from(buf).toString('base64url');

export function signJwt(payload, secret) {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('InvalidJWT');
  const expected = crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest();
  const given = Buffer.from(parts[2], 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new Error('InvalidJWT');
  }
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (claims.exp && claims.exp * 1000 < Date.now()) throw new Error('"exp" claim timestamp check failed');
  return claims;
}

const BOOTSTRAP_SQL = `
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL, owner uuid, metadata jsonb, created_at timestamptz DEFAULT now(),
  UNIQUE (bucket_id, name)
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
  $$ SELECT (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)] $$;

CREATE PUBLICATION supabase_realtime;

-- Meniru default privileges Supabase: objek baru di schema public terbuka untuk
-- anon/authenticated/service_role (inilah sebab hardening harus mencabut hak secara eksplisit).
GRANT USAGE ON SCHEMA public, storage, auth TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role;
`;

const SAFE_IDENT = /^[a-z_][a-z0-9_]{0,62}$/;
const ROLES = new Set(['anon', 'authenticated', 'service_role']);

function mapPgError(err, role) {
  const code = err?.code || 'XX000';
  let status = 400;
  if (code === '42501') status = role === 'anon' ? 401 : 403;
  else if (code === '42883' || code === '42P01') status = 404;
  return { status, body: { code, message: String(err?.message || 'error'), details: null, hint: null } };
}

export async function createEmulator({ stage = 'hardened', jwtSecret } = {}) {
  const secret = jwtSecret || crypto.randomBytes(32).toString('hex');
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.waitReady;
  await db.exec(BOOTSTRAP_SQL);
  await db.exec(fs.readFileSync(path.join(ROOT, 'supabase_schema.sql'), 'utf8'));
  await db.exec(fs.readFileSync(path.join(__dirname, 'baseline.sql'), 'utf8'));
  await db.exec(fs.readFileSync(path.join(ROOT, 'supabase_reports_migration.sql'), 'utf8'));
  if (stage === 'hardened') {
    const migrationsDir = path.join(ROOT, 'supabase', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of migrationFiles) {
      await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    }
  }

  const objectStore = new Map(); // "bucket/path" -> { bytes, contentType }
  const requestLog = [];
  const users = new Map(); // email -> { id, password }

  const mkKey = (role) => signJwt({ role, iss: 'emulator', exp: 4102444800 }, secret);
  const keys = { anon: mkKey('anon'), service: mkKey('service_role') };

  function claimsFromHeaders(req) {
    const auth = req.headers['authorization'] || '';
    const apikey = req.headers['apikey'] || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const token = bearer || apikey;
    if (!token) throw Object.assign(new Error('No API key found in request'), { http: 401 });
    try {
      const claims = verifyJwt(token, secret);
      if (!ROLES.has(claims.role)) throw new Error('InvalidRole');
      return claims;
    } catch (e) {
      throw Object.assign(new Error(`Invalid JWT: ${e.message}`), { http: 401 });
    }
  }

  async function asRole(claims, fn) {
    const role = claims.role;
    return db.transaction(async (tx) => {
      await tx.exec(`SET LOCAL ROLE ${role}`);
      await tx.query(
        `SELECT set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true), set_config('request.jwt.claim.role', $3, true)`,
        [JSON.stringify(claims), claims.sub || '', role]
      );
      return fn(tx);
    });
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  function send(res, status, body, headers = {}) {
    const isBuf = Buffer.isBuffer(body);
    res.writeHead(status, { 'Content-Type': isBuf ? headers['Content-Type'] || 'application/octet-stream' : 'application/json', ...headers });
    res.end(isBuf ? body : JSON.stringify(body));
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://emulator');
    const p = url.pathname;
    let claims = null;
    try {
      // ---------------- AUTH ----------------
      if (p === '/auth/v1/token' && req.method === 'POST') {
        const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
        const u = users.get(String(body.email || '').toLowerCase());
        if (!u || u.password !== body.password) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
        const access = signJwt({ sub: u.id, role: 'authenticated', email: body.email, exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
        return send(res, 200, { access_token: access, token_type: 'bearer', user: { id: u.id, email: body.email } });
      }

      if (p === '/auth/v1/user' && req.method === 'GET') {
        const userClaims = claimsFromHeaders(req);
        if (!userClaims.sub || userClaims.role !== 'authenticated') {
          return send(res, 401, { error: 'invalid_token', message: 'Invalid user token' });
        }
        return send(res, 200, {
          id: userClaims.sub,
          email: userClaims.email || null,
          role: 'authenticated',
        });
      }

      claims = claimsFromHeaders(req);

      // ---------------- POSTGREST: RPC ----------------
      if (p.startsWith('/rest/v1/rpc/') && req.method === 'POST') {
        const fn = p.slice('/rest/v1/rpc/'.length);
        if (!SAFE_IDENT.test(fn)) return send(res, 404, { code: 'PGRST202', message: 'bad function name' });
        const args = JSON.parse((await readBody(req)).toString('utf8') || '{}');
        const names = Object.keys(args);
        names.forEach((n) => { if (!SAFE_IDENT.test(n)) throw Object.assign(new Error('bad arg name'), { http: 400 }); });
        const values = names.map((n) => {
          const v = args[n];
          if (typeof v === 'string' && (v.startsWith('\\x') || v.startsWith('\\\\x'))) {
            const hex = v.replace(/^\\+x/, '');
            return Buffer.from(hex, 'hex');
          }
          return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
        });
        const call = `public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})`;
        requestLog.push({ type: 'rpc', fn, role: claims.role });
        try {
          const out = await asRole(claims, (tx) => tx.query(`SELECT ${call} AS result`, values));
          return send(res, 200, out.rows[0] ? out.rows[0].result : null);
        } catch (err) {
          const m = mapPgError(err, claims.role);
          return send(res, m.status, m.body);
        }
      }

      // ---------------- POSTGREST: TABEL ----------------
      if (p.startsWith('/rest/v1/') && !p.startsWith('/rest/v1/rpc/')) {
        const table = p.slice('/rest/v1/'.length);
        if (!SAFE_IDENT.test(table)) return send(res, 404, { code: 'PGRST205', message: 'bad table' });
        const eq = [...url.searchParams.entries()].filter(([k, v]) => k !== 'select' && v.startsWith('eq.'));
        const where = eq.map(([k], i) => `"${k.replace(/[^a-z0-9_]/g, '')}"::text = $${i + 1}`).join(' AND ');
        const whereVals = eq.map(([, v]) => v.slice(3));
        requestLog.push({ type: 'table', table, method: req.method, role: claims.role });
        try {
          if (req.method === 'GET') {
            const out = await asRole(claims, (tx) =>
              tx.query(`SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) AS r FROM (SELECT * FROM public."${table}" ${where ? 'WHERE ' + where : ''} LIMIT 1000) t`, whereVals));
            return send(res, 200, out.rows[0].r);
          }
          const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
          const cols = Object.keys(body).filter((c) => SAFE_IDENT.test(c));
          const vals = cols.map((c) => (body[c] !== null && typeof body[c] === 'object' ? JSON.stringify(body[c]) : body[c]));
          if (req.method === 'POST') {
            const sql = `INSERT INTO public."${table}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')})`;
            await asRole(claims, (tx) => tx.query(sql, vals));
            return send(res, 201, {});
          }
          if (req.method === 'PATCH' || req.method === 'DELETE') {
            const off = cols.length;
            const w = eq.map(([k], i) => `"${k.replace(/[^a-z0-9_]/g, '')}"::text = $${off + i + 1}`).join(' AND ');
            const sql = req.method === 'PATCH'
              ? `UPDATE public."${table}" SET ${cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ')} WHERE ${w || 'false'} RETURNING 1`
              : `DELETE FROM public."${table}" WHERE ${w || 'false'} RETURNING 1`;
            const out = await asRole(claims, (tx) => tx.query(sql, [...vals, ...whereVals]));
            return send(res, 200, { affected: out.rows.length });
          }
        } catch (err) {
          const m = mapPgError(err, claims.role);
          return send(res, m.status, m.body);
        }
      }

      // ---------------- STORAGE ----------------
      if (p.startsWith('/storage/v1/')) {
        const sp = p.slice('/storage/v1'.length);

        // Unduh via URL publik: hanya bucket public
        let m = sp.match(/^\/object\/public\/([^/]+)\/(.+)$/);
        if (m && req.method === 'GET') {
          const b = await db.query('SELECT public FROM storage.buckets WHERE id = $1', [m[1]]);
          if (!b.rows[0] || b.rows[0].public !== true) return send(res, 400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
          const obj = objectStore.get(`${m[1]}/${decodeURIComponent(m[2])}`);
          if (!obj) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
          return send(res, 200, obj.bytes, { 'Content-Type': obj.contentType });
        }

        // Unduh via URL bertanda tangan
        m = sp.match(/^\/object\/sign\/([^/]+)\/(.+)$/);
        if (m && req.method === 'GET') {
          try {
            const tc = verifyJwt(url.searchParams.get('token'), secret);
            if (tc.url !== `${m[1]}/${decodeURIComponent(m[2])}`) throw new Error('url mismatch');
          } catch (e) {
            return send(res, 400, { statusCode: '400', error: 'InvalidJWT', message: e.message });
          }
          const obj = objectStore.get(`${m[1]}/${decodeURIComponent(m[2])}`);
          if (!obj) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
          return send(res, 200, obj.bytes, { 'Content-Type': obj.contentType });
        }

        // Buat URL bertanda tangan: pemanggil harus lolos RLS SELECT pada storage.objects
        if (m && req.method === 'POST') {
          const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
          const objName = decodeURIComponent(m[2]);
          const visible = await asRole(claims, (tx) =>
            tx.query('SELECT 1 FROM storage.objects WHERE bucket_id = $1 AND name = $2', [m[1], objName]));
          if (!visible.rows.length) return send(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' });
          const expiresIn = Number(body.expiresIn || 0);
          requestLog.push({ type: 'storage-sign', bucket: m[1], expiresIn, role: claims.role });
          const token = signJwt({ url: `${m[1]}/${objName}`, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresIn }, secret);
          return send(res, 200, { signedURL: `/object/sign/${m[1]}/${m[2]}?token=${token}` });
        }

        // Unggah / hapus / unduh terautentikasi
        m = sp.match(/^\/object\/(?:authenticated\/)?([^/]+)\/(.+)$/);
        if (m) {
          const bucket = m[1];
          const objName = decodeURIComponent(m[2]);
          if (req.method === 'POST') {
            const bytes = await readBody(req);
            const ct = String(req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
            const b = await db.query('SELECT file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = $1', [bucket]);
            if (!b.rows[0]) return send(res, 404, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
            if (b.rows[0].file_size_limit && bytes.length > Number(b.rows[0].file_size_limit)) return send(res, 413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
            if (b.rows[0].allowed_mime_types && !b.rows[0].allowed_mime_types.includes(ct)) return send(res, 415, { statusCode: '415', error: 'invalid_mime_type', message: 'mime type not supported' });
            try {
              await asRole(claims, (tx) =>
                tx.query('INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ($1, $2, $3, $4)',
                  [bucket, objName, claims.sub || null, JSON.stringify({ size: bytes.length, mimetype: ct })]));
            } catch (err) {
              return send(res, err.code === '23505' ? 409 : 403, { statusCode: err.code === '23505' ? '409' : '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
            }
            objectStore.set(`${bucket}/${objName}`, { bytes, contentType: ct });
            requestLog.push({ type: 'storage-put', bucket, name: objName, role: claims.role });
            return send(res, 200, { Key: `${bucket}/${objName}` });
          }
          if (req.method === 'GET') {
            const visible = await asRole(claims, (tx) =>
              tx.query('SELECT 1 FROM storage.objects WHERE bucket_id = $1 AND name = $2', [bucket, objName]));
            const obj = objectStore.get(`${bucket}/${objName}`);
            if (!visible.rows.length || !obj) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
            return send(res, 200, obj.bytes, { 'Content-Type': obj.contentType });
          }
          if (req.method === 'DELETE') {
            const out = await asRole(claims, (tx) => tx.query('DELETE FROM storage.objects WHERE bucket_id = $1 AND name = $2 RETURNING 1', [bucket, objName]));
            if (out.rows.length) objectStore.delete(`${bucket}/${objName}`);
            return send(res, 200, { message: 'Successfully deleted' });
          }
        }
      }

      return send(res, 404, { message: 'not found' });
    } catch (err) {
      return send(res, err.http || 500, { message: String(err.message || err) });
    }
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  return {
    db,
    url: `http://127.0.0.1:${port}`,
    jwtSecret: secret,
    keys,
    objectStore,
    requestLog,
    signJwt: (claims) => signJwt(claims, secret),
    async createUser(email, password = 'pw-test-123') {
      const id = crypto.randomUUID();
      await db.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, email.toLowerCase()]);
      users.set(email.toLowerCase(), { id, password });
      return { id, email: email.toLowerCase(), password };
    },
    userJwt(id, extra = {}) {
      return signJwt({ sub: id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, ...extra }, secret);
    },
    async rest(method, route, { key = keys.anon, bearer, body, headers = {} } = {}) {
      const r = await fetch(`${this.url}${route}`, {
        method,
        headers: { apikey: key, Authorization: `Bearer ${bearer || key}`, 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body),
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* bukan JSON */ }
      return { status: r.status, json, text };
    },
    async close() {
      await new Promise((r) => server.close(r));
      await db.close();
    },
  };
}

