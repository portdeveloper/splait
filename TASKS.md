# Splait Development Tasks

## Phase 1: MVP Development

### ✅ Project Setup
- [x] Update SPECS.md for GPT-5-mini and MVP focus
- [x] Create .env.local and .env.example files
- [x] Add development rules and Git commit guidelines
- [x] Update project homepage for Splait branding

### ✅ Smart Contract Development
- [x] Implement basic FundSplitter.sol contract
- [x] Deploy to local chain using `yarn deploy` (automatic Anvil detection)
- [ ] Deploy to Sepolia testnet

### ✅ AI Integration  
- [x] Create basic AI parser service for equal splits
- [x] Add input validation and error handling

### ✅ Frontend Development
- [x] Build input interface for natural language
- [x] Create transaction preview component  
- [ ] Integrate contract interactions with Scaffold-ETH hooks
- [ ] Add basic error handling and loading states

### ✅ Integration
- [x] End-to-end MVP flow with local deployment
- [x] Integrate contract with frontend using Scaffold-ETH hooks
- [ ] Deploy smart contract to Sepolia
- [ ] Deploy frontend to Vercel
- [ ] Document usage examples

## Development Workflow
1. `yarn chain` - Start local Anvil blockchain
2. `yarn deploy` - Deploy contracts (automatically detects local chain)
3. `yarn start` - Start frontend development server
4. Visit http://localhost:3000/split to test the application

## Next Steps (Phase 2)
- [ ] Add weighted splits support
- [ ] Improve error handling
- [ ] Add UI/UX enhancements
- [ ] Multi-token support (ERC20)

---

## Development Rules

### Git Commit Guidelines
- Do not include AI assistant co-author attribution in commits
- Keep commit messages focused on the actual changes made
- Use conventional commit format when possible
- Commit atomically - each commit should represent a single logical change
- Commit every change - don't leave uncommitted work

---

**Current Focus**: Contract deployment and frontend integration
**Target**: Complete working MVP with contract deployment