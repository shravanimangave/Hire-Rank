import { motion } from "framer-motion";

interface SkillTagProps {
  label: string;
  variant: "strength" | "missing" | "risk";
}

const variantClasses = {
  strength: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  missing: "bg-red-500/10 text-red-400 border-red-500/20",
  risk: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function SkillTag({ label, variant }: SkillTagProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${variantClasses[variant]}`}
    >
      {label}
    </motion.span>
  );
}

