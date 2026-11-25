"use client";

import { useState } from "react";

export type VerifiedProject = {
  owner_verified_at: string | null;
  owner_verified_address: string | null;
};

export default function VerifyOwnership({ projectId, account, token, verified, disabled, onVerified }: {
  projectId: number;
  account: string;
  token: string;
  verified: boolean;
  disabled: boolean;
  onVerified: (project: VerifiedProject) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    if (busy || disabled) return;
    setBusy(true);
    setError("");
    try {
      const { isConnected, requestAccess, signTransaction } = await import("@stellar/freighter-api");
      const connection = await isConnected();
      if (connection.error || !connection.isConnected) {
        throw new Error("Install the Freighter browser extension to verify ownership.");
      }
      const access = await requestAccess();
      if (access.error) throw new Error(access.error.message || "Wallet access denied.");
      if (access.address !== account) {
        throw new Error("Switch Freighter to the project's Stellar account and try again.");
      }
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const challengeResponse = await fetch(`/api/projects/${projectId}/verify-owner/challenge`, {
        method: "POST", headers,
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error || "Could not request an ownership challenge.");
      if (challenge.stellarAccountId !== account) throw new Error("Project account changed. Reload before verifying.");
      const signed = await signTransaction(challenge.challengeXdr, {
        networkPassphrase: challenge.networkPassphrase,
        address: account,
      });
      if (signed.error || !signed.signedTxXdr) {
        throw new Error(signed.error?.message || "Signing cancelled. Please try again.");
      }
      const response = await fetch(`/api/projects/${projectId}/verify-owner`, {
        method: "POST", headers,
        body: JSON.stringify({ publicKey: account, signedXdr: signed.signedTxXdr }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Ownership verification failed.");
      onVerified({
        owner_verified_at: result.project.owner_verified_at,
        owner_verified_address: result.project.owner_verified_address,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ownership verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-dust/20 p-4 space-y-3">
      <p className="text-sm text-starlight" role="status">
        {verified ? "Ownership verified" : "Prove ownership of your saved Stellar account with Freighter."}
      </p>
      <p className="text-xs text-ash">This signs a challenge only. No transaction is submitted and no funds are transferred.</p>
      {disabled && <p className="text-sm text-ash">Save your Stellar account changes before verifying ownership.</p>}
      <button type="button" onClick={verify} disabled={busy || disabled || !account || verified}
        className="btn-nova !py-2 !px-4 disabled:opacity-50">
        {busy ? "Verifying..." : verified ? "Ownership verified" : "Verify ownership"}
      </button>
      {error && <p role="alert" className="text-sm text-supernova">{error}</p>}
    </div>
  );
}
