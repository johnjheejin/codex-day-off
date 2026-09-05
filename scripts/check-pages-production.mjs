import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectName = 'codex-day-off';
const domainName = 'dayoff.tmcowork.com';

export function confirmProduction(project, domain, deploymentURL, commit) {
  const deployment = project.production_deployment;
  if (project.name !== projectName || !project.domains?.includes(domainName) ||
      domain.name !== domainName || domain.status !== 'active') {
    throw new Error('The public domain is not active on the expected Pages project.');
  }
  if (deployment?.environment !== 'production' ||
      deployment.latest_stage?.status !== 'success' ||
      deployment.url !== new URL(deploymentURL).origin ||
      deployment.deployment_trigger?.metadata?.commit_hash !== commit) {
    throw new Error('The active production deployment does not match this verified commit and URL.');
  }
  return { project: projectName, domain: domainName, domainStatus: domain.status,
    deploymentId: deployment.id, deploymentURL: deployment.url, commit };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [deploymentURL, commit] = process.argv.slice(2);
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token || !deploymentURL || !commit) throw new Error('Pass deployment URL, commit and Cloudflare credentials.');
  const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/${projectName}`;
  const read = async suffix => {
    const response = await fetch(base + suffix, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(`Pages API verification failed (HTTP ${response.status}).`);
    return data.result;
  };
  const [project, domain] = await Promise.all([read(''), read(`/domains/${domainName}`)]);
  const receipt = confirmProduction(project, domain, deploymentURL, commit);
  await mkdir('release-results', { recursive: true });
  await writeFile('release-results/production-binding.json', JSON.stringify({ checkedAt: new Date().toISOString(), ...receipt }, null, 2) + '\n');
  console.log(`Confirmed active ${receipt.domain} on production deployment ${receipt.deploymentId} (${receipt.commit}).`);
}
