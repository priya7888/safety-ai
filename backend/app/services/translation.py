"""
Multilingual Translation Service for Safety Observations
--------------------------------------------------------
Translates incoming non-English voice transcripts and text reports
(Hindi, Telugu, Tamil, Marathi, Bengali, Spanish, etc.) into English
so the downstream NLP SIF assessment, energy extraction, and barrier
diagnostics can execute with standard domain rules.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Tuple, Optional

logger = logging.getLogger("safety_translation")

# Local fallback dictionary for offline/air-gapped resilience
OFFLINE_SAFETY_TERMS = {
    # Hindi
    "गैस": "gas",
    "रिसाव": "leak",
    "आग": "fire",
    "धुआं": "smoke",
    "ऊंचाई": "height",
    "सुरक्षा बेल्ट": "safety harness",
    "करंट": "electrical shock",
    "तार": "wire",
    "फिसलन": "slippery",
    # Telugu
    "గ్యాస్": "gas",
    "లీక్": "leak",
    "మంటలు": "fire",
    "ప్యానెల్": "panel",
    "విద్యుత్": "electricity",
    # Tamil
    "எரிவாயு": "gas",
    "கசிவு": "leak",
    "தீ": "fire",
    "மின்சாரம்": "electrical"
}


def translate_text_to_english(text: str, source_lang: Optional[str] = "auto") -> Tuple[str, str]:
    """
    Translates text to English using Google GTX endpoint,
    falling back to offline translation dictionary if network unavailable.
    Returns: (translated_text, detected_source_language)
    """
    if not text or not text.strip():
        return text, "en"

    cleaned = text.strip()

    # If purely ASCII without foreign script, return as English
    if all(ord(c) < 128 for c in cleaned):
        return cleaned, "en"

    src = source_lang or "auto"
    try:
        url = (
            f"https://translate.googleapis.com/translate_a/single?client=gtx"
            f"&sl={src}&tl=en&dt=t&q={urllib.parse.quote(cleaned)}"
        )
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
            if payload and isinstance(payload, list) and len(payload) > 0 and isinstance(payload[0], list):
                translated_segments = [part[0] for part in payload[0] if part and part[0]]
                translated = "".join(translated_segments)
                detected = (
                    payload[2]
                    if len(payload) > 2 and isinstance(payload[2], str)
                    else src
                )
                if translated:
                    return translated.strip(), detected
    except Exception as err:
        logger.warning(f"Online translation call failed ({err}), attempting local dictionary fallback.")

    # Offline dictionary fallback for air-gapped situations
    translated_words = []
    for word in cleaned.split():
        matched = False
        for k, v in OFFLINE_SAFETY_TERMS.items():
            if k in word:
                translated_words.append(v)
                matched = True
                break
        if not matched:
            translated_words.append(word)

    fallback_text = " ".join(translated_words)
    return fallback_text, "auto"
