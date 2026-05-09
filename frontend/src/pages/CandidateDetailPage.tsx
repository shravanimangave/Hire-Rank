import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/hiring/AppHeader";
import { ScoreBar } from "@/components/hiring/ScoreBar";
import { RecommendationBadge } from "@/components/hiring/RecommendationBadge";
import { SkillTag } from "@/components/hiring/SkillTag";
import { ExplanationCard } from "@/components/hiring/ExplanationCard";
import { CandidateRadarChart } from "@/components/hiring/CandidateRadarChart";
import { CandidateResult, getCandidate } from "@/services/api";

export default function CandidateDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const [candidate, setCandidate] = useState<CandidateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !sessionId) {
      setError("Missing candidate or session identifier.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    getCandidate(id, sessionId)
      .then((data) => {
        if (active) setCandidate(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load candidate.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-16 text-center text-muted-foreground">Loading candidate...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-16 text-center text-muted-foreground">
          {error || "Candidate not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl py-8">
        <Link
          to={`/dashboard?session=${candidate.session_id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">{candidate.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {candidate.role || "Role not detected"} • {candidate.experience ?? 0} years •{" "}
              {candidate.education || "Education not detected"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold gradient-text">{candidate.score}</p>
              <p className="text-xs text-muted-foreground">Overall Score</p>
            </div>
            <RecommendationBadge recommendation={candidate.recommendation} />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.strengths.map((strength) => (
                <SkillTag key={strength} label={strength} variant="strength" />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.missing_skills.map((skill) => (
                <SkillTag key={skill} label={skill} variant="missing" />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-warning" /> Risks
            </h3>
            <ul className="space-y-2">
              {candidate.risks.map((risk) => (
                <li key={risk} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  {risk}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <h3 className="mb-2 font-semibold text-foreground">Competency Radar</h3>
            <CandidateRadarChart data={candidate.radar_data} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 font-semibold text-foreground">Skills Breakdown</h3>
            <div className="space-y-3">
              {candidate.skills.map((skill) => (
                <ScoreBar key={skill.name} label={skill.name} score={skill.score} size="md" />
              ))}
            </div>
          </motion.div>

          <ExplanationCard
            explanation={candidate.ai_explanation || "No explanation was generated for this candidate."}
            confidence={candidate.confidence}
          />
        </div>
      </main>
    </div>
  );
}

