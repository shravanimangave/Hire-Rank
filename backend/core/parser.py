"""
Resume parser: PDF → structured dict.
Uses pdfplumber for text extraction, regex + heuristics for section splitting.
"""
import re
import pdfplumber
from pathlib import Path
from typing import Optional


SECTION_HEADERS = {
    "contact": ["contact", "personal", "profile"],
    "summary": ["summary", "objective", "about", "overview"],
    "skills": ["skills", "technologies", "technical", "competencies", "expertise"],
    "experience": ["experience", "employment", "work history", "professional experience", "career"],
    "education": ["education", "academic", "qualifications", "degrees"],
    "projects": ["projects", "portfolio", "side projects"],
    "certifications": ["certifications", "certificates", "licenses", "awards"],
}

EMAIL_RE   = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.I)
PHONE_RE   = re.compile(r"[\+]?[\d\s\-().]{7,15}")
EXP_RE     = re.compile(r"(\d+)\s*\+?\s*years?\s*(of\s*)?(experience|exp)", re.I)
DEGREE_RE  = re.compile(
    r"(B\.?S\.?|M\.?S\.?|B\.?E\.?|M\.?E\.?|Ph\.?D\.?|B\.?Tech|M\.?Tech|MBA|Bachelor|Master|Doctor)\b",
    re.I,
)


def extract_text(file_path: str) -> str:
    """Extract raw text from PDF."""
    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text(x_tolerance=2, y_tolerance=3)
            if t:
                text_parts.append(t)
    return "\n".join(text_parts)


def _detect_section(line: str) -> Optional[str]:
    """Return section key if line looks like a section header, else None."""
    clean = line.strip().lower().rstrip(":").rstrip()
    for key, keywords in SECTION_HEADERS.items():
        if any(clean == kw or clean.startswith(kw) for kw in keywords):
            return key
    return None


def split_sections(text: str) -> dict:
    """Split resume text into labelled sections."""
    sections: dict = {k: [] for k in SECTION_HEADERS}
    sections["other"] = []
    current = "other"

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        detected = _detect_section(stripped)
        if detected:
            current = detected
        else:
            sections[current].append(stripped)

    return {k: "\n".join(v) for k, v in sections.items()}


def extract_name(text: str) -> str:
    """Heuristic: first non-empty line is usually the candidate's name."""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped and len(stripped.split()) <= 5 and not EMAIL_RE.search(stripped):
            return stripped
    return "Unknown"


def extract_email(text: str) -> Optional[str]:
    m = EMAIL_RE.search(text)
    return m.group(0) if m else None


def extract_experience_years(text: str) -> Optional[float]:
    """Try to extract years of experience from text."""
    m = EXP_RE.search(text)
    if m:
        return float(m.group(1))
    # Count distinct year ranges like "2019 – 2023" as a fallback
    year_ranges = re.findall(r"\b(20\d{2}|19\d{2})\b", text)
    if len(year_ranges) >= 2:
        years = sorted(set(int(y) for y in year_ranges))
        return float(years[-1] - years[0])
    return None


def extract_education(text: str) -> Optional[str]:
    for line in text.splitlines():
        if DEGREE_RE.search(line):
            return line.strip()[:120]
    return None


def extract_role(sections: dict) -> Optional[str]:
    """Try to infer job title from summary or experience section."""
    for section in ("summary", "experience"):
        lines = sections.get(section, "").splitlines()
        for line in lines[:5]:
            # Role lines often contain title-case words and no numbers
            if len(line.split()) >= 2 and not re.search(r"\d{4}", line):
                clean = line.strip()
                if 5 < len(clean) < 80:
                    return clean
    return None


def parse_resume(file_path: str) -> dict:
    """
    Full parsing pipeline.
    Returns a structured dict with all extracted fields.
    """
    raw_text = extract_text(file_path)
    sections  = split_sections(raw_text)

    return {
        "raw_text": raw_text,
        "sections": sections,
        "name": extract_name(raw_text),
        "email": extract_email(raw_text),
        "experience_years": extract_experience_years(raw_text),
        "education": extract_education(sections.get("education", "") or raw_text),
        "role": extract_role(sections),
        "skills_text": sections.get("skills", ""),
        "experience_text": sections.get("experience", ""),
    }



