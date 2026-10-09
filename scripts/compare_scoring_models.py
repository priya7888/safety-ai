"""
Scoring Model Comparison Script
================================
Runs 50+ diverse industrial safety observations through:
1. Legacy Additive MAUT Model (H+E+X+B+S with piecewise discontinuous scaler)
2. New Gated Monotonic Model (gated utilities, continuous monotonic mapping, safety-critical floor overrides)

Prints a comparative breakdown table and analysis of differences.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.ai_services.sif_assessment import compute_maut_risk_score, get_risk_tier
from app.ai_services.hazard_detection import detect_hazard, detect_all_hazards
from app.ai_services.energy_exposure_analysis import analyze_energy_and_exposure
from app.ai_services.barrier_analysis import analyze_barriers

SAMPLE_OBSERVATIONS = [
    # Group 1: Critical High Pressure & Blowout (Cases 1-5)
    "High-pressure 3000 psi hydraulic line flange ruptured spraying fluid with operator in direct line of fire.",
    "350 bar gas compressor discharge line vibrating violently with flange bolts loose near walkway.",
    "High-pressure test manifold valve bypassed without bleed-off while technicians stood adjacent to line.",
    "Pneumatic line pressure regulator failed causing hose whip in active workshop bay.",
    "Wellhead flowline 60 bar gas seep detected inside automated unmanned enclosure with zero exposure to workers.",

    # Group 2: Critical High-Voltage Electrical & Arc Flash (Cases 6-10)
    "Electrician touching energized 11kV busbar terminal inside live switchgear panel without insulated tools.",
    "415V distribution board short circuit created arc flash explosion while technician opened panel door.",
    "Water leaking directly onto live electrical motor control center with exposed 480V terminals.",
    "Contractor working on live electrical circuit without verifying zero voltage or locking out breaker.",
    "Overhead high-voltage 33kV power line clearance compromised by mobile crane boom during lift.",

    # Group 3: Confined Space & Toxic Gas Inhalation (Cases 11-15)
    "Worker entered crude storage tank confined space without permit and without atmospheric gas testing.",
    "H2S gas alarm sounded at 45 ppm inside sewage pit while two workers performed cleaning.",
    "Nitrogen purge vessel entry conducted with oxygen deficiency alarm ignored by entrant.",
    "Manhole sewer entry without standby watchman, retrieval harness, or continuous ventilation.",
    "Confined space vessel entry conducted under approved permit with zero gas detected and continuous fresh air supply.",

    # Group 4: Suspended Loads & Heavy Rigging (Cases 16-20)
    "Rigger stood directly beneath 8-ton suspended pipe spool as crane winch slipped suddenly.",
    "Crane hoist lifting 12-ton compressor module over occupied fabrication tent in windy conditions.",
    "Overhead gantry crane wire rope showed broken strands while carrying molten metal ladle.",
    "Forklift carrying unstrapped steel beams tilted on ramp with personnel walking in drop zone.",
    "Crane lifting pipe bundle over fully barricaded exclusion zone with zero personnel allowed inside drop perimeter.",

    # Group 5: Working at Height & Fall from Elevation (Cases 21-25)
    "Pipefitter working on scaffold platform at 8m height without safety harness tie-off and missing top rail.",
    "Worker climbed roof edge 6m above ground with no anchor point, no lanyard, and wet metal sheets.",
    "Damaged grating on 4th floor platform gave way beneath worker's foot, caught by harness lanyard.",
    "Mobile elevated work platform (MEWP) operated at 10m height near power lines with gate tied open.",
    "Worker at 12m height properly tied off to engineered lifeline with certified harness and intact dual lanyards.",

    # Group 6: Fire, Explosion & Hot Work (Cases 26-30)
    "Welder operated cutting torch adjacent to open solvent drum causing immediate vapor flash fire.",
    "Hot work welding performed inside gas metering skid without continuous LEL combustible gas monitoring.",
    "Diesel fuel transfer hose leaked 200 liters near running exhaust manifold of generator.",
    "LPG cylinder valve leaking propane gas inside enclosed unventilated maintenance shack.",
    "Hot work welding performed with certified hot work permit, 10m clearance, fire blanket, and stationed fire watch.",

    # Group 7: Mobile Equipment & Pedestrian Interactions (Cases 31-35)
    "Heavy forklift reversing at speed in blind warehouse corridor narrowly missed striking pedestrian.",
    "Excavator swung counterweight into pedestrian walkway with missing barricade and non-functioning horn.",
    "Dump truck reversed toward dump pit edge without spotter or wheel stop berm.",
    "Front loader driver operating while distracted by mobile phone near personnel muster point.",
    "Automated guided vehicle traveling at 3 km/h along marked designated green floor transit aisle.",

    # Group 8: Hazardous Chemicals & Corrosive Substances (Cases 36-40)
    "Sulfuric acid 98% dosing pump seal failed, spraying corrosive liquid into worker face without visor.",
    "Chemical transfer line disconnected while under pressure, splashing solvent onto operator clothing.",
    "Chlorine gas cylinder connection leaking green gas vapor inside water treatment room.",
    "Caustic soda drum punctured by forklift fork, liquid pooling near floor drain.",
    "Laboratory technician pouring 50ml diluted bleach inside certified chemical fume hood with gloves and goggles.",

    # Group 9: Lockout/Tagout (LOTO) & Stored Energy Isolation (Cases 41-45)
    "Mechanic servicing rotary valve pump while electric motor was energized and LOTO was bypassed.",
    "Technician changed hydraulic filter without depressurizing accumulator or applying isolation tags.",
    "Conveyor belt maintenance performed with emergency stop button used instead of positive LOTO lock.",
    "Contractor removed guard on drive coupling while machine was running to inspect bearing noise.",
    "Full Lockout/Tagout applied with padlocks, hasps, danger tags, and zero-energy test verified before pump service.",

    # Group 10: Slips, Trips, Falls on Same Level (Cases 46-50)
    "Water puddle from drinking fountain on tile floor near administration office doorway.",
    "Small oil drip on workshop floor caused worker to slip and momentarily stumble before catching balance.",
    "Loose extension cord stretched across pedestrian corridor creating trip hazard.",
    "Rainwater accumulated on entrance rubber mat making surface slick for incoming visitors.",
    "Minor grease smudge on concrete walkway marked with yellow warning cone awaiting janitor cleanup.",

    # Group 11: Minor Housekeeping & Environmental Deviations (Cases 51-55)
    "Cardboard packing boxes stacked neatly near warehouse exit but not obstructing aisle.",
    "Fluorescent overhead tube light flickering in spare parts storage mezzanine aisle.",
    "Worker observed not wearing safety glasses while walking through designated storage aisle.",
    "Empty plastic water bottle discarded near emergency eyewash station.",
    "Pallet jack parked in corner of receiving bay without chocks on level concrete floor."
]


def run_comparison():
    print("=" * 130)
    print("COMPREHENSIVE SIF RISK SCORING MODEL COMPARISON (50+ INDUSTRIAL OBSERVATIONS)")
    print("Legacy Model: Additive H+E+X+B+S (Discontinuous Scaler)  |  New Model: Gated Monotonic + Safety Overrides")
    print("=" * 130)
    header = f"{'#':<3} | {'Observation Text (Excerpt)':<45} | {'Old':<4} | {'Old Tier':<10} | {'New':<4} | {'New Tier':<10} | {'Delta':<5} | {'Override Rule Applied / Key Driver':<35}"
    print(header)
    print("-" * 130)

    old_scores = []
    new_scores = []
    overrides_fired = 0
    zero_gated_count = 0
    tier_shifts = {"same": 0, "higher": 0, "lower": 0}

    for idx, text in enumerate(SAMPLE_OBSERVATIONS, 1):
        # NLP feature extraction
        haz = detect_hazard(text)
        all_haz = detect_all_hazards(text)
        ee = analyze_energy_and_exposure(text)
        be = analyze_barriers(text)

        # 1. Run Legacy Model
        old_score, old_b = compute_maut_risk_score(
            hazard=haz,
            energy_source=ee.get("energy_source"),
            exposure=ee.get("exposure"),
            barrier_status=be.get("status", "BARRIER_INSUFFICIENT_INFO"),
            text=text,
            all_hazards=all_haz,
            all_energy_sources=ee.get("all_energy_sources", []),
            legacy_scoring=True,
            return_breakdown=True
        )

        # 2. Run New Gated Monotonic Model
        new_score, new_b = compute_maut_risk_score(
            hazard=haz,
            energy_source=ee.get("energy_source"),
            exposure=ee.get("exposure"),
            barrier_status=be.get("status", "BARRIER_INSUFFICIENT_INFO"),
            text=text,
            all_hazards=all_haz,
            all_energy_sources=ee.get("all_energy_sources", []),
            legacy_scoring=False,
            return_breakdown=True
        )

        old_tier = get_risk_tier(old_score)
        new_tier = new_b["risk_tier"]
        delta = new_score - old_score

        old_scores.append(old_score)
        new_scores.append(new_score)

        if new_b.get("override_rule_applied"):
            overrides_fired += 1
            rule_disp = new_b["override_rule_applied"].replace(" Floor Override", "")
        elif new_b.get("exposure_utility", 1.0) == 0.0:
            zero_gated_count += 1
            rule_disp = "Gated: Zero Worker Exposure"
        elif new_b.get("barrier_effectiveness", 0.0) >= 0.85:
            rule_disp = "Gated: Active Barrier Defense"
        elif new_b.get("energy_utility", 0.5) <= 0.20:
            rule_disp = "Gated: Low Energy Vector"
        else:
            rule_disp = "Monotonic Likelihood Evaluation"

        # Track tier shifts
        tier_ranks = {"Low": 1, "Moderate": 2, "High": 3, "Very High": 4, "Critical": 5}
        if tier_ranks[new_tier] == tier_ranks[old_tier]:
            tier_shifts["same"] += 1
        elif tier_ranks[new_tier] > tier_ranks[old_tier]:
            tier_shifts["higher"] += 1
        else:
            tier_shifts["lower"] += 1

        excerpt = (text[:42] + "...") if len(text) > 45 else text
        delta_str = f"+{delta}" if delta > 0 else str(delta)
        row = f"{idx:<3} | {excerpt:<45} | {old_score:<4} | {old_tier:<10} | {new_score:<4} | {new_tier:<10} | {delta_str:<5} | {rule_disp[:35]:<35}"
        print(row)

    print("-" * 130)
    print("SUMMARY COMPARISON STATISTICS:")
    print(f"Total Observations Evaluated:  {len(SAMPLE_OBSERVATIONS)}")
    print(f"Legacy Model Average Score:    {sum(old_scores) / len(old_scores):.1f} / 100")
    print(f"New Model Average Score:       {sum(new_scores) / len(new_scores):.1f} / 100")
    print(f"Named Safety Overrides Fired:  {overrides_fired} times (ensuring non-negotiable Critical/Very High floors)")
    print(f"Zero-Exposure Gating Events:   {zero_gated_count} times (preventing false alarms on unoccupied assets)")
    print(f"Tier Agreement:                {tier_shifts['same']}/{len(SAMPLE_OBSERVATIONS)} ({tier_shifts['same']/len(SAMPLE_OBSERVATIONS)*100:.1f}%)")
    print(f"Tier Elevated (Safer):         {tier_shifts['higher']}/{len(SAMPLE_OBSERVATIONS)}")
    print(f"Tier Reduced (De-noised):      {tier_shifts['lower']}/{len(SAMPLE_OBSERVATIONS)} (correctly filtering minor slips & intact barriers)")
    print("=" * 130)


if __name__ == "__main__":
    run_comparison()
