# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Scaffold-ETH 2 (SE-2) dApp built with NextJS, RainbowKit, Foundry, Wagmi, Viem, and TypeScript. It's a yarn monorepo containing smart contract and frontend development tools for building on Ethereum.

## Project Structure

- **packages/foundry**: Foundry-based smart contract development, testing, and deployment
- **packages/nextjs**: Next.js frontend with web3 utilities and components (using App Router)

## Development Commands

### Core Development Flow
```bash
yarn chain          # Start local blockchain (Foundry/Anvil)
yarn deploy         # Deploy contracts to local chain (automatically detects Anvil)
yarn start          # Start Next.js frontend dev server
```

**Note**: `yarn deploy` automatically deploys contracts to the local Anvil node when it's running. No need for manual contract deployment commands.

### Smart Contract Development
```bash
yarn foundry:compile    # Compile contracts
yarn foundry:test       # Run smart contract tests
yarn foundry:format     # Format Solidity files
yarn foundry:lint       # Lint Solidity files
```

### Frontend Development
```bash
yarn next:check-types   # TypeScript type checking
yarn next:format        # Format frontend code
yarn next:lint          # Lint frontend code
yarn next:build         # Build production frontend
```

### Testing & Quality
```bash
yarn test              # Run all tests (foundry tests)
yarn lint              # Lint all packages
yarn format            # Format all packages
```

### Deployment
```bash
yarn foundry:deploy    # Deploy contracts
yarn vercel            # Deploy to Vercel
yarn ipfs              # Build and deploy to IPFS
```

## Smart Contract Interactions

Use these specific hooks for contract interactions:

### Reading Contract Data
```typescript
const { data } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "functionName",
  args: [arg1, arg2], // optional
});
```

### Writing to Contracts
```typescript
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract"
});

await writeContractAsync({
  functionName: "functionName",
  args: [arg1, arg2], // optional
  value: parseEther("0.1"), // for payable functions
});
```

### Reading Contract Events
```typescript
const { data: events } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "EventName",
  watch: true, // optional
});
```

## Key Components

Always use these Scaffold-ETH components for consistency:
- `Address`: Display Ethereum addresses
- `AddressInput`: Input field for Ethereum addresses
- `Balance`: Display ETH/USD balances
- `EtherInput`: Number input with ETH/USD conversion

Components are located in `packages/nextjs/components/scaffold-eth/`.

## Configuration

- Smart contracts: `packages/foundry/contracts/`
- Deploy scripts: `packages/foundry/script/`
- Frontend config: `packages/nextjs/scaffold.config.ts`
- Contract ABIs: `packages/nextjs/contracts/deployedContracts.ts`

## Development Notes

- Frontend runs on http://localhost:3000
- Debug contracts UI available at http://localhost:3000/debug
- Local chain configuration in `packages/foundry/foundry.toml`
- Use yarn, not npm (yarn workspaces configured)
- Node.js >= 20.18.3 required