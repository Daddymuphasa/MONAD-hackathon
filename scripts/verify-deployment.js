import { readFile } from 'node:fs/promises';
import { Contract, JsonRpcProvider, formatEther } from 'ethers';

const address = process.argv[2];
if (!address) throw new Error('Usage: node scripts/verify-deployment.js <contract-address>');

const artifact = JSON.parse(
  await readFile(new URL('../src/monad/papagedon-visual-memory.json', import.meta.url), 'utf8')
);
const provider = new JsonRpcProvider('https://testnet-rpc.monad.xyz', 10143);
const code = await provider.getCode(address);
if (code === '0x') throw new Error(`No contract bytecode found at ${address}`);

const contract = new Contract(address, artifact.abi, provider);
const [name, symbol, owner, mintPrice, totalMinted] = await Promise.all([
  contract.name(),
  contract.symbol(),
  contract.owner(),
  contract.mintPrice(),
  contract.totalMinted()
]);

console.log(JSON.stringify({
  address,
  chainId: 10143,
  name,
  symbol,
  owner,
  mintPriceMON: formatEther(mintPrice),
  totalMinted: totalMinted.toString(),
  bytecodeBytes: (code.length - 2) / 2
}, null, 2));
