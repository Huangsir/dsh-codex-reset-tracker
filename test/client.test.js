import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/status-pending.json', import.meta.url)));
const now = Date.parse('2026-10-22T10:11:53.095Z');

function client() {
  const window = new EventTarget();
  const document = new EventTarget();
  document.visibilityState = 'visible';
  const intervals = new Map();
  const timeouts = new Map();
  let clock = now;
  let api;
  let moduleId;
  let requests = [];
  let response = fixture;
  window.__ModuleLoader__ = { load(module) {
    moduleId = module.id;
    api = module.factory(() => ({ createElement: (tag, props, ...children) => ({ tag, props, children }) }));
  } };
  class Clock extends Date { static now() { return clock; } }
  const context = vm.createContext({
    window, document, URL, Intl, Date: Clock, AbortController,
    setInterval(fn, ms) { intervals.set(fn, ms); return fn; },
    clearInterval(id) { intervals.delete(id); },
    setTimeout(fn, ms) { timeouts.set(fn, ms); return fn; },
    clearTimeout(id) { timeouts.delete(id); },
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      if (typeof response === 'function') return response(url, options);
      return { ok: true, headers: new Headers(), json: async () => response };
    },
  });
  const instrumented = source.replace('return { name, inject, apply };', `return { name, inject, apply,
    ResetSummary, resetHappenedToday, reportedVerdict: typeof reportedVerdict === "function" ? reportedVerdict : undefined, latestResetRecord, resetCompletionTime,
    ensureStatus, retainStatusPolling, statusStore, en, zh };`);
  vm.runInContext(instrumented, context);
  return {
    api, moduleId, window, document, intervals, timeouts, requests,
    advance(ms) { clock += ms; },
    respond(value) { response = value; },
  };
}
const t = (key) => key;
const textOf = (node) => node == null ? '' : typeof node === 'object'
  ? (node.children || []).map(textOf).join(' ') : String(node);
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('installation identity includes tracker in manifest, lockfile, loader and patch', () => {
  const name = 'dsh-codex-reset-tracker';
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
  assert.equal(pkg.name, name);
  assert.equal(lock.name, name);
  assert.equal(lock.packages[''].name, name);
  assert.equal(client().moduleId, name);
  assert.match(readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8'), /name: 'dsh-codex-reset-tracker'/);
});

test('captured Day 17 headline reports the source page probability and Yes', () => {
  const { api } = client();
  assert.equal(api.resetHappenedToday(fixture.data, now), false);
  const rendered = textOf(api.ResetSummary({ data: fixture.data, t, localeId: 'zh-CN', now }));
  assert.match(rendered, /upcomingQuestion/);
  assert.match(rendered, /≥86%/);
  assert.match(rendered, /todayYes/);
  assert.doesNotMatch(rendered, /todayUnconfirmed/);
  assert.equal(api.reportedVerdict(fixture.data, now).percent, 86);
  assert.equal(api.latestResetRecord(fixture.data).id, fixture.data.latestGlobal.id);
});

test('confirmed completion today switches to yes; an elapsed schedule never does', () => {
  const { api } = client();
  const data = structuredClone(fixture.data);
  data.latestGlobal.completedAt = '2026-10-22T09:00:00Z';
  assert.equal(api.resetHappenedToday(data, now), true);
  assert.match(textOf(api.ResetSummary({ data, t, localeId: 'en', now })), /todayYes/);
  data.latestGlobal = null;
  data.latestBanked = null;
  data.nextScheduled.scheduleState = 'elapsed';
  assert.equal(api.resetHappenedToday(data, now), false);
});

test('completion is checked against browser local day, with invalid time fallback', () => {
  const { api } = client();
  const data = structuredClone(fixture.data);
  data.latestGlobal.completedAt = 'invalid';
  data.latestGlobal.effectiveAt = '2026-10-21T18:00:00Z';
  data.timeZone = 'America/Los_Angeles';
  assert.equal(api.resetHappenedToday(data, now), true);
  assert.equal(api.resetCompletionTime(data.latestGlobal).field, 'effectiveAt');
});

test('stale status refreshes when tab becomes visible or network returns; listeners clean up', async () => {
  const c = client();
  const release = c.api.retainStatusPolling('en');
  await flush();
  assert.equal(c.requests.length, 1);
  c.advance(61_000);
  c.document.visibilityState = 'hidden';
  c.document.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(c.requests.length, 1);
  c.document.visibilityState = 'visible';
  c.document.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(c.requests.length, 2);
  c.advance(61_000);
  c.window.dispatchEvent(new Event('online'));
  await flush();
  assert.equal(c.requests.length, 3);
  release();
  c.advance(61_000);
  c.window.dispatchEvent(new Event('online'));
  await flush();
  assert.equal(c.requests.length, 3);
  assert.equal(c.intervals.size, 0);
});

test('interactive freshness check fetches a new completion and coalesces repeated requests', async () => {
  const c = client();
  await c.api.ensureStatus('en', false);
  c.advance(61_000);
  const data = structuredClone(fixture);
  data.data.latestGlobal.completedAt = '2026-10-22T10:00:00Z';
  c.respond(data);
  await Promise.all([c.api.ensureStatus('en', false), c.api.ensureStatus('en', false)]);
  assert.equal(c.requests.length, 2);
  assert.equal(c.api.resetHappenedToday(c.api.statusStore.getSnapshot().entry.data, now), true);
  assert.equal(new URL(c.requests[0].url).searchParams.get('timeZone'), 'Asia/Shanghai');
  assert.equal(c.requests[0].options.cache, 'no-store');
});

test('429 cooldown prevents event/manual refresh from bypassing Retry-After', async () => {
  const c = client();
  c.respond(() => ({ ok: false, status: 429, headers: new Headers({ 'Retry-After': '120' }),
    json: async () => ({ ok: false, error: 'rate_limited', retryAfter: 120 }) }));
  await c.api.ensureStatus('en', true);
  await c.api.ensureStatus('en', true);
  assert.equal(c.requests.length, 1);
  assert.equal(c.api.statusStore.getSnapshot().phase, 'error');
  c.advance(120_001);
  c.respond(fixture);
  await c.api.ensureStatus('en', false);
  assert.equal(c.requests.length, 2);
  assert.equal(c.api.statusStore.getSnapshot().phase, 'ready');
});

test('hung fetch times out and can be retried instead of staying in loading forever', async () => {
  const c = client();
  c.respond((_url, { signal }) => new Promise((_resolve, reject) =>
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))));
  const pending = c.api.ensureStatus('en', true);
  assert.equal(c.timeouts.size, 1);
  for (const fn of [...c.timeouts.keys()]) fn();
  await pending;
  assert.equal(c.api.statusStore.getSnapshot().phase, 'error');
  c.respond(fixture);
  await c.api.ensureStatus('en', true);
  assert.equal(c.api.statusStore.getSnapshot().phase, 'ready');
  assert.equal(c.timeouts.size, 0);
});

