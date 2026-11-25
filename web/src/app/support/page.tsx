import type { Metadata } from "next";
import { ArrowRight, HeartHandshake, Orbit, Sparkles } from "lucide-react";
import { DonationForm } from "@/components/DonationForm";

export const metadata: Metadata = {
  title: "Support the Hub",
  description: "Support Stellar Wave Hub with a verified XLM donation.",
};

export default function SupportPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-solar/5 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] lg:gap-20">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[.25em] text-solar-bright">
              <span className="h-2 w-2 rounded-full bg-solar shadow-[0_0_16px_var(--solar)]" /> Community powered
            </p>
            <h1 className="max-w-2xl font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-starlight sm:text-6xl lg:text-7xl">
              Help the next wave <span className="text-solar-bright">find its way.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-moonlight">
              Stellar Wave Hub makes it easier to discover, rate, and follow the builders moving Stellar forward. Your XLM donation helps us keep that work going.
            </p>
            <div className="mt-10 grid max-w-xl gap-5 border-t border-dust/40 pt-8 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plasma/10 text-plasma-bright"><Orbit size={20} aria-hidden="true" /></span>
                <div><h2 className="font-semibold text-starlight">More discovery</h2><p className="mt-1 text-sm leading-relaxed text-ash">Keep promising projects visible to the whole ecosystem.</p></div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aurora/10 text-aurora-bright"><Sparkles size={20} aria-hidden="true" /></span>
                <div><h2 className="font-semibold text-starlight">A stronger commons</h2><p className="mt-1 text-sm leading-relaxed text-ash">Support a shared place for community ratings and research.</p></div>
              </div>
            </div>
            <p className="mt-10 flex items-center gap-2 text-sm text-ash"><HeartHandshake size={18} className="text-solar-bright" aria-hidden="true" /> Give any amount that feels right to you <ArrowRight size={15} aria-hidden="true" /></p>
          </div>
          <DonationForm />
        </div>
      </div>
    </div>
  );
}
