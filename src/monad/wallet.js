import { BrowserProvider, Contract, ContractFactory, JsonRpcProvider, formatEther, keccak256, parseEther, toUtf8Bytes } from 'ethers';
import contractArtifact from './papagedon-visual-memory.json' with { type: 'json' };
import { MONAD_TESTNET as NETWORK } from './monad-testnet.js';

const MONAD_TESTNET_CHAIN_ID = '0x279f';
const MONAD_TESTNET = {
  chainId: MONAD_TESTNET_CHAIN_ID,
  chainName: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: [NETWORK.rpcUrl],
  blockExplorerUrls: [NETWORK.explorerUrl]
};

export function createAlchemyProvider() {
  return new JsonRpcProvider(NETWORK.rpcUrl, 10143, { staticNetwork: true });
}

async function ensureMonadTestnet(ethereum) {
  const currentChain = await ethereum.request({ method: 'eth_chainId' });
  if (currentChain === MONAD_TESTNET_CHAIN_ID) return;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET_CHAIN_ID }]
    });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [MONAD_TESTNET]
    });
  }
}

export async function connectMonadWallet() {
  const ethereum = window.ethereum;
  if (!ethereum) throw new Error('No browser wallet detected. Install or open an EVM wallet first.');

  await ethereum.request({ method: 'eth_requestAccounts' });
  await ensureMonadTestnet(ethereum);
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  return { provider, signer, address, balance: formatEther(balance) };
}

export async function createDynamicWalletSession(primaryWallet) {
  await primaryWallet.switchNetwork(10143);
  const walletClient = await primaryWallet.getWalletClient();
  const eip1193Provider = {
    request: ({ method, params }) => walletClient.request({ method, params })
  };
  const provider = new BrowserProvider(eip1193Provider);
  const signer = await provider.getSigner(primaryWallet.address);
  const readProvider = createAlchemyProvider();
  const balance = await readProvider.getBalance(primaryWallet.address);

  return {
    provider: readProvider,
    signer,
    address: primaryWallet.address,
    balance: formatEther(balance),
    authentication: 'dynamic'
  };
}

export async function deployVisualMemoryContract(signer) {
  const simulatedMintPrice = parseEther('0.2');
  const factory = new ContractFactory(contractArtifact.abi, contractArtifact.bytecode, signer);
  const contract = await factory.deploy(simulatedMintPrice);
  const deployment = contract.deploymentTransaction();
  await contract.waitForDeployment();

  return {
    address: await contract.getAddress(),
    transactionHash: deployment.hash,
    mintPrice: simulatedMintPrice
  };
}

export function createVisualMemoryPayload({ pack, sensitivity, autoMode, styleBrief }) {
  const visualCode = JSON.stringify({
    schema: 'papagedon.visual.v1',
    rendererVersion: 1,
    pack: {
      id: pack.id,
      name: pack.name,
      wave: pack.wave,
      shaderMode: pack.shaderMode,
      sceneMode: pack.sceneMode ?? null,
      lift: pack.lift,
      tilt: pack.tilt,
      compression: pack.compression,
      warp: pack.warp,
      reflection: pack.reflection,
      socket: pack.socket,
      glowColor: pack.glowColor ?? null
    },
    audioMapping: {
      bass: 'surface-lift-and-impact',
      mids: 'material-motion',
      treble: 'edge-light-and-detail',
      sensitivity
    },
    playbackMode: autoMode ? 'adaptive-auto' : 'manual'
  });
  const tasteProfile = JSON.stringify({
    schema: 'papagedon.taste.v1',
    styleBrief: styleBrief.trim(),
    preferredPack: pack.id,
    preferredSensitivity: sensitivity,
    preferredMode: autoMode ? 'auto' : 'manual'
  });
  const contentHash = keccak256(toUtf8Bytes(`${visualCode}\u0000${tasteProfile}`));
  const metadata = {
    name: `Papagedon Visual Memory: ${pack.name}`,
    description: 'A user-owned visual recipe and taste memory interpreted by Papagedon AEI.',
    external_url: 'https://www.papagedon.com/monad',
    attributes: [
      { trait_type: 'Renderer schema', value: 'papagedon.visual.v1' },
      { trait_type: 'Visual pack', value: pack.name },
      { trait_type: 'Wave system', value: pack.wave },
      { trait_type: 'Mode', value: autoMode ? 'Adaptive Auto' : 'Manual' },
      { trait_type: 'Renderer version', value: 1 }
    ]
  };
  const metadataUri = `data:application/json;base64,${bytesToBase64(toUtf8Bytes(JSON.stringify(metadata)))}`;

  return { metadataUri, visualCode, tasteProfile, contentHash, rendererVersion: 1 };
}

export async function mintVisualMemory(signer, contractAddress, payload) {
  const contract = new Contract(contractAddress, contractArtifact.abi, signer);
  const mintPrice = await contract.mintPrice();
  const transaction = await contract.mintMemory(
    payload.metadataUri,
    payload.visualCode,
    payload.tasteProfile,
    payload.contentHash,
    payload.rendererVersion,
    { value: mintPrice }
  );
  const receipt = await transaction.wait();
  let tokenId = null;

  for (const log of receipt.logs) {
    try {
      const event = contract.interface.parseLog(log);
      if (event?.name === 'MemoryMinted') tokenId = event.args.tokenId;
    } catch {
      // Ignore logs emitted by other contracts in the transaction.
    }
  }

  if (tokenId === null) throw new Error('Mint succeeded but the token ID was not found.');
  return { tokenId, transactionHash: transaction.hash, mintPrice: formatEther(mintPrice) };
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
