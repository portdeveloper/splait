import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

interface ParsedSplit {
  totalAmount: string;
  recipients: Array<{
    address: string;
    amount: string;
  }>;
  splitType: "equal" | "custom";
  confidence: number;
  error?: string;
}

const SYSTEM_PROMPT = `You are an AI that parses natural language instructions for splitting cryptocurrency funds.

Extract the following information:
1. Total amount to split (in ETH)
2. Ethereum addresses of recipients
3. Individual amounts for each recipient
4. Split type: "equal" for equal splits, "custom" for unequal/weighted splits

Rules:
- Support both equal splits (divide total equally) and custom splits (specific amounts per recipient)
- For equal splits: calculate equal amounts that sum to the total
- For custom splits: use specified amounts, validate they sum to the total
- CRITICAL: Ethereum addresses must be EXACTLY 42 characters (0x + 40 hex characters). Do not truncate addresses!
- Validate that all addresses are valid Ethereum addresses starting with 0x
- Ensure amounts sum to the total amount
- Return confidence score (0-1) based on instruction clarity

Example equal split:
Input: "Split 10 ETH equally among 0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571, 0x8ba1f109551bD432803012645Hac136c2c7F31e"
Output: {"totalAmount": "10", "recipients": [{"address": "0x742c3cf9af45f91b109a81efeaf11535ecde9571", "amount": "5"}, {"address": "0x8ba1f109551bd432803012645hac136c2c7f31e", "amount": "5"}], "splitType": "equal", "confidence": 0.95}

Example custom split:
Input: "Send 3 ETH to 0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571 and 7 ETH to 0x8ba1f109551bD432803012645Hac136c2c7F31e"
Output: {"totalAmount": "10", "recipients": [{"address": "0x742c3cf9af45f91b109a81efeaf11535ecde9571", "amount": "3"}, {"address": "0x8ba1f109551bd432803012645hac136c2c7f31e", "amount": "7"}], "splitType": "custom", "confidence": 0.9}

Return only valid JSON, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Invalid input provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not configured");
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
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
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      return NextResponse.json({ error: `OpenAI API error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("AI Response Content:", content);

    let parsed: ParsedSplit;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("JSON Parse Error:", error);
      console.error("Raw content that failed to parse:", content);
      return NextResponse.json({ error: "Invalid JSON response from AI" }, { status: 500 });
    }

    // Validate and clean the parsed data
    const validatedSplit = validateAndCleanParsedSplit(parsed);

    return NextResponse.json(validatedSplit);
  } catch (error) {
    console.error("API parsing error:", error);
    return NextResponse.json(
      {
        totalAmount: "0",
        recipients: [],
        splitType: "equal" as const,
        confidence: 0,
        error: error instanceof Error ? error.message : "Failed to parse input",
      },
      { status: 500 },
    );
  }
}

function validateAndCleanParsedSplit(parsed: any): ParsedSplit {
  const result: ParsedSplit = {
    totalAmount: "0",
    recipients: [],
    splitType: "equal" as const,
    confidence: 0,
  };

  // Preserve split type from AI response
  if (parsed.splitType === "custom" || parsed.splitType === "equal") {
    result.splitType = parsed.splitType;
  }

  if (typeof parsed.totalAmount === "string" || typeof parsed.totalAmount === "number") {
    result.totalAmount = parsed.totalAmount.toString();
  }

  if (Array.isArray(parsed.recipients)) {
    result.recipients = parsed.recipients
      .filter((recipient: any) => {
        if (!recipient || typeof recipient.address !== "string") return false;
        // Check if address is valid length and format
        const addr = recipient.address;
        if (!addr.startsWith("0x") || addr.length !== 42) return false;
        return isAddress(addr);
      })
      .map((recipient: any) => ({
        address: recipient.address.toLowerCase(),
        amount: recipient.amount?.toString() || "0",
      }));
  }

  if (typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1) {
    result.confidence = parsed.confidence;
  }

  return result;
}
