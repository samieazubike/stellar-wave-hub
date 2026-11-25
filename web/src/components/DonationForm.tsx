"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Heart, Wallet } from "lucide-react";
import { payWithFreighter } from "@/lib/payments-client";

const PRESETS = [5, 20, 50, 100] as const;
const destination = process.env.NEXT_PUBLIC_DONATION_DESTINATION;
const network = process.env.NEXT_PUBLIC_CONTRACT_NETWORK === "mainnet" ? "mainnet" : "testnet";
const horizonUrl = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
  (network === "mainnet" ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org");

export function DonationForm() {
  const [amount, setAmount] = useState("20");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ hash: string; amount: string } | null>(null);
  const [error, setError] = useState("");

  const validAmount = /^(?:0|[1-9]\d{0,6})(?:\.\d{1,7})?$/.test(amount) && Number(amount) > 0;

  async function submit() {
    if (!destination || !validAmount || busy) return;
    setBusy(true);
    setError("");
    setReceipt(null);
    let txHash = pendingHash;
    try {
      if (!txHash) {
        txHash = await payWithFreighter({
          amountXlm: Number(amount),
          destination,
          network,
          horizonUrl,
          memo: "donation",
        });
        setPendingHash(txHash);
      }
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: txHash, message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not record the donation.");
      setReceipt({ hash: txHash, amount: data.amount_xlm });
      setPendingHash(null);
      setMessage("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not complete the donation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-solar/30 bg-nebula/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,.25)] sm:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-solar/10 blur-3xl" />
      <div className="relative">
        <div className="mb-7 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-solar/30 bg-solar/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-solar-bright">
            <Heart size={13} aria-hidden="true" /> Support the Hub
          </span>
          <span className="font-mono text-xs text-ash">XLM · {network}</span>
        </div>

        <h2 className="font-display text-2xl font-bold text-starlight">Choose an amount</h2>
        <p className="mt-1 text-sm text-ash">Every contribution helps keep the directory open to the community.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Donation amount presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={busy || Boolean(pendingHash)}
              onClick={() => setAmount(String(preset))}
              aria-pressed={amount === String(preset)}
              className={`rounded-xl border px-3 py-4 text-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solar ${amount === String(preset) ? "border-solar bg-solar/15 text-solar-bright" : "border-dust/50 bg-cosmos/50 text-moonlight hover:border-solar/50 hover:text-starlight"}`}
            >
              {preset}<span className="ml-1 text-xs font-medium">XLM</span>
            </button>
          ))}
        </div>

        <label htmlFor="donation-amount" className="mt-6 block text-sm font-semibold text-moonlight">Or enter your own amount</label>
        <div className="relative mt-2">
          <input
            id="donation-amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            disabled={busy || Boolean(pendingHash)}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={amount.length > 0 && !validAmount}
            className="w-full rounded-xl border border-dust/60 bg-cosmos/70 px-4 py-3 pr-16 text-lg text-starlight outline-none focus:border-solar"
            placeholder="20"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-ash">XLM</span>
        </div>
        {amount.length > 0 && !validAmount && <p className="mt-1 text-xs text-supernova">Enter a positive amount with up to 7 decimal places.</p>}

        <label htmlFor="donation-message" className="mt-6 block text-sm font-semibold text-moonlight">A message for the community <span className="font-normal text-ash">(optional)</span></label>
        <textarea
          id="donation-message"
          maxLength={500}
          rows={3}
          value={message}
          disabled={busy}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-dust/60 bg-cosmos/70 px-4 py-3 text-sm text-starlight outline-none placeholder:text-ash/70 focus:border-solar"
          placeholder="Tell us what you'd love to see next..."
        />
        <p className="mt-1 text-right font-mono text-xs text-ash">{message.length}/500</p>

        {!destination && <p role="alert" className="mt-4 text-sm text-supernova">Donations are not configured yet.</p>}
        {error && <p role="alert" className="mt-4 break-words rounded-lg border border-supernova/30 bg-supernova/10 p-3 text-sm text-supernova">{error}{pendingHash && <span className="mt-1 block font-mono text-xs">Transaction: {pendingHash}</span>}</p>}
        {error && pendingHash && <button type="button" onClick={() => { setPendingHash(null); setError(""); }} className="mt-2 text-sm text-moonlight underline hover:text-starlight">Start a new donation</button>}
        {receipt && <p role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-aurora/30 bg-aurora/10 p-3 text-sm text-aurora-bright"><CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> Thank you! Your {receipt.amount} XLM donation is recorded. <a className="underline" href={`${network === "mainnet" ? "https://stellar.expert/explorer/public/tx/" : "https://stellar.expert/explorer/testnet/tx/"}${receipt.hash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>}

        <button
          type="button"
          disabled={!destination || !validAmount || busy}
          onClick={submit}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-solar px-5 py-4 font-semibold text-void transition-transform hover:-translate-y-0.5 hover:bg-solar-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solar disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {busy ? "Confirming your donation..." : pendingHash ? "Retry recording payment" : <>Donate {validAmount ? amount : ""} XLM <ArrowUpRight size={18} aria-hidden="true" /></>}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ash"><Wallet size={14} aria-hidden="true" /> Freighter will ask you to approve the payment.</p>
      </div>
    </div>
  );
}
