//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/console.sol";

/**
 * A smart contract that allows splitting ETH among multiple recipients in a single transaction
 * @author Splait Team
 */
contract FundSplitter {
    struct Split {
        address payable recipient;
        uint256 amount;
    }

    event FundsSplit(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event Transfer(address indexed recipient, uint256 amount);

    error InsufficientFunds();
    error InvalidRecipient();
    error TransferFailed(address recipient);
    error NoRecipients();
    error TooManyRecipients();

    uint256 public constant MAX_RECIPIENTS = 50;

    /**
     * Split funds among multiple recipients
     * @param splits Array of Split structs containing recipient addresses and amounts
     */
    function splitFunds(Split[] calldata splits) external payable {
        if (splits.length == 0) revert NoRecipients();
        if (splits.length > MAX_RECIPIENTS) revert TooManyRecipients();

        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < splits.length; i++) {
            if (splits[i].recipient == address(0)) revert InvalidRecipient();
            totalAmount += splits[i].amount;
        }

        if (totalAmount != msg.value) revert InsufficientFunds();

        for (uint256 i = 0; i < splits.length; i++) {
            Split calldata split = splits[i];
            
            (bool success, ) = split.recipient.call{value: split.amount}("");
            if (!success) revert TransferFailed(split.recipient);
            
            emit Transfer(split.recipient, split.amount);
        }

        emit FundsSplit(msg.sender, msg.value, splits.length);
    }

    /**
     * Calculate equal split amounts for a given total and number of recipients
     * @param totalAmount The total amount to split
     * @param recipientCount Number of recipients
     * @return amounts Array of amounts for each recipient
     */
    function calculateEqualSplit(uint256 totalAmount, uint256 recipientCount) 
        external 
        pure 
        returns (uint256[] memory amounts) 
    {
        if (recipientCount == 0) revert NoRecipients();
        
        amounts = new uint256[](recipientCount);
        uint256 amountPerRecipient = totalAmount / recipientCount;
        uint256 remainder = totalAmount % recipientCount;
        
        for (uint256 i = 0; i < recipientCount; i++) {
            amounts[i] = amountPerRecipient;
            if (i < remainder) {
                amounts[i] += 1;
            }
        }
        
        return amounts;
    }

    /**
     * Get the contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}