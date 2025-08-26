//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/Test.sol";
import "../contracts/FundSplitter.sol";

contract FundSplitterTest is Test {
    FundSplitter public fundSplitter;
    
    address payable recipient1 = payable(address(0x1));
    address payable recipient2 = payable(address(0x2));
    address payable recipient3 = payable(address(0x3));
    
    event FundsSplit(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event Transfer(address indexed recipient, uint256 amount);

    function setUp() public {
        fundSplitter = new FundSplitter();
        
        // Give test addresses some initial balance for visibility
        vm.deal(recipient1, 0);
        vm.deal(recipient2, 0);
        vm.deal(recipient3, 0);
    }

    function testSplitFundsBasic() public {
        // Create splits array
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](2);
        splits[0] = FundSplitter.Split(recipient1, 1 ether);
        splits[1] = FundSplitter.Split(recipient2, 2 ether);
        
        // Record initial balances
        uint256 initialBalance1 = recipient1.balance;
        uint256 initialBalance2 = recipient2.balance;
        
        // Expect events to be emitted
        vm.expectEmit(true, false, false, true);
        emit Transfer(recipient1, 1 ether);
        vm.expectEmit(true, false, false, true);
        emit Transfer(recipient2, 2 ether);
        vm.expectEmit(true, false, false, true);
        emit FundsSplit(address(this), 3 ether, 2);
        
        // Execute split
        fundSplitter.splitFunds{value: 3 ether}(splits);
        
        // Verify balances
        assertEq(recipient1.balance, initialBalance1 + 1 ether);
        assertEq(recipient2.balance, initialBalance2 + 2 ether);
        assertEq(address(fundSplitter).balance, 0);
    }

    function testSplitFundsEqual() public {
        // Test equal splitting of 3 ether among 3 recipients
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](3);
        splits[0] = FundSplitter.Split(recipient1, 1 ether);
        splits[1] = FundSplitter.Split(recipient2, 1 ether);
        splits[2] = FundSplitter.Split(recipient3, 1 ether);
        
        fundSplitter.splitFunds{value: 3 ether}(splits);
        
        assertEq(recipient1.balance, 1 ether);
        assertEq(recipient2.balance, 1 ether);
        assertEq(recipient3.balance, 1 ether);
    }

    function testCalculateEqualSplit() public view {
        // Test perfect division
        uint256[] memory amounts = fundSplitter.calculateEqualSplit(9 ether, 3);
        assertEq(amounts.length, 3);
        assertEq(amounts[0], 3 ether);
        assertEq(amounts[1], 3 ether);
        assertEq(amounts[2], 3 ether);
        
        // Test with remainder - 10 ether / 3 = 3.333... ether each
        amounts = fundSplitter.calculateEqualSplit(10 ether, 3);
        assertEq(amounts.length, 3);
        // 10 ether = 10000000000000000000 wei
        // 10000000000000000000 / 3 = 3333333333333333333 wei (base)
        // remainder = 10000000000000000000 % 3 = 1 wei
        // So first recipient gets 3333333333333333333 + 1 = 3333333333333333334 wei
        assertEq(amounts[0], 3333333333333333334); // Gets remainder
        assertEq(amounts[1], 3333333333333333333); // Base amount  
        assertEq(amounts[2], 3333333333333333333); // Base amount
        
        // Verify total is preserved
        uint256 total = amounts[0] + amounts[1] + amounts[2];
        assertEq(total, 10 ether);
    }

    function testCalculateEqualSplitLargeRemainder() public view {
        // Test with 7 wei among 3 recipients
        uint256[] memory amounts = fundSplitter.calculateEqualSplit(7, 3);
        assertEq(amounts.length, 3);
        assertEq(amounts[0], 3); // Gets remainder (2 + 1)
        assertEq(amounts[1], 2); // Base amount
        assertEq(amounts[2], 2); // Base amount
        
        uint256 total = amounts[0] + amounts[1] + amounts[2];
        assertEq(total, 7);
    }

    function testRevertInsufficientFunds() public {
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](1);
        splits[0] = FundSplitter.Split(recipient1, 2 ether);
        
        vm.expectRevert(FundSplitter.InsufficientFunds.selector);
        fundSplitter.splitFunds{value: 1 ether}(splits); // Send less than required
    }

    function testRevertExcessFunds() public {
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](1);
        splits[0] = FundSplitter.Split(recipient1, 1 ether);
        
        vm.expectRevert(FundSplitter.InsufficientFunds.selector);
        fundSplitter.splitFunds{value: 2 ether}(splits); // Send more than required
    }

    function testRevertNoRecipients() public {
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](0);
        
        vm.expectRevert(FundSplitter.NoRecipients.selector);
        fundSplitter.splitFunds{value: 1 ether}(splits);
    }

    function testRevertInvalidRecipient() public {
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](1);
        splits[0] = FundSplitter.Split(payable(address(0)), 1 ether);
        
        vm.expectRevert(FundSplitter.InvalidRecipient.selector);
        fundSplitter.splitFunds{value: 1 ether}(splits);
    }

    function testRevertTooManyRecipients() public {
        // Create array with more than MAX_RECIPIENTS
        uint256 tooMany = fundSplitter.MAX_RECIPIENTS() + 1;
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](tooMany);
        
        for (uint256 i = 0; i < tooMany; i++) {
            splits[i] = FundSplitter.Split(payable(address(uint160(i + 1))), 1 wei);
        }
        
        vm.expectRevert(FundSplitter.TooManyRecipients.selector);
        fundSplitter.splitFunds{value: tooMany * 1 wei}(splits);
    }

    function testRevertCalculateEqualSplitZeroRecipients() public {
        vm.expectRevert(FundSplitter.NoRecipients.selector);
        fundSplitter.calculateEqualSplit(1 ether, 0);
    }

    function testMaxRecipients() public {
        // Test with exactly MAX_RECIPIENTS
        uint256 maxRecipients = fundSplitter.MAX_RECIPIENTS();
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](maxRecipients);
        
        // Create test addresses and ensure they can receive ETH
        for (uint256 i = 0; i < maxRecipients; i++) {
            address testAddr = makeAddr(string(abi.encodePacked("recipient", i)));
            splits[i] = FundSplitter.Split(payable(testAddr), 1 wei);
        }
        
        // This should succeed
        fundSplitter.splitFunds{value: maxRecipients * 1 wei}(splits);
    }

    function testGetBalance() public {
        assertEq(fundSplitter.getBalance(), 0);
        
        // Contract shouldn't hold funds after splitting
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](1);
        splits[0] = FundSplitter.Split(recipient1, 1 ether);
        
        fundSplitter.splitFunds{value: 1 ether}(splits);
        assertEq(fundSplitter.getBalance(), 0);
    }

    function testSingleRecipient() public {
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](1);
        splits[0] = FundSplitter.Split(recipient1, 5 ether);
        
        uint256 initialBalance = recipient1.balance;
        
        fundSplitter.splitFunds{value: 5 ether}(splits);
        
        assertEq(recipient1.balance, initialBalance + 5 ether);
    }

    function testZeroAmountSplit() public {
        FundSplitter.Split[] memory splits = new FundSplitter.Split[](2);
        splits[0] = FundSplitter.Split(recipient1, 0);
        splits[1] = FundSplitter.Split(recipient2, 0);
        
        fundSplitter.splitFunds{value: 0}(splits);
        
        // Balances should remain unchanged
        assertEq(recipient1.balance, 0);
        assertEq(recipient2.balance, 0);
    }

    // Test fuzzing for calculate equal split
    function testFuzzCalculateEqualSplit(uint256 totalAmount, uint8 recipientCount) public view {
        vm.assume(recipientCount > 0);
        vm.assume(recipientCount <= 100); // Reasonable limit for fuzz testing
        vm.assume(totalAmount < type(uint256).max / 100); // Prevent overflow
        
        uint256[] memory amounts = fundSplitter.calculateEqualSplit(totalAmount, recipientCount);
        
        // Verify array length
        assertEq(amounts.length, recipientCount);
        
        // Verify total is preserved
        uint256 calculatedTotal = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            calculatedTotal += amounts[i];
        }
        assertEq(calculatedTotal, totalAmount);
        
        // Verify fair distribution (difference between max and min should be at most 1)
        if (recipientCount > 1) {
            uint256 min = amounts[0];
            uint256 max = amounts[0];
            for (uint256 i = 1; i < amounts.length; i++) {
                if (amounts[i] < min) min = amounts[i];
                if (amounts[i] > max) max = amounts[i];
            }
            assertLe(max - min, 1);
        }
    }
}