// Source-page headline rules observed at https://didcodexreset.com/zh/:
// live schedules display rounded confidence + Yes; 100% has no ≥ prefix.
test('reported probability has no invented threshold and preserves exact 100%', () => {
  const { api } = client();
  const data = structuredClone(fixture.data);
  for (const [confidence, expected] of [[0.8, '≥80%'], [0.65, '≥65%'], [1, '100%']]) {
    data.nextScheduled.confidence = confidence;
    const rendered = textOf(api.ResetSummary({ data, t, localeId: 'en', now }));
    assert.ok(rendered.includes(expected));
    assert.match(rendered, /todayYes/);
  }
});

test('missing confidence is not fabricated and no schedule uses the source daily answer', () => {
  const { api } = client();
  const data = structuredClone(fixture.data);
  data.nextScheduled.confidence = null;
  let rendered = textOf(api.ResetSummary({ data, t, localeId: 'en', now }));
  assert.doesNotMatch(rendered, /%/);
  assert.match(rendered, /upcomingQuestion/);
  data.nextScheduled = null;
  rendered = textOf(api.ResetSummary({ data, t, localeId: 'en', now }));
  assert.match(rendered, /todayQuestion/);
  assert.match(rendered, /todayNo/);
  assert.doesNotMatch(rendered, /todayYes|%/);
});

test('completed today takes priority over a pending forecast without changing record kind', () => {
  const { api } = client();
  const data = structuredClone(fixture.data);
  data.latestGlobal.completedAt = '2026-10-22T09:00:00Z';
  const rendered = textOf(api.ResetSummary({ data, t, localeId: 'en', now }));
  assert.match(rendered, /todayQuestion/);
  assert.match(rendered, /todayYes/);
  assert.doesNotMatch(rendered, /%|upcomingQuestion/);
  assert.equal(data.nextScheduled.kind, 'reset_scheduled');
});

test('a multi-day explicit schedule covering now reports Yes without inventing confidence', () => {
  const { api } = client();
  const data = structuredClone(fixture.data);
  data.nextScheduled.confidence = null;
  data.nextScheduled.scheduleWindow = {
    startAt: '2026-10-20T18:00:00Z', endAt: '2026-10-23T18:00:00Z',
  };
  const rendered = textOf(api.ResetSummary({ data, t, localeId: 'en', now }));
  assert.match(rendered, /todayYes/);
  assert.doesNotMatch(rendered, /%/);
});
