"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Users, User, Baby, Info } from "lucide-react";
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
  const [partnerSalary, setPartnerSalary] = useState(0);

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

  const handlePartnerSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPartnerSalary(Number(e.target.value));
    },
    []
  );

  const handlePartnerInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\s/g, "").replace(/€/g, "");
      const num = Number(value);
      if (!isNaN(num) && num >= MIN_SALARY && num <= MAX_SALARY) {
        setPartnerSalary(num);
      }
    },
    []
  );

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

  const sliderPercentage = ((salary - MIN_SALARY) / (MAX_SALARY - MIN_SALARY)) * 100;
  const partnerSliderPercentage = ((partnerSalary - MIN_SALARY) / (MAX_SALARY - MIN_SALARY)) * 100;
  const showParentIsole = familyStatus === "single" && children >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative rounded-3xl bg-white p-8 md:p-10 shadow-primary-lg border border-border overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
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
            <span className="text-[11px] text-text-muted font-normal">
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
            <span className="text-[11px] text-text-muted font-normal">
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
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-text-muted mb-2">
                Salaire brut annuel du conjoint
              </label>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={formatEuros(partnerSalary)}
                  onChange={handlePartnerInputChange}
                  className="w-full text-center text-2xl font-bold text-text bg-surface-alt rounded-xl py-3 px-6 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="relative mb-2 mt-3">
                <input
                  type="range"
                  min={MIN_SALARY}
                  max={MAX_SALARY}
                  step={STEP}
                  value={partnerSalary}
                  onChange={handlePartnerSliderChange}
                  className="w-full h-2 appearance-none rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${partnerSliderPercentage}%, var(--color-border) ${partnerSliderPercentage}%, var(--color-border) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>{formatEuros(MIN_SALARY)}</span>
                  <span>{formatEuros(MAX_SALARY)}</span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted mb-6">
                0 € si votre conjoint est sans emploi
              </p>
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
          className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all shadow-primary-sm"
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
