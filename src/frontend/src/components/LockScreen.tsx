import { Eye, EyeOff, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { getBusinessProfile } from "../utils/localStorage";

interface LockScreenProps {
  onUnlock: () => void;
  storedPin: string;
}

export default function LockScreen({ onUnlock, storedPin }: LockScreenProps) {
  const profile = getBusinessProfile();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === storedPin) {
      onUnlock();
    } else {
      setError("Incorrect PIN. Please try again.");
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-6"
      data-ocid="lock.section"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          {profile.logoBase64 ? (
            <img
              src={profile.logoBase64}
              alt={profile.businessName}
              className="w-16 h-16 object-contain rounded-xl mx-auto mb-4 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 bg-[#353935] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Lock className="h-7 w-7 text-white" />
            </div>
          )}
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {profile.businessName || "The Digital Gallery"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Business OS</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4"
          data-ocid="lock.modal"
        >
          <div className="text-center">
            <div className="w-10 h-10 bg-[#436B95]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="h-5 w-5 text-[#436B95]" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Enter PIN to access
            </h2>
          </div>

          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              placeholder="Enter PIN"
              className="w-full h-11 px-4 pr-11 text-center text-xl font-bold tracking-widest border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-[#436B95] focus:border-[#436B95]"
              data-ocid="lock.input"
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500 text-center"
              data-ocid="lock.error_state"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={!pin}
            className="w-full h-11 rounded-xl bg-[#353935] text-white font-semibold text-sm hover:bg-[#252725] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-ocid="lock.submit_button"
          >
            Unlock
          </button>
        </motion.form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          🔒 This app is private. Only the owner can access.
        </p>
      </motion.div>
    </div>
  );
}
