const { ethers } = require("ethers");

// Test accounts with their private keys
const testAccounts = [
  {
    address: "0xA72505F52928f5255FBb82a031ae2d0980FF6621",
    privateKey: "6f13b56dca0da0901e89742703dd01c6ac0fa51bb516478a3a3ed48638bc5f66"
  },
  {
    address: "0xeD5C89Ae41516A96875B2c15223F9286C79f11fb", 
    privateKey: "864da955f47ffbd822db42732127a5b2b2d0d001eb5bb2e3022c52eb74ff603a"
  },
  {
    address: "0x3300B6cD81b37800dc72fa0925245c867EC281Ad",
    privateKey: "60b125b1f253cb88a5bf95778451fc1e734b09240f41f9fa802c403a62903c9e"
  },
  {
    address: "0xd0c96393E48b11D22A64BeD22b3Aa39621BB77ed",
    privateKey: "39e0650c996e4de20cde278c814701a91802d17ca79e6fddf55dca7b92c59cf9"
  }
];

// Target address to send funds back to
const targetAddress = "0x4ec44e6a10a87F77c5b34b9BF518fAea306d4079";

// RPC URL (default to localhost for local testing, can be overridden)
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";

async function returnFunds() {
  console.log("🔄 Starting fund return process...");
  console.log(`📍 Target address: ${targetAddress}`);
  console.log(`🌐 RPC URL: ${RPC_URL}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  for (const account of testAccounts) {
    try {
      // Create wallet instance
      const wallet = new ethers.Wallet(account.privateKey, provider);
      
      // Get current balance
      const balance = await provider.getBalance(account.address);
      console.log(`💰 ${account.address}: ${ethers.formatEther(balance)} ETH`);
      
      if (balance === 0n) {
        console.log(`   ⏭️  Skipping (no funds)\n`);
        continue;
      }

      // Estimate gas for a simple transfer
      const gasLimit = 21000n; // Standard ETH transfer gas
      const gasPrice = await provider.getFeeData();
      const gasCost = gasLimit * gasPrice.gasPrice;
      
      // Calculate amount to send (balance - gas cost)
      const amountToSend = balance - gasCost;
      
      if (amountToSend <= 0n) {
        console.log(`   ⚠️  Insufficient funds to cover gas (need ${ethers.formatEther(gasCost)} ETH for gas)\n`);
        continue;
      }

      // Create and send transaction
      const tx = {
        to: targetAddress,
        value: amountToSend,
        gasLimit: gasLimit,
        gasPrice: gasPrice.gasPrice,
      };

      console.log(`   📤 Sending ${ethers.formatEther(amountToSend)} ETH...`);
      const transaction = await wallet.sendTransaction(tx);
      
      console.log(`   🧾 Transaction hash: ${transaction.hash}`);
      
      // Wait for confirmation
      const receipt = await transaction.wait();
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber}\n`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${account.address}:`);
      console.error(`      ${error.message}\n`);
    }
  }
  
  console.log("🎉 Fund return process completed!");
  
  // Show final balance of target address
  try {
    const finalBalance = await provider.getBalance(targetAddress);
    console.log(`📊 Final balance of ${targetAddress}: ${ethers.formatEther(finalBalance)} ETH`);
  } catch (error) {
    console.error("Could not fetch final balance:", error.message);
  }
}

// Handle command line execution
if (require.main === module) {
  returnFunds().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
}

module.exports = { returnFunds, testAccounts, targetAddress };