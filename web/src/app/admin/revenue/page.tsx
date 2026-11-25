"use client";

import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";
import { RevenueTab } from "@/components/admin/RevenueTab";
import Link from "next/link";

export default function AdminRevenuePage() {
  const { user, token, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="skeleton h-12 w-64 mb-8 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !hasMinRole(user.role, "admin")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-supernova/10 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--supernova)"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="font-semibold text-xl text-starlight mb-2">403 Forbidden</h2>
          <p className="text-ash mb-6">
            You do not have administrative permissions to view the revenue dashboard.
          </p>
          <Link href="/" className="btn-nova inline-flex text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Back Link */}
      <div className="mb-6 animate-in">
        <Link
          href="/admin"
          className="text-xs font-medium text-ash hover:text-starlight transition-colors inline-flex items-center gap-1 mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Admin Dashboard
        </Link>
      </div>

      <RevenueTab token={token} />
    </div>
  );
}
