import { isAddress } from "viem";

export interface ParsedSplit {
  totalAmount: string;
  recipients: Array<{
    address: string;
    amount: string;
  }>;
  splitType: "equal" | "custom";
  confidence: number;
  error?: string;
}

export async function parseUserInput(input: string): Promise<ParsedSplit> {
  try {
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("AI parsing error:", error);
    return {
      totalAmount: "0",
      recipients: [],
      splitType: "equal",
      confidence: 0,
      error: error instanceof Error ? error.message : "Failed to parse input",
    };
  }
}

export function calculateEqualSplit(totalAmount: string, recipientAddresses: string[]): ParsedSplit {
  if (recipientAddresses.length === 0) {
    return {
      totalAmount: "0",
      recipients: [],
      splitType: "equal",
      confidence: 0,
      error: "No recipients provided",
    };
  }

  const invalidAddresses = recipientAddresses.filter(addr => !isAddress(addr));
  if (invalidAddresses.length > 0) {
    return {
      totalAmount: "0",
      recipients: [],
      splitType: "equal",
      confidence: 0,
      error: `Invalid addresses: ${invalidAddresses.join(", ")}`,
    };
  }

  const total = parseFloat(totalAmount);
  if (isNaN(total) || total <= 0) {
    return {
      totalAmount: "0",
      recipients: [],
      splitType: "equal",
      confidence: 0,
      error: "Invalid total amount",
    };
  }

  const amountPerRecipient = total / recipientAddresses.length;
  const recipients = recipientAddresses.map(address => ({
    address: address.toLowerCase(),
    amount: amountPerRecipient.toString(),
  }));

  return {
    totalAmount: totalAmount,
    recipients,
    splitType: "equal",
    confidence: 1,
  };
}
