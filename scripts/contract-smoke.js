import assert from 'node:assert/strict';
import { network } from 'hardhat';

const { ethers } = await network.create();
const mintPrice = ethers.parseEther('0.02');
const contract = await ethers.deployContract('PapagedonVisualMemory', [mintPrice]);
await contract.waitForDeployment();

const recipe = JSON.stringify({
  schema: 'papagedon.visual.v1',
  palette: ['#0b1717', '#dfc27c'],
  motion: 'nano-ripple',
  music: { bass: 'lift', mids: 'shimmer', treble: 'edge-light' }
});
const taste = JSON.stringify({ genres: ['afrobeats'], intensity: 0.78, eventTheme: 'future-luxe' });
const contentHash = ethers.keccak256(ethers.toUtf8Bytes(`${recipe}:${taste}`));

await (await contract.mintMemory(
  'ipfs://papagedon-test/1',
  recipe,
  taste,
  contentHash,
  1,
  { value: mintPrice }
)).wait();

assert.equal(await contract.ownerOf(1), (await ethers.getSigners())[0].address);
assert.equal(await contract.tokenURI(1), 'ipfs://papagedon-test/1');
assert.equal(await contract.totalMinted(), 1n);
assert.equal((await contract.getMemory(1)).visualCode, recipe);

const updatedTaste = JSON.stringify({ genres: ['afrobeats', 'amapiano'], intensity: 0.9 });
const updatedHash = ethers.keccak256(ethers.toUtf8Bytes(`${recipe}:${updatedTaste}`));
await (await contract.updateMemory(
  1,
  'ipfs://papagedon-test/1-v2',
  recipe,
  updatedTaste,
  updatedHash,
  1
)).wait();

assert.equal((await contract.getMemory(1)).tasteProfile, updatedTaste);
console.log('PapagedonVisualMemory smoke test passed');
