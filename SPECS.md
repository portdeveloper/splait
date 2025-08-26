# AI-Assisted Fund Splitting Tool - Technical Specifications

## Project Overview

**Project Name**: Splait (Split + AI)  
**Description**: An AI-powered tool that parses natural language instructions to split ETH among multiple addresses using smart contracts and batch transactions.

## Core Functionality

### User Flow

1. User visits the web application
2. User enters natural language instruction (e.g., "Split 10 ETH among these 5 addresses: 0x123..., 0x456...")
3. AI (GPT-4-mini) parses the instruction and extracts:
   - Total amount to split
   - Recipient addresses
   - Split logic (equal, weighted, custom amounts)
4. System displays parsed transaction preview
5. User reviews, edits, or approves the transaction plan
6. Smart contract executes batch transfer in single transaction

### Supported Input Patterns

- **Equal splits**: "Split 10 ETH equally among [addresses]"
- **Weighted splits**: "Send 60% to Alice (0x123...), 40% to Bob (0x456...)"
- **Mixed amounts**: "Send 1 ETH to 0x123..., 2 ETH to 0x456..., split remaining 7 ETH equally among [other addresses]"
- **Percentage-based**: "Give 30% to team, 70% to investors [addresses]"

## Technical Architecture

### Smart Contract Layer

#### FundSplitter.sol

```solidity
pragma solidity ^0.8.19;

contract FundSplitter {
    struct Split {
        address recipient;
        uint256 amount;
    }

    event FundsSplit(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event Transfer(address indexed recipient, uint256 amount);

    function splitFunds(Split[] calldata splits) external payable;
    function calculateSplit(uint256 totalAmount, uint256[] calldata weights) external pure returns (uint256[] memory);
}
```

**Features**:

- Batch transfer in single transaction
- Gas-optimized operations
- Event logging for tracking
- Input validation and safety checks
- Revert on failed transfers

### Frontend Architecture

#### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Blockchain**: Wagmi v2 + Viem + RainbowKit
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API (GPT-5-mini)
- **State Management**: React hooks + Zustand (if needed)

#### Key Components

##### 1. Input Interface (`/app/split/page.tsx`)

- Large textarea for natural language input
- Address validation preview
- Example prompts/templates
- Real-time character count

##### 2. AI Parser Service (`/services/aiParser.ts`)

```typescript
interface ParsedSplit {
  totalAmount: string; // in ETH
  recipients: Array<{
    address: string;
    amount?: string;
    percentage?: number;
  }>;
  splitType: "equal" | "weighted" | "custom";
  confidence: number; // AI confidence score
}

function parseUserInput(input: string): Promise<ParsedSplit>;
```

##### 3. Transaction Preview (`/components/TransactionPreview.tsx`)

- Formatted table showing recipient addresses and amounts
- Total amount validation
- Gas estimation
- Edit capabilities for manual adjustments

##### 4. Execution Interface (`/components/ExecuteTransaction.tsx`)

- Connect wallet prompt
- Network validation (Sepolia target)
- Transaction status tracking
- Success/failure handling

### AI Integration Specifications

#### OpenAI API Configuration

- **Model**: GPT-5-mini
- **Temperature**: 0.1 (low for consistency)
- **Max Tokens**: 1000
- **System Prompt**: Structured to extract addresses, amounts, and split logic

#### Example System Prompt

```
You are a transaction parser for an Ethereum fund splitting tool.
Parse user instructions and return JSON with:
- totalAmount (string in ETH)
- recipients (array with address and amount/percentage)
- splitType ('equal', 'weighted', 'custom')
- confidence (0-1 score)

Validate all addresses are proper Ethereum addresses.
If unclear, set confidence < 0.8 and request clarification.
```

#### Error Handling

- **Low confidence (<0.8)**: Request user clarification
- **Invalid addresses**: Highlight and request correction
- **Amount mismatch**: Show calculation error
- **Network errors**: Fallback to manual input mode

### Security & Safety Features

#### Input Validation

- Ethereum address format validation
- Amount bounds checking (min/max limits)
- Duplicate address detection
- Gas limit validation

#### Transaction Safety

- Preview mandatory before execution
- Slippage protection
- Revert on any failed transfer
- Maximum recipient limit (e.g., 50 addresses)

#### AI Safety

- Confidence threshold requirements
- Input sanitization
- Rate limiting on API calls
- Fallback to manual mode

### Configuration & Environment

#### Environment Variables

```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_TARGET_NETWORK=sepolia
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

#### Network Configuration

- **Primary**: Sepolia testnet
- **Contract deployment**: Automated via Foundry scripts
- **RPC**: Alchemy/Infura endpoints
- **Explorer**: Etherscan integration

### Development Phases

#### Phase 1: Core MVP (Current Focus)

**Simplest Working Solution:**
- Basic FundSplitter.sol contract for ETH batch transfers
- Simple AI parsing for equal splits only
- Minimal frontend interface (input + preview + execute)
- Direct contract interaction using Scaffold-ETH hooks
- Deploy to Sepolia testnet

**MVP Success Criteria:**
- Parse "Split X ETH among [addresses]" format
- Execute batch transfers in single transaction
- Basic error handling and validation

#### Phase 2: Enhanced Features

- Weighted splits
- Complex parsing scenarios
- Better error handling
- UI/UX improvements

#### Phase 3: Advanced Features

- Multi-token support (ERC20)
- Scheduled splits
- Template saving
- Analytics dashboard

### Testing Strategy

#### Smart Contract Tests

- Unit tests for all split calculations
- Gas optimization tests
- Security audit checklist
- Fuzz testing for edge cases

#### Frontend Tests

- AI parsing accuracy tests
- Address validation tests
- Transaction flow integration tests
- Error handling scenarios

#### Integration Tests

- End-to-end user flow
- Multi-network testing
- Performance under load
- Real transaction testing on testnet

### Deployment Strategy

#### Smart Contract

- Deploy to Sepolia via Foundry
- Verify on Etherscan
- Document deployment addresses

#### Frontend

- Deploy to Vercel
- Environment-specific builds
- CI/CD pipeline setup

### Success Metrics

- **Accuracy**: >95% correct parsing for standard inputs
- **Safety**: Zero failed transactions due to parsing errors
- **Performance**: <3 second parsing + preview generation
- **Gas Efficiency**: <150k gas per transaction regardless of recipient count
