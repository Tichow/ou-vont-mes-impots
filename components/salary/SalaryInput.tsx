"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Users, User, Baby, Info } from "lucide-react";
import { formatEuros } from "@/lib/formatting";

type FamilyStatus = "single" | "couple";

const MIN_SALARY = 0;
const MAX_SALARY = 500_000;
const DEFAULT_SALARY = 35_000;
const STEP = 500;

const CHILDREN_OPTIONS = [0, 1, 2, 3] as const;

/** Parse a raw string into a salary number, stripping all non-digit chars. */
function parseSalary(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, "");
  return cleaned === "" ? 0 : Number(cleaned);
}

/** Format a number for display in the input (no € symbol, just spaces). */
function formatDisplay(n: number): string {
  if (n === 0) return "";
  return n.toLocaleString("fr-FR");
}

type SalaryFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  large?: boolean;
  hint?: string;
};

function SalaryField({ label, value, onChange, placeholder, large, hint }: SalaryFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawValue, setRawValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    setRawValue(value > 0 ? value.toString() : "");
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseSalary(rawValue);
    const clamped = Math.min(MAX_SALARY, Math.max(MIN_SALARY, parsed));
    onChange(clamped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only digits and spaces while typing
    if (/^[\d\s]*$/.test(raw)) {
      setRawValue(raw);
      const parsed = parseSalary(raw);
      if (parsed <= MAX_SALARY) {
        onChange(parsed);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const sliderPercentage = ((value - MIN_SALARY) / (MAX_SALARY - MIN_SALARY)) * 100;

  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-2">
        {label}
      </label>

      {/* Text input */}
      <div className="relative mb-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={isFocused ? rawValue : formatDisplay(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Ex : 35 000"}
          className={`w-full ${large ? "text-4xl py-4" : "text-2xl py-3"} text-center font-bold text-text bg-surface-alt rounded-xl px-6 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-text-muted/30 placeholder:font-normal ${large ? "placeholder:text-2xl" : "placeholder:text-lg"}`}
        />
        {/* € suffix when there's a value */}
        {value > 0 && !isFocused && (
          <span className={`absolute right-5 top-1/2 -translate-y-1/2 ${large ? "text-2xl" : "text-lg"} font-bold text-text-muted/40 pointer-events-none`}>
            €
          </span>
        )}
      </div>

      {/* Slider */}
      <div className="relative mt-3">
        <input
          type="range"
          min={MIN_SALARY}
          max={MAX_SALARY}
          step={STEP}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${sliderPercentage}%, var(--color-border) ${sliderPercentage}%, var(--color-border) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>0 €</span>
          <span>{formatEuros(MAX_SALARY)}</span>
        </div>
      </div>

      {hint && (
        <p className="text-xs text-text-muted mt-1">{hint}</p>
      )}
    </div>
  );
}

export function SalaryInput() {
  const router = useRouter();
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus>("single");
  const [children, setChildren] = useState(0);
  const [partnerSalary, setPartnerSalary] = useState(0);

  const handleFamilyStatusChange = useCallback((status: FamilyStatus) => {
    setFamilyStatus(status);
    if (status === "single") {
      setPartnerSalary(0);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const params = new URLSearchParams({
      salary: salary.toString(),
      status: familyStatus,
      children: children.toString(),
    });
    if (familyStatus === "couple" && partnerSalary > 0) {
      params.set("partnerSalary", partnerSalary.toString());
    }
    router.push(`/resultats?${params.toString()}`);
  }, [salary, familyStatus, children, partnerSalary, router]);

  const showParentIsole = familyStatus === "single" && children >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative rounded-3xl bg-white p-8 md:p-10 shadow-lg border border-border overflow-hidden">

        {/* Salary input */}
        <div className="mb-8">
          <SalaryField
            label="Salaire brut annuel"
            value={salary}
            onChange={setSalary}
            placeholder="Ex : 35 000"
            large
          />
        </div>

        {/* Family status */}
        <label className="block text-sm font-medium text-text-muted mb-3">
          Situation familiale
        </label>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleFamilyStatusChange("single")}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl border-2 transition-all ${
              familyStatus === "single"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-text-muted hover:border-primary/30"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <User size={18} />
              Seul(e)
            </span>
            <span className="text-xs text-text-muted font-normal">
              Célibataire, divorcé(e) ou veuf/ve
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleFamilyStatusChange("couple")}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl border-2 transition-all ${
              familyStatus === "couple"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-text-muted hover:border-primary/30"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Users size={18} />
              Marié(e) / Pacsé(e)
            </span>
            <span className="text-xs text-text-muted font-normal">
              Déclaration commune
            </span>
          </button>
        </div>

        {/* Partner salary (conditional) */}
        <AnimatePresence>
          {familyStatus === "couple" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden mb-6"
            >
              <SalaryField
                label="Salaire brut annuel du conjoint"
                value={partnerSalary}
                onChange={setPartnerSalary}
                placeholder="Ex : 30 000"
                hint="0 si votre conjoint est sans emploi"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Children */}
        <label className="block text-sm font-medium text-text-muted mb-3">
          <Baby size={16} className="inline mr-1" />
          Enfants à charge
        </label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CHILDREN_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setChildren(n)}
              className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                children === n
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text-muted hover:border-primary/30"
              }`}
            >
              {n === 3 ? "3+" : n}
            </button>
          ))}
        </div>

        {/* Parent isolé info */}
        <AnimatePresence>
          {showParentIsole && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 mb-4">
                <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-muted leading-relaxed">
                  Demi-part parent isolé appliquée (case T)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8" />

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all shadow-sm"
        >
          Voir où vont mes impôts
          <ArrowRight size={20} />
        </motion.button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-text-muted text-center mt-4 max-w-sm mx-auto leading-relaxed">
        Calculs basés sur le barème fiscal 2026 (revenus 2025) et la Loi de Finances 2026.
        Outil indicatif, non contractuel.
      </p>
    </motion.div>
  );
}
