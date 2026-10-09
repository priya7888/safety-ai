from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine, ensure_database_schema
from .models.organization import Organization
from .models.user import User
from .models.safety_report import SafetyReport
from .models.ai_analysis import AIAnalysis
from .models.feedback import Feedback
from .ai_services.ai_service import analyze_safety_report
from .routers.auth import ensure_initial_seed

def seed_sample_data():
    """
    Initializes database schema, seeds the 4 Admins and 40 Workers,
    and populates initial realistic geolocated incidents across the 4 zones.
    """
    # 1. Create tables and ensure columns exist
    Base.metadata.create_all(bind=engine)
    ensure_database_schema()

    db = SessionLocal()
    try:
        # 2. Seed 4 admins and 40 allocated workers (10 per admin)
        ensure_initial_seed(db)

        # 3. If no reports exist, seed realistic geolocated incidents for workers
        report_count = db.query(SafetyReport).count()
        if report_count == 0:
            seed_initial_incidents(db)
    finally:
        db.close()

def seed_initial_incidents(db: Session):
    """Populates realistic incidents mapped to workers across the 4 industrial operational zones."""
    from .services.report_service import generate_report_reference

    workers = db.query(User).filter(User.role == "NORMAL_USER").all()
    worker_by_email = {w.email: w for w in workers}

    sample_incidents = [
        # Zone 1: Rig Operations (Supervised by Admin 1)
        {
            "worker_email": "worker1@gmail.com",
            "type": "NEAR_MISS",
            "desc": "High-pressure mud line pulsating violently at 280 bar; relief valve bypass tag was removed without authorization while crew operated on drill floor.",
            "loc": "Rig Alpha - Drill Floor",
            "lat": 27.3892,
            "lng": 95.6315,
            "site_name": "Drill Floor Substructure",
            "address": "Rig Alpha, Digboi Oil Field Block 4",
            "hazard": "High-Pressure Gas & Fluid Discharge",
            "energy": "Pressurized Fluid / Hydraulic",
            "exposure": "Direct worker line of fire exposure",
            "barrier": "Bypassed Pressure Relief Valve",
            "sif": "YES",
            "score": 82
        },
        {
            "worker_email": "worker2@gmail.com",
            "type": "UNSAFE_CONDITION",
            "desc": "Worker entered mud pit cellar without continuous atmospheric gas monitoring or standby watchman present.",
            "loc": "Rig Alpha - Cellar Pit",
            "lat": 27.3881,
            "lng": 95.6302,
            "site_name": "Mud Pit Enclosure",
            "address": "Cellar Pit #2, Rig Alpha",
            "hazard": "Toxic / Flammable Gas Atmosphere",
            "energy": "Chemical / Toxic Vapor",
            "exposure": "Unmonitored confined space entry",
            "barrier": "Missing continuous gas detector & watchman",
            "sif": "YES",
            "score": 86
        },
        {
            "worker_email": "worker3@gmail.com",
            "type": "UNSAFE_ACT",
            "desc": "Derrickman observed climbing monkey board ladder 24m above rig floor with lanyard unhooked.",
            "loc": "Rig Alpha - Derrick Tower",
            "lat": 27.3899,
            "lng": 95.6322,
            "site_name": "Monkey Board Level 24m",
            "address": "Derrick Tower, Rig Alpha",
            "hazard": "Fall from Height",
            "energy": "Gravitational Energy",
            "exposure": "Working at height without tie-off",
            "barrier": "Unhooked dual safety harness",
            "sif": "YES",
            "score": 84
        },
        {
            "worker_email": "worker4@gmail.com",
            "type": "UNSAFE_CONDITION",
            "desc": "Small rainwater puddle on walkway near tool house; no oil or trip hazards observed.",
            "loc": "Rig Alpha - Walkway",
            "lat": 27.3875,
            "lng": 95.6291,
            "site_name": "Tool House Walkway",
            "address": "Camp Area Walkway, Rig Alpha",
            "hazard": "Slip / Trip on Level Surface",
            "energy": "Low Kinetic Energy",
            "exposure": "Brief transit exposure",
            "barrier": "Textured rubber floor mat present",
            "sif": "NO",
            "score": 15
        },

        # Zone 2: Refinery Processing (Supervised by Admin 2)
        {
            "worker_email": "worker11@gmail.com",
            "type": "UNSAFE_CONDITION",
            "desc": "Electrician found touching terminal strip while 11kV pump motor switchgear was energized with defective lockout padlocks.",
            "loc": "Refinery Unit 2 - Substation 4",
            "lat": 27.3940,
            "lng": 95.6360,
            "site_name": "High Voltage Switchgear Bay",
            "address": "Substation 4, CDU Complex",
            "hazard": "Electrical Arc Flash & Contact",
            "energy": "High Voltage Electrical (11kV)",
            "exposure": "Direct live conductor exposure",
            "barrier": "Bypassed / Missing LOTO locks",
            "sif": "YES",
            "score": 88
        },
        {
            "worker_email": "worker12@gmail.com",
            "type": "NEAR_MISS",
            "desc": "Overhead gantry crane swung 8-ton heat exchanger bundle directly above two pipefitters working on the platform below.",
            "loc": "Refinery Unit 2 - Crude Distillation",
            "lat": 27.3955,
            "lng": 95.6375,
            "site_name": "Heat Exchanger Bay #3",
            "address": "Process Column Unit 2, North Yard",
            "hazard": "Suspended Load & Rigging Drop",
            "energy": "Suspended Gravitational Mass (8 Tons)",
            "exposure": "Workers inside drop zone line-of-fire",
            "barrier": "Missing exclusion zone barricade",
            "sif": "YES",
            "score": 84
        },
        {
            "worker_email": "worker13@gmail.com",
            "type": "UNSAFE_CONDITION",
            "desc": "Minor insulation tear on steam line outer cladding; surface temperature 38C.",
            "loc": "Refinery Unit 2 - Utility Yard",
            "lat": 27.3930,
            "lng": 95.6345,
            "site_name": "Steam Header Corridor",
            "address": "Low Pressure Steam Pipe Rack",
            "hazard": "Thermal Heat Contact",
            "energy": "Low Thermal Energy",
            "exposure": "Intermittent pedestrian walkway",
            "barrier": "Outer aluminum sheeting intact",
            "sif": "NO",
            "score": 20
        },

        # Zone 3: Pipeline Transmission (Supervised by Admin 3)
        {
            "worker_email": "worker21@gmail.com",
            "type": "NEAR_MISS",
            "desc": "Main trunkline gas pipeline block valve station flange whistling with high-pressure natural gas leak at 65 bar near vehicular crossing.",
            "loc": "Trunkline KP-45",
            "lat": 27.4100,
            "lng": 95.6550,
            "site_name": "Block Valve Station BV-04",
            "address": "Gas Transmission ROW KM 45.2",
            "hazard": "Pressurized Flammable Gas Release",
            "energy": "65 Bar Pressurized Methane Gas",
            "exposure": "Vehicle roadway ignition source proximity",
            "barrier": "Emergency Shutdown Valve unactuated",
            "sif": "YES",
            "score": 85
        },
        {
            "worker_email": "worker22@gmail.com",
            "type": "UNSAFE_CONDITION",
            "desc": "Excavation crew dug 2.8m deep pipe inspection trench with vertical un-shored earth walls during active monsoon showers.",
            "loc": "Pipeline Sector North",
            "lat": 27.4130,
            "lng": 95.6580,
            "site_name": "Trench Integrity Dig #12",
            "address": "Pipeline ROW Section 3B",
            "hazard": "Trench Cave-In / Engulfment",
            "energy": "Soil Structural Instability",
            "exposure": "2 Workers inside trench bottom",
            "barrier": "No trench box or shoring shields",
            "sif": "YES",
            "score": 80
        },

        # Zone 4: Hazmat Storage (Supervised by Admin 4)
        {
            "worker_email": "worker31@gmail.com",
            "type": "NEAR_MISS",
            "desc": "Crude storage tank floating roof seal failed during filling operation; heavy hydrocarbon vapors detected at 60% LEL around tank rim stairway.",
            "loc": "Terminal Tank Farm",
            "lat": 27.4250,
            "lng": 95.6700,
            "site_name": "Crude Tank TK-104",
            "address": "Tank Farm Terminal West, Hazmat Zone",
            "hazard": "Vapor Cloud Explosion / Fire Blast",
            "energy": "Hydrocarbon Vapor Atmosphere (60% LEL)",
            "exposure": "Workers conducting gauging on roof stairway",
            "barrier": "Foam pourer system on standby",
            "sif": "YES",
            "score": 90
        },
        {
            "worker_email": "worker32@gmail.com",
            "type": "UNSAFE_CONDITION",
            "desc": "Secondary containment bund drain valve found wedged open with wooden stick allowing potential unmonitored chemical runoff.",
            "loc": "Terminal Hazmat Yard",
            "lat": 27.4270,
            "lng": 95.6720,
            "site_name": "Chemical Dosing Bund #2",
            "address": "Caustic & Demulsifier Storage Facility",
            "hazard": "Chemical Spill / Loss of Containment",
            "energy": "Chemical Runoff",
            "exposure": "Environmental perimeter drainage",
            "barrier": "Compromised Bund Isolation Valve",
            "sif": "NO",
            "score": 38
        }
    ]

    for item in sample_incidents:
        w_user = worker_by_email.get(item["worker_email"])
        if not w_user:
            continue
        
        ref = generate_report_reference(db, w_user.organization_id)
        rep = SafetyReport(
            report_reference=ref,
            organization_id=w_user.organization_id,
            user_id=w_user.id,
            assigned_admin_id=w_user.assigned_admin_id,
            report_type=item["type"],
            description=item["desc"],
            original_description=item["desc"],
            normalized_description=item["desc"],
            location=item["loc"],
            report_date="2026-10-09",
            incident_latitude=item["lat"],
            incident_longitude=item["lng"],
            incident_location_name=item["site_name"],
            incident_address=item["address"],
            analysis_status="COMPLETED"
        )
        db.add(rep)
        db.commit()
        db.refresh(rep)

        # Create AI Analysis record
        analysis = AIAnalysis(
            report_id=rep.id,
            organization_id=w_user.organization_id,
            analysis_context="Automated Field SIF Extraction",
            identified_hazard=item["hazard"],
            energy_source=item["energy"],
            exposure=item["exposure"],
            barrier_information=item["barrier"],
            sif_precursor_assessment=item["sif"],
            explanation=f"Identified hazard: {item['hazard']}. Energy Vector: {item['energy']}. Barrier evaluation: {item['barrier']}."
        )
        db.add(analysis)
        db.commit()


