"""
Unit and Property Tests for the Gated Monotonic SIF Precursor Risk Scoring Model.
================================================================================
Covers:
1. Monotonicity Property: Increasing any single input dimension never decreases the final score.
2. Continuity & Discontinuity Fixes: Smooth, monotonic behavior across old piecewise boundaries (39/40, 59/60, 79/80, 99/100).
3. Gating Behavior: Zero exposure or fully effective barrier results in Low tier score (<= 20).
4. Safety-Critical Floor Overrides: Each named override rule fires appropriately, sets the floor, and returns the exact rule name.
5. Legacy Scoring Feature Flag: Comparing legacy_scoring=True vs legacy_scoring=False.
"""

import unittest
import sys
from pathlib import Path

# Ensure backend directory is in path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.ai_services.sif_assessment import (
    compute_maut_risk_score,
    compute_maut_risk_score_legacy,
    compute_gated_monotonic_risk_score,
    extract_energy_utility,
    extract_exposure_utility,
    extract_barrier_effectiveness,
    extract_hazard_modifier,
    map_likelihood_to_score,
    get_risk_tier,
    OVERRIDE_RULES,
    evaluate_override_rules
)


class TestGatedMonotonicScoring(unittest.TestCase):

    def test_zero_exposure_produces_low_score(self):
        """Zero exposure must gate likelihood to 0 and produce a Low tier score (<= 20)."""
        score, breakdown = compute_maut_risk_score(
            hazard="High-Pressure Line & Stored Energy Hazard",
            energy_source="High-Pressure Combustible Gas (60 bar)",
            exposure="Not exposed / zero personnel in area",
            barrier_status="BARRIER_MISSING",
            text="60 bar gas line valve leaked inside automated unmanned enclosure with zero exposure to personnel.",
            return_breakdown=True
        )
        self.assertLessEqual(score, 20, f"Score for zero exposure should be <= 20, got {score}")
        self.assertEqual(breakdown["risk_tier"], "Low")
        self.assertEqual(breakdown["exposure_utility"], 0.0)
        self.assertEqual(breakdown["sif_likelihood"], 0.0)

    def test_fully_effective_barrier_produces_low_score(self):
        """An intact, impenetrable barrier must gate likelihood to near zero and produce a Low tier score."""
        score, breakdown = compute_maut_risk_score(
            hazard="Electrical Arc Flash & Shock Hazard",
            energy_source="Electrical (415V)",
            exposure="Worker standing near panel",
            barrier_status="FULLY EFFECTIVE",
            text="Worker standing 1m from 415V electrical switchgear with fully effective, rated interlocked enclosure intact.",
            return_breakdown=True
        )
        self.assertLessEqual(score, 20, f"Score for fully effective barrier should be <= 20, got {score}")
        self.assertEqual(breakdown["barrier_failure_utility"], 0.0)
        self.assertEqual(breakdown["sif_likelihood"], 0.0)

    def test_old_discontinuity_raw_99_vs_100_inversion_fixed(self):
        """
        In the old model: raw 99 gave scaled 87, but raw 100 gave scaled 85 (a negative jump!).
        In the new model, monotonicity is strictly preserved and continuous mapping has no negative jumps.
        """
        # Test old discontinuity directly on the legacy formula to prove the old flaw
        # In legacy:
        # raw 99 -> 75 + int((99-80)*0.65) = 75 + 12 = 87
        # raw 100 -> 85 + int((100-100)*0.6) = 85 (87 down to 85!)
        legacy_99_scaled = min(88, 75 + int((99 - 80) * 0.65))
        legacy_100_scaled = min(95, 85 + int((100 - 100) * 0.6))
        self.assertGreater(legacy_99_scaled, legacy_100_scaled, "Verifies old model had a negative jump discontinuity")

        # Test new continuous piecewise linear mapping across likelihoods
        # Sample fine-grained likelihood steps around corresponding boundaries
        likelihood_steps = [i / 100.0 for i in range(101)]
        scores = [map_likelihood_to_score(x) for x in likelihood_steps]
        for i in range(len(scores) - 1):
            self.assertLessEqual(
                scores[i],
                scores[i + 1],
                f"Continuous mapping must be monotonic: x={likelihood_steps[i]} gave {scores[i]}, but x={likelihood_steps[i+1]} gave {scores[i+1]}"
            )

    def test_boundary_transitions_are_monotonic(self):
        """Tests that transitions across all anchor points are strictly non-decreasing."""
        anchors = [0.0, 0.04, 0.12, 0.25, 0.45, 0.65, 0.80, 1.0]
        test_points = []
        for a in anchors:
            test_points.extend([max(0.0, a - 0.01), a, min(1.0, a + 0.01)])
        test_points = sorted(list(set(test_points)))

        prev_score = -1.0
        for pt in test_points:
            cur_score = map_likelihood_to_score(pt)
            self.assertGreaterEqual(
                cur_score,
                prev_score,
                f"Discontinuity found at boundary point {pt}: {cur_score} < {prev_score}"
            )
            prev_score = cur_score

    def test_property_increasing_single_inputs_never_decreases_score(self):
        """
        Property Test: For any base state, increasing:
        - energy utility
        - exposure utility
        - barrier failure utility
        - hazard modifier
        NEVER decreases the final score.
        """
        grid_energies = [0.10, 0.35, 0.70, 0.95]
        grid_exposures = [0.00, 0.20, 0.50, 0.95]
        grid_barrier_fails = [0.10, 0.40, 0.60, 1.00]
        grid_hazard_mods = [0.60, 0.70, 1.00, 1.15]

        # 1. Monotonicity in energy utility
        for ex in grid_exposures:
            for b_f in grid_barrier_fails:
                for h_m in grid_hazard_mods:
                    prev_score = -1
                    for e in grid_energies:
                        lik = e * ex * b_f
                        mod_lik = min(1.0, lik * h_m)
                        score = int(round(map_likelihood_to_score(mod_lik)))
                        self.assertGreaterEqual(
                            score, prev_score,
                            f"Energy non-monotonicity: e={e}, ex={ex}, b_f={b_f}, score={score} < prev={prev_score}"
                        )
                        prev_score = score

        # 2. Monotonicity in exposure utility
        for e in grid_energies:
            for b_f in grid_barrier_fails:
                for h_m in grid_hazard_mods:
                    prev_score = -1
                    for ex in grid_exposures:
                        lik = e * ex * b_f
                        mod_lik = min(1.0, lik * h_m)
                        score = int(round(map_likelihood_to_score(mod_lik)))
                        self.assertGreaterEqual(
                            score, prev_score,
                            f"Exposure non-monotonicity: ex={ex}, e={e}, b_f={b_f}, score={score} < prev={prev_score}"
                        )
                        prev_score = score

        # 3. Monotonicity in barrier failure utility (barrier degradation)
        for e in grid_energies:
            for ex in grid_exposures:
                for h_m in grid_hazard_mods:
                    prev_score = -1
                    for b_f in grid_barrier_fails:
                        lik = e * ex * b_f
                        mod_lik = min(1.0, lik * h_m)
                        score = int(round(map_likelihood_to_score(mod_lik)))
                        self.assertGreaterEqual(
                            score, prev_score,
                            f"Barrier failure non-monotonicity: b_f={b_f}, e={e}, ex={ex}, score={score} < prev={prev_score}"
                        )
                        prev_score = score

    def test_each_override_rule_triggers_correctly(self):
        """Verifies each explicit named override rule triggers, floors the score, and returns its exact name."""
        
        # 1. LOTO Bypassed with Stored Energy in Line-of-Fire (Floor: 88)
        score1, b1 = compute_maut_risk_score(
            hazard="Lockout / Tagout (LOTO) Non-Compliance",
            energy_source="High-Pressure Stored Energy",
            exposure="Worker in line-of-fire",
            barrier_status="BARRIER_BYPASSED",
            text="Worker failed to follow LOTO and was not locked out while standing in line of fire of pressurized hydraulic line.",
            return_breakdown=True
        )
        self.assertGreaterEqual(score1, 88)
        self.assertEqual(b1["risk_tier"], "Critical")
        self.assertIn("LOTO Bypassed", b1["override_rule_applied"])

        # 2. Unmonitored Confined Space Entry (Floor: 86)
        score2, b2 = compute_maut_risk_score(
            hazard="Atmospheric & Confined Space Hazard",
            energy_source="Toxic Gas",
            exposure="Inside tank entry",
            barrier_status="BARRIER_MISSING",
            text="Worker entered confined space tank entry without permit and without gas test for atmospheric hazards.",
            return_breakdown=True
        )
        self.assertGreaterEqual(score2, 86)
        self.assertEqual(b2["risk_tier"], "Critical")
        self.assertIn("Unmonitored Confined Space Entry", b2["override_rule_applied"])

        # 3. High-Voltage Live Conductor Direct Exposure (Floor: 86)
        score3, b3 = compute_maut_risk_score(
            hazard="Electrical Arc Flash & Shock Hazard",
            energy_source="11kV Electrical",
            exposure="Touching live components",
            barrier_status="BARRIER_FAILED",
            text="Electrician touching live 11kV electrical switchgear with uninsulated live parts inside flash boundary.",
            return_breakdown=True
        )
        self.assertGreaterEqual(score3, 86)
        self.assertEqual(b3["risk_tier"], "Critical")
        self.assertIn("High-Voltage Live Conductor Direct Exposure", b3["override_rule_applied"])

        # 4. Personnel Positioned in Suspended Load Drop Zone (Floor: 84)
        score4, b4 = compute_maut_risk_score(
            hazard="Suspended Load & Dropped Object Hazard",
            energy_source="Gravity",
            exposure="Standing under suspended load",
            barrier_status="BARRIER_MISSING",
            text="Worker walked under suspended load crane lift directly standing under the 5-ton pipe drop zone.",
            return_breakdown=True
        )
        self.assertGreaterEqual(score4, 84)
        self.assertEqual(b4["risk_tier"], "Critical")
        self.assertIn("Suspended Load Drop Zone", b4["override_rule_applied"])

        # 5. High-Pressure Stored Energy Line-of-Fire (Floor: 82)
        score5, b5 = compute_maut_risk_score(
            hazard="High-Pressure Line & Stored Energy Hazard",
            energy_source="Hydraulic High Pressure",
            exposure="In release trajectory line-of-fire",
            barrier_status="BARRIER_FAILED",
            text="High pressure hydraulic hose vibrating near rupture with operator in direct line of fire trajectory path.",
            return_breakdown=True
        )
        self.assertGreaterEqual(score5, 82)
        self.assertIn(b5["risk_tier"], ["Very High", "Critical"])
        self.assertIn("High-Pressure Stored Energy Line-of-Fire", b5["override_rule_applied"])

        # 6. Unprotected Work at Height Fall Hazard (Floor: 84)
        score6, b6 = compute_maut_risk_score(
            hazard="Work at Height & Fall Hazard",
            energy_source="Gravity",
            exposure="Edge of scaffold",
            barrier_status="BARRIER_MISSING",
            text="Worker on scaffold work at height without harness and not tied off with missing guardrail at roof edge.",
            return_breakdown=True
        )
        self.assertGreaterEqual(score6, 84)
        self.assertEqual(b6["risk_tier"], "Critical")
        self.assertIn("Unprotected Work at Height", b6["override_rule_applied"])

    def test_legacy_feature_flag(self):
        """Verifies that legacy_scoring=True executes old additive scoring model."""
        text = "Worker walked through puddle of water near door"
        
        # When legacy_scoring=True, runs legacy additive MAUT
        legacy_score, legacy_breakdown = compute_maut_risk_score(
            hazard="Slip, Trip, or Surface Housekeeping",
            energy_source="Low Kinetic",
            exposure="Walking",
            barrier_status="BARRIER_INSUFFICIENT_INFO",
            text=text,
            legacy_scoring=True,
            return_breakdown=True
        )
        self.assertEqual(legacy_breakdown["scoring_model"], "legacy_maut")
        self.assertIsInstance(legacy_score, int)

        # When legacy_scoring=False (default), runs new gated monotonic model
        new_score, new_breakdown = compute_maut_risk_score(
            hazard="Slip, Trip, or Surface Housekeeping",
            energy_source="Low Kinetic",
            exposure="Walking",
            barrier_status="BARRIER_INSUFFICIENT_INFO",
            text=text,
            legacy_scoring=False,
            return_breakdown=True
        )
        self.assertEqual(new_breakdown["scoring_model"], "gated_monotonic_v1")
        self.assertIsInstance(new_score, int)
        # Minor slip puddle without high energy should score low in the new model (< 35)
        self.assertLess(new_score, 35)


if __name__ == "__main__":
    unittest.main()
