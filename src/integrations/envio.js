const ENVIO_GRAPHQL_URL = import.meta.env?.VITE_ENVIO_GRAPHQL_URL;

const LATEST_MEMORY_QUERY = `
  query LatestVisualMemory($owner: String!) {
    VisualMemory(
      where: { owner: { _eq: $owner } }
      order_by: { updatedAt: desc }
      limit: 1
    ) {
      id
      owner
      contentHash
      rendererVersion
      mintedAt
      updatedAt
    }
  }
`;

export async function loadLatestVisualMemory(address, endpoint = ENVIO_GRAPHQL_URL) {
  if (!endpoint) {
    return { configured: false, memory: null };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: LATEST_MEMORY_QUERY,
      variables: { owner: address.toLowerCase() }
    })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(payload.errors?.[0]?.message || 'Envio memory lookup failed.');
  }

  return { configured: true, memory: payload.data?.VisualMemory?.[0] || null };
}
