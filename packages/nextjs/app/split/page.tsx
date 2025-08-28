"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { type ParsedSplit, parseUserInput } from "~~/services/aiParser";

interface TransactionPreviewProps {
  parsedSplit: ParsedSplit;
  onEdit: (parsedSplit: ParsedSplit) => void;
  onExecute: () => void;
  isExecuting: boolean;
}

function TransactionPreview({ parsedSplit, onEdit, onExecute, isExecuting }: TransactionPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(parsedSplit.totalAmount);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSaveEdit = () => {
    const updatedSplit = {
      ...parsedSplit,
      totalAmount: editAmount,
      recipients:
        parsedSplit.splitType === "equal"
          ? parsedSplit.recipients.map(recipient => ({
              ...recipient,
              amount: (parseFloat(editAmount) / parsedSplit.recipients.length).toString(),
            }))
          : parsedSplit.recipients, // Keep custom amounts unchanged when editing total
    };
    onEdit(updatedSplit);
    setIsEditing(false);
  };

  const totalEth = parseFloat(parsedSplit.totalAmount);
  const gasCostEth = 0.01; // Estimated gas cost

  const handleConfirmExecute = () => {
    setShowConfirmation(false);
    onExecute();
  };

  return (
    <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-3xl px-6 lg:px-8 mb-6 space-y-1 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold mb-0">Transaction Preview</h3>
        {parsedSplit.confidence < 0.8 && <div className="badge badge-warning">Low Confidence</div>}
      </div>

      {parsedSplit.error && (
        <div className="alert alert-error">
          <span>{parsedSplit.error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Amount (ETH)</th>
              <th>USD (est.)</th>
            </tr>
          </thead>
          <tbody>
            {parsedSplit.recipients.map((recipient, index) => (
              <tr key={index}>
                <td className="font-mono text-sm">{recipient.address}</td>
                <td>{recipient.amount} ETH</td>
                <td>${(parseFloat(recipient.amount) * 2500).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Total Amount</div>
          <div className="stat-value text-primary">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <EtherInput value={editAmount} onChange={setEditAmount} placeholder="Enter amount" />
                <button onClick={handleSaveEdit} className="btn btn-sm btn-success">
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {parsedSplit.totalAmount} ETH
                <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-ghost">
                  Edit
                </button>
              </div>
            )}
          </div>
          <div className="stat-desc">${(totalEth * 2500).toFixed(2)} USD</div>
        </div>

        <div className="stat">
          <div className="stat-title">Recipients</div>
          <div className="stat-value">{parsedSplit.recipients.length}</div>
          <div className="stat-desc">{parsedSplit.splitType === "equal" ? "Equal split" : "Custom amounts"}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Est. Gas Cost</div>
          <div className="stat-value text-sm">{gasCostEth} ETH</div>
          <div className="stat-desc">${(gasCostEth * 2500).toFixed(2)} USD</div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={isExecuting || parsedSplit.recipients.length === 0 || !!parsedSplit.error}
          className="btn btn-primary"
        >
          {isExecuting && <span className="loading loading-spinner"></span>}
          Execute Transaction
        </button>
      </div>

      {showConfirmation && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Transaction</h3>
            <p className="py-4">
              You are about to execute a transaction that will split{" "}
              <span className="font-bold text-primary">{parsedSplit.totalAmount} ETH</span> among{" "}
              <span className="font-bold">{parsedSplit.recipients.length} recipients</span>.
            </p>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-mono">{parsedSplit.totalAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Gas Cost:</span>
                  <span className="font-mono">{gasCostEth} ETH</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total Cost:</span>
                  <span className="font-mono">{(totalEth + gasCostEth).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            <p className="text-warning text-sm mb-4">
              ⚠️ This action cannot be undone. Make sure all recipient addresses are correct.
            </p>

            <div className="modal-action">
              <button onClick={() => setShowConfirmation(false)} className="btn btn-ghost" disabled={isExecuting}>
                Cancel
              </button>
              <button onClick={handleConfirmExecute} className="btn btn-primary" disabled={isExecuting}>
                {isExecuting && <span className="loading loading-spinner"></span>}
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SplitPage() {
  const [input, setInput] = useState("");
  const [parsedSplit, setParsedSplit] = useState<ParsedSplit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const { writeContractAsync: splitFunds } = useScaffoldWriteContract("FundSplitter");

  const handleParse = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const result = await parseUserInput(input);
      setParsedSplit(result);
    } catch (error) {
      console.error("Parsing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!parsedSplit) return;

    setIsExecuting(true);
    try {
      // Convert parsed split data to contract format
      const splits = parsedSplit.recipients.map(recipient => ({
        recipient: recipient.address as `0x${string}`,
        amount: parseEther(recipient.amount),
      }));

      const totalValue = parseEther(parsedSplit.totalAmount);

      console.log("Executing transaction:", { splits, totalValue });

      // Execute the smart contract call
      await splitFunds({
        functionName: "splitFunds",
        args: [splits],
        value: totalValue,
      });

      alert("Transaction executed successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
      alert(`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const exampleInputs = [
    "Split 10 ETH equally among these addresses: 0xA72505F52928f5255FBb82a031ae2d0980FF6621, 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb, 0x3300B6cD81b37800dc72fa0925245c867EC281Ad",
    "Send 3 ETH to 0xA72505F52928f5255FBb82a031ae2d0980FF6621 and 7 ETH to 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb",
    "Distribute 2 ETH to 0x3300B6cD81b37800dc72fa0925245c867EC281Ad, 1.5 ETH to 0xd0c96393E48b11D22A64BeD22b3Aa39621BB77ed, and 0.5 ETH to 0xA72505F52928f5255FBb82a031ae2d0980FF6621",
  ];

  return (
    <div className="flex items-center flex-col flex-grow pt-8">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Splait</span>
          <span className="block text-2xl mb-2">AI-Powered Fund Splitting</span>
          <span className="block text-lg font-normal">Enter natural language instructions to split ETH</span>
        </h1>

        <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary px-6 lg:px-8 mb-6 space-y-1 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold mb-0">Enter Instructions</h2>
            <div className="text-sm text-base-content/60">{input.length}/500 characters</div>
          </div>

          <textarea
            className="textarea textarea-bordered w-full h-32 text-base rounded-none"
            placeholder="Example: Split 10 ETH equally among these addresses: 0x123..., 0x456..., 0x789..."
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 500))}
          />

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-semibold">Quick examples:</span>
            {exampleInputs.map((example, index) => (
              <button key={index} onClick={() => setInput(example)} className="btn btn-outline btn-xs">
                Example {index + 1}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={handleParse} disabled={!input.trim() || isLoading} className="btn btn-primary">
              {isLoading && <span className="loading loading-spinner"></span>}
              Parse Instructions
            </button>
          </div>
        </div>

        {parsedSplit && (
          <TransactionPreview
            parsedSplit={parsedSplit}
            onEdit={setParsedSplit}
            onExecute={handleExecute}
            isExecuting={isExecuting}
          />
        )}

        <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-3xl px-6 lg:px-8 mb-6 space-y-1 py-4">
          <h3 className="text-lg font-bold">How it works</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter natural language instructions for splitting ETH</li>
            <li>AI parses your instructions and extracts recipients and amounts</li>
            <li>Review and edit the transaction preview</li>
            <li>Execute the batch transfer in a single transaction</li>
          </ol>

          <div className="alert alert-success">
            <span>✅ Supports both equal splits and custom amounts!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
