const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SESSION_ACCESS_PREFIX = "hc_session_access:";

function getSessionAccessToken(sessionId: string): string | null {
  return localStorage.getItem(`${SESSION_ACCESS_PREFIX}${sessionId}`);
}

function authHeader(sessionId?: string): Record<string, string> {
  const token = localStorage.getItem("hc_token");
  const sessionAccessToken = sessionId ? getSessionAccessToken(sessionId) : null;

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionAccessToken ? { "X-Session-Access": sessionAccessToken } : {}),
  };
}

export function rememberSessionAccess(sessionId: string, sessionAccessToken: string) {
  localStorage.setItem(`${SESSION_ACCESS_PREFIX}${sessionId}`, sessionAccessToken);
}

export interface UploadResult {
  session_id: string;
  file_count: number;
  session_access_token: string;
}

export interface SkillScore {
  name: string;
  score: number;
}

export interface RadarPoint {
  category: string;
  value: number;
}

export interface CandidateResult {
  id: string;
  session_id: string;
  name: string;
  email: string | null;
  role: string | null;
  experience: number | null;
  education: string | null;
  score: number;
  skill_match_score: number;
  experience_score: number;
  context_score: number;
  confidence: number;
  recommendation: "shortlist" | "maybe" | "reject";
  strengths: string[];
  missing_skills: string[];
  risks: string[];
  matched_skills: string[];
  skills: SkillScore[];
  radar_data: RadarPoint[];
  ai_explanation: string | null;
  resume_filename: string;
}

export interface SessionResult {
  id: string;
  job_title: string | null;
  job_description: string;
  status: string;
  created_at: string;
  candidate_count: number;
}

export interface ResultsPayload {
  session: SessionResult;
  candidates: CandidateResult[];
}

export async function uploadResumes(
  files: File[],
  jobDescription: string,
  jobTitle?: string
): Promise<UploadResult> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  form.append("job_description", jobDescription);
  if (jobTitle) form.append("job_title", jobTitle);

  const res = await fetch(`${API}/upload/resumes`, {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
  return res.json();
}

export async function startAnalysis(
  sessionId: string,
  jobDescription: string,
  jobTitle?: string
): Promise<void> {
  const res = await fetch(`${API}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(sessionId) },
    body: JSON.stringify({
      session_id: sessionId,
      job_description: jobDescription,
      job_title: jobTitle,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Analysis failed");
}

export async function pollStatus(
  sessionId: string
): Promise<{ status: string; candidate_count: number }> {
  const res = await fetch(`${API}/analyze/status/${sessionId}`, {
    headers: authHeader(sessionId),
  });
  if (!res.ok) throw new Error("Status check failed");
  return res.json();
}

export async function getResults(sessionId: string): Promise<ResultsPayload> {
  const res = await fetch(`${API}/results/${sessionId}`, {
    headers: authHeader(sessionId),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Could not fetch results");
  return res.json();
}

export async function getCandidate(
  candidateId: string,
  sessionId: string
): Promise<CandidateResult> {
  const res = await fetch(`${API}/results/candidate/${candidateId}`, {
    headers: authHeader(sessionId),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Could not fetch candidate");
  return res.json();
}

export async function exportCsv(sessionId: string): Promise<void> {
  const res = await fetch(`${API}/export/${sessionId}/csv`, {
    headers: authHeader(sessionId),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Could not export results");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hirecopilot_${sessionId.slice(0, 8)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

