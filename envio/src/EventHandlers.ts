import { indexer } from "envio";

indexer.onEvent({ contract: "PapagedonVisualMemory", event: "MemoryMinted" }, async ({ event, context }) => {
  const tokenId = event.params.tokenId.toString();
  const owner = event.params.owner.toLowerCase();
  const timestamp = Number(event.block.timestamp);
  const existingProfile = await context.WalletMemoryProfile.get(owner);

  context.VisualMemory.set({
    id: tokenId,
    owner,
    contentHash: event.params.contentHash,
    rendererVersion: Number(event.params.rendererVersion),
    mintedAt: timestamp,
    updatedAt: timestamp,
    updateCount: 0
  });
  context.WalletMemoryProfile.set({
    id: owner,
    memoryCount: (existingProfile?.memoryCount ?? 0) + 1,
    latestMemoryId: tokenId,
    lastActivityAt: timestamp
  });
});

indexer.onEvent({ contract: "PapagedonVisualMemory", event: "MemoryUpdated" }, async ({ event, context }) => {
  const tokenId = event.params.tokenId.toString();
  const memory = await context.VisualMemory.get(tokenId);
  if (!memory) return;
  const timestamp = Number(event.block.timestamp);

  context.VisualMemory.set({
    ...memory,
    contentHash: event.params.contentHash,
    rendererVersion: Number(event.params.rendererVersion),
    updatedAt: timestamp,
    updateCount: memory.updateCount + 1
  });
  context.WalletMemoryProfile.set({
    id: memory.owner,
    memoryCount: (await context.WalletMemoryProfile.get(memory.owner))?.memoryCount ?? 1,
    latestMemoryId: tokenId,
    lastActivityAt: timestamp
  });
});

indexer.onEvent({ contract: "PapagedonVisualMemory", event: "Transfer" }, async ({ event, context }) => {
  if (event.params.from.toLowerCase() === "0x0000000000000000000000000000000000000000") return;
  const tokenId = event.params.tokenId.toString();
  const memory = await context.VisualMemory.get(tokenId);
  if (!memory) return;
  const owner = event.params.to.toLowerCase();
  const timestamp = Number(event.block.timestamp);

  context.VisualMemory.set({ ...memory, owner, updatedAt: timestamp });
  const profile = await context.WalletMemoryProfile.get(owner);
  context.WalletMemoryProfile.set({
    id: owner,
    memoryCount: (profile?.memoryCount ?? 0) + 1,
    latestMemoryId: tokenId,
    lastActivityAt: timestamp
  });
});
