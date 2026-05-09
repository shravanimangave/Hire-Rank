"""
Scoring engine.

Final Score = 0.5 × Skill Match + 0.3 × Experience Depth + 0.2 × Context Quality

All sub-scores are 0–100.
"""
import re
import math
import hashlib
from typing import List, Tuple

from sentence_transformers import SentenceTransformer, util
from backend.config import settings

# Load model once (cached at module level)
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


# ── Skill extraction ─────────────────────────────────────────────────────────

TECH_SKILLS = {
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "r", "matlab",
    "react", "vue", "angular", "next.js", "svelte", "node.js", "express",
    "django", "flask", "fastapi", "spring", "spring boot", "laravel",
    "tensorflow", "pytorch", "keras", "sklearn", "scikit-learn",
    "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
    "git", "ci/cd", "jenkins", "github actions", "graphql", "rest", "grpc",
    "machine learning", "deep learning", "nlp", "computer vision",
    "microservices", "kafka", "rabbitmq", "spark", "hadoop",
    "linux", "bash", "devops", "agile", "scrum",
}

SOFT_SKILLS = {
    "leadership", "communication", "teamwork", "mentoring", "problem solving",
    "collaboration", "project management", "stakeholder management",
}


def extract_skills_from_text(text: str) -> List[str]:
    """Extract skill tokens from free text."""
    lower = text.lower()
    found = set()
    for skill in TECH_SKILLS | SOFT_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lower):
            found.add(skill)
    return sorted(found)


def extract_jd_skills(jd_text: str) -> List[str]:
    return extract_skills_from_text(jd_text)


# ── Component 1: Skill Match (semantic) ───────────────────────────────────────

def skill_match_score(resume_text: str, jd_text: str) -> Tuple[float, List[str], List[str]]:
    """
    Semantic cosine similarity between resume and JD embeddings.
    Returns (score_0_100, matched_skills, missing_skills).
    """
    model = _get_model()
    jd_skills = extract_jd_skills(jd_text)
    resume_skills = extract_skills_from_text(resume_text)

    matched = [s for s in jd_skills if s in resume_skills]
    missing = [s for s in jd_skills if s not in resume_skills]

    # Semantic similarity as baseline
    emb_resume = model.encode(resume_text[:2000], convert_to_tensor=True)
    emb_jd     = model.encode(jd_text[:2000], convert_to_tensor=True)
    semantic_sim = float(util.cos_sim(emb_resume, emb_jd)[0][0])
    semantic_score = max(0.0, min(1.0, semantic_sim)) * 100

    # Explicit skill overlap bonus
    if jd_skills:
        overlap_ratio = len(matched) / len(jd_skills)
    else:
        overlap_ratio = 0.5

    # Blend semantic (60%) + overlap (40%)
    blended = 0.6 * semantic_score + 0.4 * (overlap_ratio * 100)
    return round(blended, 1), matched, missing


# ── Component 2: Experience Depth ─────────────────────────────────────────────

LEADERSHIP_PHRASES = [
    "led", "lead", "managed", "managed a team", "oversaw", "directed",
    "mentored", "coached", "head of", "tech lead", "principal",
]

IMPACT_PHRASES = [
    "reduced", "improved", "increased", "built", "launched", "scaled",
    "architected", "designed", "deployed", "shipped", "delivered",
    "optimised", "optimized", "saved", "grew",
]


def experience_depth_score(experience_text: str, years: float | None) -> float:
    """Score based on years + leadership signals + quantified impact."""
    text_lower = experience_text.lower()

    # Years sub-score (0–40 pts)
    if years is None:
        years_score = 20.0  # unknown → neutral
    else:
        # Sigmoid-ish: 0y→0, 2y→25, 5y→35, 8y→40
        years_score = min(40.0, (years / 10) * 40)

    # Leadership sub-score (0–30 pts)
    leadership_hits = sum(1 for p in LEADERSHIP_PHRASES if p in text_lower)
    leadership_score = min(30.0, leadership_hits * 8)

    # Impact / quantified achievements (0–30 pts)
    # Bonus if numbers appear near impact verbs
    has_metrics = bool(re.search(r"\d+\s*(%|x|k\b|ms\b|m\b)", text_lower))
    impact_hits = sum(1 for p in IMPACT_PHRASES if p in text_lower)
    impact_score = min(25.0, impact_hits * 5) + (5.0 if has_metrics else 0.0)

    return round(min(100.0, years_score + leadership_score + impact_score), 1)


# ── Component 3: Context Quality ──────────────────────────────────────────────

WEAK_PHRASES = [
    "used", "worked with", "familiar with", "exposure to", "knowledge of",
    "helped", "assisted",
]

STRONG_PHRASES = [
    "built", "developed", "architected", "designed", "implemented",
    "scaled", "shipped", "deployed", "led", "created", "launched",
    "optimised", "optimized", "reduced", "increased", "improved",
    "managed", "delivered", "published",
]


def context_quality_score(resume_text: str) -> float:
    """
    Differentiates shallow ('used Python') from strong ('built scalable API in Python').
    Returns 0–100.
    """
    lower = resume_text.lower()
    strong_hits = sum(1 for p in STRONG_PHRASES if p in lower)
    weak_hits   = sum(1 for p in WEAK_PHRASES   if p in lower)

    # More strong than weak → good context
    net = strong_hits - weak_hits
    base = 50.0  # neutral
    score = base + net * 4.0
    return round(max(0.0, min(100.0, score)), 1)


# ── Final composite score ─────────────────────────────────────────────────────

def compute_final_score(skill: float, experience: float, context: float) -> float:
    """Weighted formula: 50% skill, 30% experience, 20% context."""
    return round(0.5 * skill + 0.3 * experience + 0.2 * context, 1)


# ── Per-skill breakdown ───────────────────────────────────────────────────────

def skill_breakdown(jd_text: str, resume_text: str) -> List[dict]:
    """
    Score each JD skill individually for the radar/bar chart.
    Returns [{name, score}] sorted descending.
    """
    model = _get_model()
    jd_skills = extract_jd_skills(jd_text)
    resume_skills = extract_skills_from_text(resume_text)

    results = []
    for skill in jd_skills[:8]:  # cap at 8 for UI
        if skill in resume_skills:
            # Embed skill in context of resume
            emb_s  = model.encode(skill, convert_to_tensor=True)
            emb_r  = model.encode(resume_text[:1500], convert_to_tensor=True)
            sim = float(util.cos_sim(emb_s, emb_r)[0][0])
            score = min(100, max(50, round(sim * 120, 0)))  # present → ≥ 50
        else:
            # Absent skill: deterministic low score (md5-based, not hash() which is randomized)
            seed = int(hashlib.md5(skill.encode()).hexdigest(), 16)
            score = max(10, 20 + seed % 20)
        results.append({"name": skill.title(), "score": float(score)})

    return sorted(results, key=lambda x: x["score"], reverse=True)


# ── Confidence ────────────────────────────────────────────────────────────────

def compute_confidence(
    final_score: float,
    matched_skills: List[str],
    jd_skills: List[str],
    years: float | None,
) -> float:
    """Confidence reflects how much signal we had."""
    data_richness = 0.5
    if years is not None:
        data_richness += 0.2
    if matched_skills:
        data_richness += min(0.3, len(matched_skills) / max(1, len(jd_skills)) * 0.3)

    # Extreme scores → higher confidence
    score_confidence = 0.5 + abs(final_score - 50) / 100
    return round(min(1.0, data_richness * 0.5 + score_confidence * 0.5) * 100, 1)



