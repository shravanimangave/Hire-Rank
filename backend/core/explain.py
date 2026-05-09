"""
Explainability engine.
Generates a plain-English hiring explanation for each candidate.
No external LLM required — rule-based with templates.
"""
from typing import List, Optional


def generate_explanation(
    name: str,
    final_score: float,
    skill_score: float,
    experience_score: float,
    context_score: float,
    matched_skills: List[str],
    missing_skills: List[str],
    strengths: List[str],
    risks: List[str],
    years: Optional[float],
    recommendation: str,
    confidence: float,
) -> str:
    parts = []

    # Opening — overall fit
    if recommendation == "shortlist":
        opener = f"{name} is a strong match for this role"
    elif recommendation == "maybe":
        opener = f"{name} is a moderate fit for this role"
    else:
        opener = f"{name} does not meet the core requirements for this role"

    if years:
        opener += f" with {int(years)} year{'s' if years != 1 else ''} of relevant experience"
    parts.append(opener + ".")

    # Skill commentary
    if matched_skills:
        skill_list = ", ".join(s.title() for s in matched_skills[:4])
        parts.append(f"Demonstrated skills include {skill_list}.")
    if missing_skills:
        miss_list = ", ".join(s.title() for s in missing_skills[:3])
        parts.append(f"Notable gaps: {miss_list}.")

    # Score narrative
    if skill_score >= 80:
        parts.append("Skill alignment with the job description is excellent.")
    elif skill_score >= 60:
        parts.append("Skill alignment is reasonable but some gaps exist.")
    else:
        parts.append("Skill alignment with the job description is weak.")

    if experience_score >= 70:
        parts.append("Experience depth signals strong real-world impact.")
    elif experience_score >= 45:
        parts.append("Experience depth is adequate for a mid-level role.")
    else:
        parts.append("Experience indicators are limited.")

    if context_score >= 70:
        parts.append("Resume context is strong — achievements are clearly articulated.")
    elif context_score < 45:
        parts.append("Resume language is vague; stronger achievement framing would help.")

    # Risks
    if risks:
        risk_text = risks[0].lower()
        parts.append(f"Key risk: {risk_text}.")

    # Confidence
    if confidence >= 85:
        conf_text = "high"
    elif confidence >= 65:
        conf_text = "moderate"
    else:
        conf_text = "low"
    parts.append(f"Confidence in this assessment is {conf_text} ({int(confidence)}%).")

    return " ".join(parts)



