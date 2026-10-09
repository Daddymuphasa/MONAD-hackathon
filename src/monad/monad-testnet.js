export const MONAD_TESTNET = {
  name: 'Monad Testnet',
  nativeCurrency: 'MON',
  paymentToken: 'Testnet MON',
  chainId: '0x279f'
};

export function buildPackQuote(prompt) {
  const complexity = Math.min(3, Math.max(1, Math.ceil(prompt.trim().length / 120)));
  const price = (0.05 * complexity).toFixed(2);

  return {
    packName: 'Personal Nano Identity Pack',
    price,
    currency: MONAD_TESTNET.paymentToken,
    promptHashPreview: simpleHash(prompt)
  };
}

function simpleHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

