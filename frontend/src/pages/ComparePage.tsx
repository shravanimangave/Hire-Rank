import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/hiring/AppHeader";
import { ScoreBar } from "@/components/hiring/ScoreBar";
import { RecommendationBadge } from "@/components/hiring/RecommendationBadge";
import { SkillTag } from "@/components/hiring/SkillTag";
import { CandidateRadarChart } from "@/components/hiring/CandidateRadarChart";
import { CandidateResult, getResults } from "@/services/api";

export default function ComparePage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [candidateAId, setCandidateAId] = useState("");
  const [candidateBId, setCandidateBId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No analysis session was provided.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    getResults(sessionId)
      .then((data) => {
        if (!active) return;
        const sortedCandidates = [...data.candidates].sort((a, b) => b.score - a.score);
        setCandidates(sortedCandidates);
        setCandidateAId(sortedCandidates[0]?.id ?? "");
        setCandidateBId(sortedCandidates[1]?.id ?? sortedCandidates[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load candidates.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  const candidateA = useMemo(
    () => candidates.find((candidate) => candidate.id === candidateAId) ?? null,
    [candidateAId, candidates]
  );
  const candidateB = useMemo(
    () => candidates.find((candidate) => candidate.id === candidateBId) ?? null,
    [candidateBId, candidates]
  );

  const CandidateSelector = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (id: string) => void;
  }) => (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      {candidates.map((candidate) => (
        <option key={candidate.id} value={candidate.id}>
          {candidate.name}
        </option>
      ))}
    </select>
  );

  const CandidateColumn = ({
    candidate,
    delay,
  }: {
    candidate: CandidateResult;
    delay: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="glass-card p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-muted-foreground">
          {candidate.name[0]}
        </div>
        <h3 className="text-lg font-bold text-foreground">{candidate.name}</h3>
        <p className="text-sm text-muted-foreground">{candidate.role || "Role not detected"}</p>
        <div className="mt-3">
          <RecommendationBadge recommendation={candidate.recommendation} />
        </div>
        <p className="mt-4 text-4xl font-bold gradient-text">{candidate.score}</p>
        <p className="text-xs text-muted-foreground">Overall Score</p>
      </div>

      <div className="glass-card p-5">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Skills</h4>
        <div className="space-y-2.5">
          {candidate.skills.map((skill) => (
            <ScoreBar key={skill.name} label={skill.name} score={skill.score} size="sm" />
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Strengths</h4>
        <div className="flex flex-wrap gap-1.5">
          {candidate.strengths.map((strength) => (
            <SkillTag key={strength} label={strength} variant="strength" />
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Gaps</h4>
        <div className="flex flex-wrap gap-1.5">
          {candidate.missing_skills.map((skill) => (
            <SkillTag key={skill} label={skill} variant="missing" />
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8 text-sm text-muted-foreground">Loading candidates...</main>
      </div>
    );
  }

  if (error || !candidateA || !candidateB) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8 text-sm text-muted-foreground">
          {error || "At least one candidate is required to compare."}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Compare Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Side-by-side analysis with visual metrics
          </p>
        </motion.div>

        <div className="mb-8 flex items-center gap-4">
          <CandidateSelector value={candidateA.id} onChange={setCandidateAId} />
          <span className="font-medium text-muted-foreground">vs</span>
          <CandidateSelector value={candidateB.id} onChange={setCandidateBId} />
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <CandidateColumn candidate={candidateA} delay={0.1} />
          </div>

          <div className="col-span-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="mb-2 text-center text-sm font-semibold text-foreground">
                Competency Comparison
              </h3>
              <CandidateRadarChart
                data={candidateA.radar_data}
                compareData={candidateB.radar_data}
              />
              <div className="mt-2 flex justify-center gap-6 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-primary" />
                  {candidateA.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-accent" />
                  {candidateB.name}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="col-span-4">
            <CandidateColumn candidate={candidateB} delay={0.15} />
          </div>
        </div>
      </main>
    </div>
  );
}

