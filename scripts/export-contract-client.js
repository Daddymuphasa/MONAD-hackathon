import { mkdir, readFile, writeFile } from 'node:fs/promises';

const artifactPath = new URL(
  '../artifacts/contracts/PapageddonVisualMemory.sol/PapagedonVisualMemory.json',
  import.meta.url
);
const outputPath = new URL('../src/monad/papagedon-visual-memory.json', import.meta.url);
const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));

await mkdir(new URL('../src/monad/', import.meta.url), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2)}\n`
);

console.log('Client contract artifact exported');
