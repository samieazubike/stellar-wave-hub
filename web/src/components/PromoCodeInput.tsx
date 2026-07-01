import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface PromoCodeInputProps {
  basePrice: number;
  onApply: (code: string | null, finalPrice: number) => void;
}

export function PromoCodeInput({ basePrice, onApply }: PromoCodeInputProps) {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentOff: number } | null>(null);
  const [error, setError] = useState("");

  const finalPrice = appliedPromo 
    ? basePrice - (basePrice * (appliedPromo.percentOff / 100))
    : basePrice;

  useEffect(() => {
    onApply(appliedPromo ? appliedPromo.code : null, finalPrice);
  }, [appliedPromo, finalPrice, onApply]);

  const validateCode = async () => {
    if (!code.trim()) return;
    setIsValidating(true);
    setError("");

    try {
      const res = await fetch(`/api/featured/activate?promo_code=${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid promo code");
      }

      setAppliedPromo({
        code: code.trim().toUpperCase(),
        percentOff: data.percent_off || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply code");
      setAppliedPromo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeCode = () => {
    setCode("");
    setAppliedPromo(null);
    setError("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-moonlight">Promo Code (Optional)</label>
      
      {!appliedPromo ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="input-field flex-1 font-mono text-sm uppercase"
            disabled={isValidating}
          />
          <button
            type="button"
            onClick={validateCode}
            disabled={!code.trim() || isValidating}
            className="btn-ghost text-sm px-4"
          >
            {isValidating ? "Checking..." : "Apply"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-solar/10 border border-solar/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-solar-bright">{appliedPromo.code}</span>
            <span className="tag tag-solar text-xs">{appliedPromo.percentOff}% OFF</span>
          </div>
          <button 
            type="button"
            onClick={removeCode}
            className="text-xs text-ash hover:text-supernova transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-supernova text-xs mt-1">{error}</p>}

      <div className="flex justify-between items-center text-sm pt-4 border-t border-dust/20 mt-4">
        <span className="text-ash font-medium">Total Price:</span>
        <div className="text-right flex items-center gap-2">
          {appliedPromo && (
            <span className="line-through text-ash/60">{basePrice} XLM</span>
          )}
          <span className="font-bold text-plasma-bright text-lg">{finalPrice} XLM</span>
        </div>
      </div>
    </div>
  );
}