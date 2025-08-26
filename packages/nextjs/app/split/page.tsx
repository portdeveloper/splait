"use client";

import { useState } from "react";
import { EtherInput } from "~~/components/scaffold-eth";
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

  const handleSaveEdit = () => {
    const updatedSplit = {
      ...parsedSplit,
      totalAmount: editAmount,
      recipients: parsedSplit.recipients.map(recipient => ({
        ...recipient,
        amount: (parseFloat(editAmount) / parsedSplit.recipients.length).toString(),
      })),
    };
    onEdit(updatedSplit);
    setIsEditing(false);
  };

  const totalEth = parseFloat(parsedSplit.totalAmount);
  const gasCostEth = 0.01; // Estimated gas cost

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
          <div className="stat-desc">Equal split</div>
        </div>

        <div className="stat">
          <div className="stat-title">Est. Gas Cost</div>
          <div className="stat-value text-sm">{gasCostEth} ETH</div>
          <div className="stat-desc">${(gasCostEth * 2500).toFixed(2)} USD</div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={onExecute}
          disabled={isExecuting || parsedSplit.recipients.length === 0 || !!parsedSplit.error}
          className="btn btn-primary"
        >
          {isExecuting && <span className="loading loading-spinner"></span>}
          Execute Transaction
        </button>
      </div>
    </div>
  );
}

export default function SplitPage() {
  const [input, setInput] = useState("");
  const [parsedSplit, setParsedSplit] = useState<ParsedSplit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

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
      // TODO: Integrate with smart contract
      console.log("Executing transaction:", parsedSplit);
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Transaction executed successfully! (Simulated)");
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const exampleInputs = [
    "Split 10 ETH equally among these addresses: 0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571, 0x8ba1f109551bD432803012645Hac136c2c7F31e, 0x2F62aC54881bF41c5C3C25b9ab2F8EDe60D95234",
    "Distribute 5 ETH among 0x1234567890123456789012345678901234567890, 0x0987654321098765432109876543210987654321",
    "Send equal amounts of 2.5 ETH to: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045, 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed, 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
  ];

  return (
    <div className="flex items-center flex-col flex-grow pt-8">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Splait</span>
          <span className="block text-2xl mb-2">AI-Powered Fund Splitting</span>
          <span className="block text-lg font-normal">Enter natural language instructions to split ETH</span>
        </h1>

        <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-3xl px-6 lg:px-8 mb-6 space-y-1 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold mb-0">Enter Instructions</h2>
            <div className="text-sm text-base-content/60">{input.length}/500 characters</div>
          </div>

          <textarea
            className="textarea textarea-bordered w-full h-32 text-base"
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

          <div className="alert alert-info">
            <span>MVP: Currently supports equal splits only. Weighted splits coming soon!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
