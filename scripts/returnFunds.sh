#!/bin/bash

# Fund return script for test accounts
# Sends all available ETH back to the main address

TARGET_ADDRESS="0x4ec44e6a10a87F77c5b34b9BF518fAea306d4079"
RPC_URL=${RPC_URL:-"http://localhost:8545"}

# Test accounts and their private keys
declare -a ACCOUNTS=(
    "0xA72505F52928f5255FBb82a031ae2d0980FF6621:6f13b56dca0da0901e89742703dd01c6ac0fa51bb516478a3a3ed48638bc5f66"
    "0xeD5C89Ae41516A96875B2c15223F9286C79f11fb:864da955f47ffbd822db42732127a5b2b2d0d001eb5bb2e3022c52eb74ff603a"
    "0x3300B6cD81b37800dc72fa0925245c867EC281Ad:60b125b1f253cb88a5bf95778451fc1e734b09240f41f9fa802c403a62903c9e"
    "0xd0c96393E48b11D22A64BeD22b3Aa39621BB77ed:39e0650c996e4de20cde278c814701a91802d17ca79e6fddf55dca7b92c59cf9"
)

echo "🔄 Starting fund return process..."
echo "📍 Target address: $TARGET_ADDRESS"
echo "🌐 RPC URL: $RPC_URL"
echo

for account in "${ACCOUNTS[@]}"; do
    IFS=':' read -r address private_key <<< "$account"
    
    echo "💰 Processing: $address"
    
    # Get balance
    balance=$(cast balance "$address" --rpc-url "$RPC_URL")
    balance_eth=$(cast --to-unit "$balance" ether)
    
    echo "   Balance: $balance_eth ETH"
    
    # Check if balance is greater than 0
    if [ "$balance" = "0" ]; then
        echo "   ⏭️  Skipping (no funds)"
        echo
        continue
    fi
    
    # Estimate gas cost (21000 gas * gas price)
    gas_price=$(cast gas-price --rpc-url "$RPC_URL")
    gas_cost=$((21000 * gas_price))
    
    # Calculate amount to send (balance - gas cost)
    amount_to_send=$((balance - gas_cost))
    
    if [ "$amount_to_send" -le 0 ]; then
        echo "   ⚠️  Insufficient funds to cover gas"
        echo
        continue
    fi
    
    amount_to_send_eth=$(cast --to-unit "$amount_to_send" ether)
    echo "   📤 Sending: $amount_to_send_eth ETH"
    
    # Send transaction
    tx_hash=$(cast send "$TARGET_ADDRESS" \
        --value "$amount_to_send" \
        --private-key "$private_key" \
        --rpc-url "$RPC_URL" \
        --json | jq -r '.transactionHash')
    
    if [ "$tx_hash" != "null" ] && [ -n "$tx_hash" ]; then
        echo "   🧾 Transaction hash: $tx_hash"
        echo "   ✅ Transaction sent"
    else
        echo "   ❌ Transaction failed"
    fi
    
    echo
done

echo "🎉 Fund return process completed!"

# Show final balance
echo "📊 Final balance check:"
final_balance=$(cast balance "$TARGET_ADDRESS" --rpc-url "$RPC_URL")
final_balance_eth=$(cast --to-unit "$final_balance" ether)
echo "   $TARGET_ADDRESS: $final_balance_eth ETH"