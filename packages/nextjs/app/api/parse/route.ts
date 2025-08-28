import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

interface ParsedSplit {
  totalAmount: string;
  recipients: Array<{
    address: string;
    amount: string;
  }>;
  splitType: "equal";
  confidence: number;
  error?: string;
}

const SYSTEM_PROMPT = `You are a JSON API that parses ETH split instructions. Output only valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    console.log("API Request - Input:", input);

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
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract the total ETH amount and all Ethereum addresses from this text. Calculate equal splits per address.
            
Text: ${input}

Output this exact JSON structure:
{
  "totalAmount": "[total ETH amount as string]",
  "recipients": [
    {"address": "[ethereum address lowercase]", "amount": "[amount per recipient]"}
  ],
  "splitType": "equal",
  "confidence": 1.0
}`,
          },
        ],
        max_completion_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      return NextResponse.json({ error: `OpenAI API error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log("OpenAI Response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenAI response structure:", data);
      return NextResponse.json({ error: "Invalid OpenAI response structure" }, { status: 500 });
    }

    const content = data.choices[0].message.content;
    console.log("Parsed Content:", content);

    if (!content) {
      console.error("Empty content from OpenAI, using fallback parser");
      const fallbackResult = fallbackParser(input);
      console.log("Fallback result:", fallbackResult);
      return NextResponse.json(fallbackResult);
    }

    let parsed: ParsedSplit;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error, using fallback parser. Error:", parseError, "Content:", content);
      const fallbackResult = fallbackParser(input);
      console.log("Fallback result:", fallbackResult);
      return NextResponse.json(fallbackResult);
    }

    // Validate and clean the parsed data
    const validatedSplit = validateAndCleanParsedSplit(parsed);
    console.log("Validated Split:", validatedSplit);

    return NextResponse.json(validatedSplit);
  } catch (error) {
    console.error("API parsing error:", error);
    return NextResponse.json(
      {
        totalAmount: "0",
        recipients: [],
        splitType: "equal",
        confidence: 0,
        error: error instanceof Error ? error.message : "Failed to parse input",
      },
      { status: 500 },
    );
  }
}

function fallbackParser(input: string): ParsedSplit {
  console.log("Using fallback parser for input:", input);

  // Extract amount using various patterns
  const amountMatch = input.match(/(\d+(?:\.\d+)?)\s*ETH/i);
  const totalAmount = amountMatch ? amountMatch[1] : "0";

  // Extract all Ethereum addresses
  const addressPattern = /0x[a-fA-F0-9]{40}/gi;
  const addresses = input.match(addressPattern) || [];

  // Remove duplicates and ensure all addresses are valid
  const uniqueAddresses = [...new Set(addresses)];

  if (uniqueAddresses.length === 0 || totalAmount === "0") {
    return {
      totalAmount: "0",
      recipients: [],
      splitType: "equal",
      confidence: 0,
      error: "Could not parse input",
    };
  }

  console.log(`Found ${uniqueAddresses.length} unique addresses`);

  // Calculate equal split with more precision
  const amountPerRecipient = (parseFloat(totalAmount) / uniqueAddresses.length).toFixed(6);

  const recipients = uniqueAddresses.map(address => ({
    address: address.toLowerCase(),
    amount: amountPerRecipient,
  }));

  return {
    totalAmount,
    recipients,
    splitType: "equal",
    confidence: 0.8, // Lower confidence for fallback parser
  };
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
      .map((recipient: any) => {
        // Limit decimal precision to 6 places
        let amount = recipient.amount?.toString() || "0";
        const amountNum = parseFloat(amount);
        if (!isNaN(amountNum)) {
          amount = amountNum.toFixed(6);
        }
        return {
          address: recipient.address.toLowerCase(),
          amount: amount,
        };
      });
  }

  if (typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1) {
    result.confidence = parsed.confidence;
  }

  return result;
}
