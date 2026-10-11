import assert from 'node:assert/strict';
import test from 'node:test';
import { buildVisualDNA } from '../api/integrations/nansen-profile.js';
import { loadLatestVisualMemory } from '../src/integrations/envio.js';
import { loadNansenVisualDNA } from '../src/integrations/nansen.js';

test('Nansen labels become renderer-safe Visual DNA', () => {
  const dna = buildVisualDNA([
    { label: 'NFT Collector', category: 'behavioral' },
    { label: 'Active on Monad', category: 'chain' }
  ]);

  assert.equal(dna.schema, 'papagedon.nansen-visual-dna.v1');
  assert.equal(dna.preferredPack, 'prism-shards');
  assert.match(dna.styleBrief, /NFT Collector/);
});

test('Envio latest memory drives returning-wallet restoration', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ data: { VisualMemory: [{ id: '7', owner: '0xabc', updatedAt: 9 }] } })
  }));

  const result = await loadLatestVisualMemory('0xAbC', 'https://indexer.example/graphql');
  assert.equal(result.configured, true);
  assert.equal(result.memory.id, '7');
});

test('Nansen profile response feeds the personalization client', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ labels: [{ label: 'NFT Collector' }], visualDNA: { preferredPack: 'prism-shards' } })
  }));

  const result = await loadNansenVisualDNA('0x0000000000000000000000000000000000000001', '/profile');
  assert.equal(result.visualDNA.preferredPack, 'prism-shards');
});
