import { isAddress } from "viem";

export interface ParsedSplit {
  totalAmount: string;
  recipients: Array<{
    address: string;
    amount: string;
  }>;
  splitType: "equal";
  confidence: number;
  error?: string;
}

const SYSTEM_PROMPT = `You are a transaction parser for an Ethereum fund splitting tool.
Parse user instructions and return JSON with:
- totalAmount (string in ETH, e.g. "10" for 10 ETH)
- recipients (array with address and amount in ETH)
- splitType (always "equal" for MVP)
- confidence (0-1 score based on parsing certainty)

For MVP, only handle equal splits like "Split X ETH among these addresses: [addresses]"

Validate all addresses are proper Ethereum addresses (0x followed by 40 hex chars).
If unclear or invalid, set confidence < 0.8 and include error message.

Return only valid JSON, no additional text.`;

export async function parseUserInput(input: string): Promise<ParsedSplit> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let parsed: ParsedSplit;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON response from AI");
    }

    parsed = validateAndCleanParsedSplit(parsed);

    return parsed;
  } catch (error) {
    console.error("AI parsing error:", error);
    return {
      totalAmount: "0",
      recipients: [],
      splitType: "equal",
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

function validateAndCleanParsedSplit(parsed: any): ParsedSplit {
  const result: ParsedSplit = {
    totalAmount: "0",
    recipients: [],
    splitType: "equal",
    confidence: 0,
  };

  if (typeof parsed.totalAmount === "string" || typeof parsed.totalAmount === "number") {
    result.totalAmount = parsed.totalAmount.toString();
  }

  if (Array.isArray(parsed.recipients)) {
    result.recipients = parsed.recipients
      .filter((recipient: any) => recipient && typeof recipient.address === "string" && isAddress(recipient.address))
      .map((recipient: any) => ({
        address: recipient.address.toLowerCase(),
        amount: recipient.amount?.toString() || "0",
      }));
  }

  if (typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1) {
    result.confidence = parsed.confidence;
  }

  if (typeof parsed.error === "string") {
    result.error = parsed.error;
  }

  if (result.recipients.length === 0 && !result.error) {
    result.error = "No valid recipients found";
    result.confidence = 0;
  }

  return result;
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
