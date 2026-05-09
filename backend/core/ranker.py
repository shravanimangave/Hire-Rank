"""
Ranker: takes scored candidates and applies recommendation logic with overrides.
"""
from typing import List


RADAR_CATEGORIES = [
    "Technical", "Experience", "Leadership", "Culture Fit",
    "Communication", "Problem Solving",
]

LEADERSHIP_WORDS = ["led", "managed", "mentored", "directed", "oversaw", "head", "principal"]
COMM_WORDS       = ["presented", "communicated", "collaborated", "written", "documentation"]
PROBLEM_WORDS    = ["solved", "debugged", "optimised", "optimized", "architected", "designed", "analysed"]
CULTURE_WORDS    = ["team", "agile", "scrum", "cross-functional", "collaborated", "culture"]


def _keyword_score(text: str, keywords: list, base: float = 50.0) -> float:
    lower = text.lower()
    hits  = sum(1 for k in keywords if k in lower)
    return min(100.0, base + hits * 7)


def build_radar_data(
    resume_text: str,
    skill_score: float,
    experience_score: float,
    context_score: float,
    years: float | None,
) -> list:
    """Generate 6-axis radar data from resume signals."""
    experience_val = min(100, (years / 10 * 100)) if years else experience_score

    return [
        {"category": "Technical",       "value": round(skill_score, 1)},
        {"category": "Experience",      "value": round(experience_val, 1)},
        {"category": "Leadership",      "value": round(_keyword_score(resume_text, LEADERSHIP_WORDS), 1)},
        {"category": "Culture Fit",     "value": round(_keyword_score(resume_text, CULTURE_WORDS, 55), 1)},
        {"category": "Communication",   "value": round(_keyword_score(resume_text, COMM_WORDS, 50), 1)},
        {"category": "Problem Solving", "value": round(_keyword_score(resume_text, PROBLEM_WORDS, 50), 1)},
    ]


def determine_recommendation(
    final_score: float,
    missing_skills: List[str],
    critical_missing: List[str] | None = None,
) -> str:
    """
    Base logic: score > 75 → shortlist, 50–75 → maybe, < 50 → reject.
    Override: missing critical skills → downgrade by one tier.
    """
    if final_score >= 75:
        rec = "shortlist"
    elif final_score >= 50:
        rec = "maybe"
    else:
        rec = "reject"

    # Downgrade if critical skills are missing
    if critical_missing:
        missing_lower = {s.lower() for s in missing_skills}
        if any(c.lower() in missing_lower for c in critical_missing):
            if rec == "shortlist":
                rec = "maybe"
            elif rec == "maybe":
                rec = "reject"

    return rec


def extract_strengths(resume_text: str, matched_skills: List[str]) -> List[str]:
    strengths = []
    lower = resume_text.lower()

    if matched_skills:
        strengths.append(f"Strong: {', '.join(s.title() for s in matched_skills[:3])}")

    for phrase, label in [
        (LEADERSHIP_WORDS, "Leadership experience"),
        (PROBLEM_WORDS, "Strong problem-solver"),
        (COMM_WORDS, "Good communicator"),
    ]:
        if any(w in lower for w in phrase):
            strengths.append(label)

    if "mentor" in lower or "coach" in lower:
        strengths.append("Mentoring ability")

    import re
    if re.search(r"\d+\s*(%|x\b|k\b)", lower):
        strengths.append("Quantified achievements")

    return strengths[:5]


def extract_risks(
    resume_text: str,
    missing_skills: List[str],
    years: float | None,
) -> List[str]:
    risks = []
    lower = resume_text.lower()

    if missing_skills:
        risks.append(f"Missing: {', '.join(s.title() for s in missing_skills[:3])}")

    if years is not None and years < 2:
        risks.append("Limited professional experience")

    for phrase, label in [
        (["no team", "solo", "individual contributor"], "No team collaboration evidence"),
        (["bootcamp", "self-taught"], "Non-traditional background"),
    ]:
        if any(p in lower for p in phrase):
            risks.append(label)

    if len(resume_text.split()) < 200:
        risks.append("Resume lacks detail — low signal")

    return risks[:4]



