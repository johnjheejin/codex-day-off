import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryState, normalizeHTML } from '../scripts/check-deployment.mjs';
import { confirmProduction } from '../scripts/check-pages-production.mjs';

test('delivery challenges remain incomplete and cannot hide other file failures', () => {
  const good = { matches: true, status: 200 };
  const challenge = { matches: false, status: 403, mitigated: 'challenge' };
  assert.equal(deliveryState([good]), 'verified');
  assert.equal(deliveryState([good, challenge]), 'challenged');
  for (const failure of [
    { matches: false, status: 200 }, { matches: false, status: 403 },
    { matches: false, status: 500, mitigated: 'challenge' }, { matches: false, error: 'TimeoutError' }
  ]) assert.equal(deliveryState([challenge, failure]), 'failed');
  assert.equal(deliveryState([]), 'failed');
});

test('HTML comparison preserves unknown scripts and content modifications', () => {
  const html = '<body><h1>Afterglow</h1><script>unexpected()</script></body>';
  assert.equal(normalizeHTML(html), html);
  assert.notEqual(normalizeHTML(html), '<body><h1>Afterglow</h1></body>');
});

const commit = 'a'.repeat(40);
const url = 'https://12345678.codex-day-off.pages.dev';
const project = { name: 'codex-day-off', domains: ['dayoff.tmcowork.com'], production_deployment: {
  id: '12345678-uuid', environment: 'production', latest_stage: { status: 'success' }, url,
  deployment_trigger: { metadata: { commit_hash: commit } }
} };
const domain = { name: 'dayoff.tmcowork.com', status: 'active' };

test('production binding requires the intended domain, deployed URL and exact commit', () => {
  assert.equal(confirmProduction(project, domain, url, commit).deploymentId, '12345678-uuid');
  for (const [p, d, u, c] of [
    [project, { ...domain, status: 'pending' }, url, commit],
    [{ ...project, domains: [] }, domain, url, commit],
    [project, domain, 'https://other.codex-day-off.pages.dev', commit],
    [project, domain, url, 'b'.repeat(40)],
    [{ ...project, production_deployment: { ...project.production_deployment, environment: 'preview' } }, domain, url, commit]
  ]) assert.throws(() => confirmProduction(p, d, u, c));
});
