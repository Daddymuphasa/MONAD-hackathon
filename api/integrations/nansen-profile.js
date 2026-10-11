const NANSEN_LABELS_URL = 'https://api.nansen.ai/api/v1/profiler/address/labels';
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function buildVisualDNA(labels) {
  const words = labels.map(({ label, category }) => `${category || ''} ${label || ''}`.toLowerCase());
  const combined = words.join(' ');
  const preferredPack = combined.includes('nft') || combined.includes('collector')
    ? 'prism-shards'
    : combined.includes('defi') || combined.includes('trader')
      ? 'circuit-matrix'
      : combined.includes('smart money')
        ? 'gilded-reactor'
        : 'nano-hex';
  const intensity = Math.min(1, 0.35 + labels.length * 0.06);
  const labelSummary = labels.slice(0, 5).map((item) => item.label).filter(Boolean).join(', ');

  return {
    schema: 'papagedon.nansen-visual-dna.v1',
    preferredPack,
    intensity,
    source: 'Nansen address labels on Monad',
    styleBrief: labelSummary
      ? `Create a refined ${preferredPack.replaceAll('-', ' ')} identity shaped by these onchain signals: ${labelSummary}. Keep the result abstract and do not expose financial balances.`
      : 'Create a restrained nano-hex identity for a new onchain profile with subtle emerald energy and black chrome surfaces.'
  };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('allow', 'GET');
    return response.status(405).json({ message: 'Method not allowed.' });
  }

  const address = String(request.query.address || '');
  if (!ADDRESS_PATTERN.test(address)) {
    return response.status(400).json({ message: 'A valid EVM wallet address is required.' });
  }
  if (!process.env.NANSEN_API_KEY) {
    return response.status(503).json({ message: 'Nansen is not configured on this deployment.' });
  }

  const nansenResponse = await fetch(NANSEN_LABELS_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      apiKey: process.env.NANSEN_API_KEY
    },
    body: JSON.stringify({
      address,
      chain: 'monad',
      pagination: { page: 1, per_page: 100 }
    })
  });
  const payload = await nansenResponse.json().catch(() => ({}));
  if (!nansenResponse.ok) {
    return response.status(nansenResponse.status).json({
      message: payload.message || 'Nansen rejected the profile request.'
    });
  }

  const labels = Array.isArray(payload.data) ? payload.data : [];
  response.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=600');
  return response.status(200).json({ address, labels, visualDNA: buildVisualDNA(labels) });
}
