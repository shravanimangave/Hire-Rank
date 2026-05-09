import { motion } from "framer-motion";

interface ScoreBarProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "from-emerald-400 to-emerald-500";
  if (score >= 60) return "from-amber-400 to-amber-500";
  return "from-red-400 to-red-500";
};

const getScoreGlow = (score: number) => {
  if (score >= 80) return "shadow-emerald-500/30";
  if (score >= 60) return "shadow-amber-500/30";
  return "shadow-red-500/30";
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ScoreBar({ score, label, size = "md", showLabel = true }: ScoreBarProps) {
  return (
    <div className="w-full">
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          <span className="text-sm font-semibold text-foreground">{score}%</span>
        </div>
      )}
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeMap[size]}`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(score)} shadow-lg ${getScoreGlow(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

