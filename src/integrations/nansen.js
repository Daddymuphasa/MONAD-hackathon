const PROFILE_ENDPOINT = import.meta.env?.VITE_NANSEN_PROFILE_URL || '/api/integrations/nansen-profile';

export async function loadNansenVisualDNA(address, endpoint = PROFILE_ENDPOINT) {
  const response = await fetch(`${endpoint}?address=${encodeURIComponent(address)}`, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Nansen profile request failed (${response.status}).`);
  }

  return response.json();
}
