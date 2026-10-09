from typing import Dict, Any, Optional
from .preprocessing import preprocess_text
from .context_analyzer import get_category_context
from .information_extraction import extract_safety_information
from .hazard_detection import detect_hazard, detect_all_hazards
from .safety_signal_detection import detect_safety_signals
from .energy_exposure_analysis import analyze_energy_and_exposure
from .barrier_analysis import analyze_barriers
from .sif_assessment import assess_sif_precursor
from .explanation_generator import generate_explanation
from .life_saving_rules import map_life_saving_rules

def analyze_safety_report(
    report_type: str,
    description: str,
    additional_context: Optional[str] = None,
    legacy_scoring: bool = False
) -> Dict[str, Any]:
    """
    Executes the modular AI/NLP Safety Intelligence Pipeline:
    1. Preprocess text (preserving critical negations and masking PII)
    2. Category Context Loading
    3. Structured Information Extraction (entities & measurements)
    4. Multi-Hazard Detection & Severity-Ranked Primary Selection
    5. Safety Signal Detection
    6. Energy Vector & Exposure Analysis (Gravity, Kinetic, Electrical, Chemical, Thermal, Pressure)
    7. Deterministic Barrier / Control Diagnostics
    8. IOGP Life-Saving Rules Mapping (all 9 rules)
    9. Hybrid SIF Decision Engine (Multi-Hazard Cumulative MAUT Score + Rule Evidence + ML Probability)
    10. Explainable Result Generation
    """
    full_text = description
    if additional_context and additional_context.strip():
        full_text += f". Additional Context: {additional_context.strip()}"
    
    # 1. Text Preprocessing
    cleaned_text = preprocess_text(full_text, mask_personal_data=True)

    # 2. Category Context
    cat_context = get_category_context(report_type)

    # 3. Information Extraction
    extracted_info = extract_safety_information(cleaned_text, report_type)

    # 4. Multi-Hazard Detection & Primary Hazard Identification
    all_detected_hazards = detect_all_hazards(cleaned_text)
    identified_hazard = detect_hazard(cleaned_text)

    # 5. Safety Signal Detection
    safety_signals = detect_safety_signals(cleaned_text)

    # 6. Energy & Exposure Analysis
    energy_exposure = analyze_energy_and_exposure(cleaned_text)

    # 7. Barrier / Control Analysis
    barrier_eval = analyze_barriers(cleaned_text)

    # 8. Life-Saving Rules Evaluation (All 9 IOGP Rules)
    lsr_match = map_life_saving_rules(cleaned_text)

    # 9. Hybrid SIF Decision Engine (Rule Assessment + ML Probability + Gated Monotonic / MAUT Risk Score)
    sif_result = assess_sif_precursor(
        report_type=report_type,
        text=cleaned_text,
        hazard=identified_hazard,
        energy_source=energy_exposure.get("energy_source"),
        exposure=energy_exposure.get("exposure"),
        barrier_status=barrier_eval.get("status", "BARRIER_INSUFFICIENT_INFO"),
        signals=safety_signals,
        all_hazards=all_detected_hazards,
        all_energy_sources=energy_exposure.get("all_energy_sources", []),
        legacy_scoring=legacy_scoring
    )

    # Parse structured checklist safety factors from additional_context
    safety_factors = []
    if additional_context and str(additional_context).strip():
        import re
        factors_text = str(additional_context).replace("Safety Factors:", "").strip()
        safety_factors = [f.strip() for f in re.split(r'[,;]\s*', factors_text) if f.strip()]
    # Enrich extracted entities with pipeline detections
    extracted_info["hazard"] = identified_hazard or "UNKNOWN"
    extracted_info["worker_exposure"] = energy_exposure.get("exposure") or "UNKNOWN"
    extracted_info["barrier"] = barrier_eval.get("description") or "UNKNOWN"
    extracted_info["consequence"] = sif_result.get("potential_consequence") or "UNKNOWN"


    # 10. Explainable Result Generation
    explanation = generate_explanation(
        sif_assessment=sif_result["assessment"],
        hazard=identified_hazard,
        signals=safety_signals,
        energy_source=energy_exposure.get("energy_source"),
        exposure=energy_exposure.get("exposure"),
        barrier_desc=barrier_eval.get("description", "Not identified"),
        potential_consequence=sif_result.get("potential_consequence"),
        report_type=report_type,
        safety_factors=safety_factors
    )

    # Structured Output
    return {
        "analysis_context": cat_context["description"],
        "identified_action": extracted_info.get("action"),
        "safety_factors": safety_factors,
        "identified_condition": extracted_info.get("condition"),
        "identified_event": extracted_info.get("event"),
        "identified_hazard": identified_hazard,
        "all_detected_hazards": all_detected_hazards,
        "safety_signals": safety_signals,
        "energy_source": energy_exposure.get("energy_source"),
        "all_energy_sources": energy_exposure.get("all_energy_sources", []),
        "exposure": energy_exposure.get("exposure"),
        "barrier_information": barrier_eval.get("status"),
        "barrier_description": barrier_eval.get("description"),
        "potential_consequence": sif_result.get("potential_consequence"),
        "sif_precursor_assessment": sif_result["assessment"],
        "ai_classification": sif_result.get("ai_classification", "Non-SIF-potential"),
        "final_ai_decision": sif_result.get("final_ai_decision", "NON-SIF OBSERVATION"),
        "rule_based_assessment": sif_result.get("rule_based_assessment", "NO"),
        "ml_probability": sif_result.get("ml_probability", 0.0),
        "ai_sif_score": sif_result.get("ai_sif_score", 25),
        "ai_confidence": sif_result.get("ai_confidence", 85.0),
        "contributing_features": sif_result.get("contributing_features", []),
        "score_breakdown": sif_result.get("score_breakdown", {}),
        "override_rule_applied": sif_result.get("override_rule_applied"),
        "life_saving_rule": lsr_match,
        "extracted_entities": extracted_info,
        "explanation": explanation
    }
