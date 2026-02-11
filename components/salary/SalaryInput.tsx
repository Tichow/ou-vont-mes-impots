"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Users, User, Baby } from "lucide-react";
import { formatEuros } from "@/lib/formatting";

type FamilyStatus = "single" | "couple";

const MIN_SALARY = 0;
const MAX_SALARY = 200_000;
const DEFAULT_SALARY = 35_000;
const STEP = 500;

const CHILDREN_OPTIONS = [0, 1, 2, 3] as const;

export function SalaryInput() {
  const router = useRouter();
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus>("single");
  const [children, setChildren] = useState(0);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSalary(Number(e.target.value));
    },
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\s/g, "").replace(/€/g, "");
      const num = Number(value);
      if (!isNaN(num) && num >= MIN_SALARY && num <= MAX_SALARY) {
        setSalary(num);
      }
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const params = new URLSearchParams({
      salary: salary.toString(),
      status: familyStatus,
      children: children.toString(),
    });
    router.push(`/resultats?${params.toString()}`);
  }, [salary, familyStatus, children, router]);

  const sliderPercentage = ((salary - MIN_SALARY) / (MAX_SALARY - MIN_SALARY)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative rounded-3xl bg-white p-8 md:p-10 shadow-primary-lg border border-border overflow-hidden">
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
        {/* Salary input */}
        <label className="block text-sm font-medium text-text-muted mb-2">
          Salaire brut annuel
        </label>
        <div className="relative mb-2">
          <input
            type="text"
            value={formatEuros(salary)}
            onChange={handleInputChange}
            className="w-full text-center text-4xl font-bold text-text bg-surface-alt rounded-xl py-4 px-6 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Slider */}
        <div className="relative mb-8 mt-4">
          <input
            type="range"
            min={MIN_SALARY}
            max={MAX_SALARY}
            step={STEP}
            value={salary}
            onChange={handleSliderChange}
            className="w-full h-2 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${sliderPercentage}%, var(--color-border) ${sliderPercentage}%, var(--color-border) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>{formatEuros(MIN_SALARY)}</span>
            <span>{formatEuros(MAX_SALARY)}</span>
          </div>
        </div>

        {/* Family status */}
        <label className="block text-sm font-medium text-text-muted mb-3">
          Situation familiale
        </label>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setFamilyStatus("single")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              familyStatus === "single"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-text-muted hover:border-primary/30"
            }`}
          >
            <User size={18} />
            Célibataire
          </button>
          <button
            type="button"
            onClick={() => setFamilyStatus("couple")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              familyStatus === "couple"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-text-muted hover:border-primary/30"
            }`}
          >
            <Users size={18} />
            En couple
          </button>
        </div>

        {/* Children */}
        <label className="block text-sm font-medium text-text-muted mb-3">
          <Baby size={16} className="inline mr-1" />
          Enfants à charge
        </label>
        <div className="grid grid-cols-4 gap-2 mb-8">
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

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all shadow-primary-sm"
        >
          Voir où vont mes impôts
          <ArrowRight size={20} />
        </motion.button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-text-muted text-center mt-4 max-w-sm mx-auto leading-relaxed">
        Calculs basés sur le barème fiscal 2026 (revenus 2025) et la Loi de Finances 2026.
        Outil indicatif — non contractuel.
      </p>
    </motion.div>
  );
}
