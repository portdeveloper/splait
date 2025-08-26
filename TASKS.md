# Splait Development Tasks

## Phase 1: MVP Development

### ✅ Project Setup
- [x] Update SPECS.md for GPT-5-mini and MVP focus
- [x] Create .env.local and .env.example files
- [x] Add development rules and Git commit guidelines
- [x] Update project homepage for Splait branding

### ✅ Smart Contract Development
- [x] Implement basic FundSplitter.sol contract
- [x] Add comprehensive contract tests (16 test cases)
- [ ] Deploy to local chain and Sepolia

### ✅ AI Integration  
- [x] Create basic AI parser service for equal splits
- [x] Add input validation and error handling
- [ ] Test parsing accuracy with real OpenAI API

### ✅ Frontend Development
- [x] Build input interface for natural language
- [x] Create transaction preview component  
- [ ] Integrate contract interactions with Scaffold-ETH hooks
- [ ] Add basic error handling and loading states

### 🚧 Integration & Testing
- [ ] Test end-to-end MVP flow
- [ ] Deploy smart contract to Sepolia
- [ ] Deploy frontend to Vercel
- [ ] Document usage examples

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