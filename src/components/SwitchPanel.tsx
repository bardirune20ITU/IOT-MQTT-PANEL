import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  label: string;
  isOn: boolean;
  onToggle: () => void;
};

export const SwitchPanel: React.FC<Props> = ({ label, isOn, onToggle }) => {
  const prefersReduced = useReducedMotion();

  return (
    <button
      onClick={onToggle}
      className="card p-4 w-full flex items-center justify-between"
      aria-pressed={isOn}
    >
      <span className="text-slate-200">{label}</span>
      <motion.div
        layout={!prefersReduced}
        transition={prefersReduced ? undefined : { type: "spring", stiffness: 400, damping: 30 }}
        className={`w-14 h-8 rounded-full px-1 flex items-center ${
          isOn ? "bg-emerald-500" : "bg-slate-700"
        }`}
      >
        <motion.div
          layout={!prefersReduced}
          className="w-6 h-6 bg-white rounded-full shadow"
          style={{ x: isOn ? 24 : 0 }}
        />
      </motion.div>
    </button>
  );
};
