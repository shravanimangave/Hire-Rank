import { motion } from "framer-motion";
import { CheckCircle, HelpCircle, XCircle } from "lucide-react";

type Recommendation = "shortlist" | "maybe" | "reject";

interface RecommendationBadgeProps {
  recommendation: Recommendation;
  size?: "sm" | "md";
}

const config = {
  shortlist: {
    label: "Shortlist",
    icon: CheckCircle,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  maybe: {
    label: "Maybe",
    icon: HelpCircle,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  reject: {
    label: "Reject",
    icon: XCircle,
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

export function RecommendationBadge({ recommendation, size = "md" }: RecommendationBadgeProps) {
  const { label, icon: Icon, className } = config[recommendation];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-3 py-1 text-sm gap-1.5";

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center rounded-full border font-medium ${className} ${sizeClasses}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {label}
    </motion.span>
  );
}

