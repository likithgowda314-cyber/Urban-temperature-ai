import json
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

import models
from database import engine, SessionLocal
from ml_engine import predictor

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = Flask(__name__)

# Enable CORS to allow access from local/production frontends
CORS(app)

# ORM session lifecycle hooks
@app.before_request
def before_request():
    request.db = SessionLocal()

@app.after_request
def after_request(response):
    if hasattr(request, "db"):
        request.db.close()
    return response

# Interventions specifications configuration
INTERVENTIONS = {
    "cool_roof": {
        "key": "cool_roof",
        "name": "High-Albedo Cool Roof Coating",
        "lstImpact": 1.8,
        "ndviImpact": 0.02,
        "densityImpact": 0,
        "budgetTier": "Low",
        "cost": "₹2.5 Lakh / ward block",
        "details": "Applies reflective paint to concrete roof slabs to maximize solar reflectance (SRI > 78)."
    },
    "miyazaki": {
        "key": "miyazaki",
        "name": "Miyawaki Urban Afforestation",
        "lstImpact": 3.5,
        "ndviImpact": 0.45,
        "densityImpact": -10,
        "budgetTier": "High",
        "cost": "₹12.0 Lakh / ward block",
        "details": "Establishes rapid-growth multi-layered native forests to build shaded cooling micro-canopies."
    },
    "green_roof": {
        "key": "green_roof",
        "name": "Green Vegetated Roofs",
        "lstImpact": 2.5,
        "ndviImpact": 0.22,
        "densityImpact": -5,
        "budgetTier": "Medium",
        "cost": "₹7.5 Lakh / ward block",
        "details": "Installs soil substrate and drought-tolerant sedum plants on flat roofs to absorb thermal load."
    },
    "wetland": {
        "key": "wetland",
        "name": "Wetland & Water Body Revival",
        "lstImpact": 4.2,
        "ndviImpact": 0.10,
        "densityImpact": -15,
        "budgetTier": "High",
        "cost": "₹22.0 Lakh / ward block",
        "details": "Restores silted municipal ponds, constructing surrounding bio-filters to promote evaporative cooling."
    }
}

# --- Database Seeding Logic ---
def seed_database():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        city_count = db.query(models.City).count()
        if city_count > 0:
            return

        print("Seeding database with default Indian cities and 10x10 UHI grids...")
        
        cities = [
            models.City(
                key="delhi",
                name="Delhi NCT",
                description="National Capital Territory. Characterized by severe surface warming, heavy commercial density, and low green cover leading to severe heat domes."
            ),
            models.City(
                key="bengaluru",
                name="Bengaluru (Silicon Valley)",
                description="The Garden City of India. Undergoing rapid vertical development and lake depletion, expanding urban heat islands into tech hubs."
            ),
            models.City(
                key="ahmedabad",
                name="Ahmedabad Industrial",
                description="Western industrial center. Historically vulnerable to high temperatures. Implementing targeted cool-roof policies to mitigate heat risk."
            )
        ]

        for city in cities:
            db.add(city)
        db.commit()

        # Seed 10x10 grids centered around each city
        city_centers = {
            "delhi": (28.6139, 77.2090),
            "bengaluru": (12.9716, 77.5946),
            "ahmedabad": (23.0225, 72.5714)
        }

        wards = {
            "delhi": ["Connaught Place", "Karol Bagh", "Dwarka", "Okhla", "Rohini", "Chandni Chowk", "Vasant Kunj", "Saket", "Mayur Vihar", "Rajouri Garden"],
            "bengaluru": ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "Malleshwaram", "Yelahanka", "HSR Layout", "Electronic City", "Marathahalli", "BTM Layout"],
            "ahmedabad": ["Kalupur", "Satellite", "Navrangpura", "Maninagar", "Vastrapur", "Sabarmati", "Ghatlodia", "Bapunagar", "Paldi", "Asarwa"]
        }

        lulcs = ["Commercial", "Residential High-Density", "Industrial Area", "Urban Forest", "Water Body", "Open Soil"]
        cell_size = 0.011

        for city_key, center in city_centers.items():
            center_lat, center_lng = center
            current_wards = wards[city_key]

            for r in range(10):
                for c in range(10):
                    cell_id = f"{city_key[:2].upper()}-R{r}-C{c}"
                    
                    min_lat = center_lat + (r - 5) * cell_size
                    max_lat = min_lat + cell_size
                    min_lng = center_lng + (c - 5) * cell_size
                    max_lng = min_lng + cell_size
                    bounds = [[min_lat, min_lng], [max_lat, max_lng]]

                    # Deterministic values matching frontend math
                    hash_val = math.sin(r * 12.9898 + c * 78.233) * 43758.5453
                    random_val = hash_val - math.floor(hash_val)

                    ward = current_wards[int(random_val * len(current_wards))]
                    lulc = lulcs[int(random_val * len(lulcs))]

                    base_lst = 35.0
                    ndvi = 0.15
                    density = 75

                    if lulc == "Water Body":
                        base_lst = 27.5
                        ndvi = 0.08
                        density = 5
                    elif lulc == "Urban Forest":
                        base_lst = 29.5
                        ndvi = 0.68
                        density = 8
                    elif lulc == "Commercial":
                        base_lst = 41.2
                        ndvi = 0.04
                        density = 94
                    elif lulc == "Industrial Area":
                        base_lst = 42.8
                        ndvi = 0.03
                        density = 88
                    elif lulc == "Residential High-Density":
                        base_lst = 38.2
                        ndvi = 0.11
                        density = 82
                    else:
                        base_lst = 36.5
                        ndvi = 0.18
                        density = 20

                    variance = math.cos(r * math.pi / 4) * 2.2 + math.sin(c * math.pi / 4) * 2.2
                    lst = base_lst + variance

                    if city_key == "bengaluru":
                        lst -= 6.2
                        ndvi += 0.09
                    elif city_key == "ahmedabad":
                        lst += 1.8

                    pop_exposure = int(random_val * 60) + 15

                    severity = "Low"
                    if lst >= 40.0:
                        severity = "Severe"
                    elif lst >= 36.0:
                        severity = "High"
                    elif lst >= 32.0:
                        severity = "Moderate"

                    db_cell = models.GridCell(
                        id=cell_id,
                        city_key=city_key,
                        row=r,
                        col=c,
                        bounds_json=json.dumps(bounds),
                        lst=lst,
                        original_lst=lst,
                        ndvi=ndvi,
                        original_ndvi=ndvi,
                        density=density,
                        lulc=lulc,
                        ward=ward,
                        pop_exposure=pop_exposure,
                        severity=severity,
                        original_severity=severity,
                        mitigated=False,
                        applied_intervention_key=None
                    )
                    db.add(db_cell)
        
        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# Seed database at runtime
seed_database()

# --- API Endpoints ---

@app.route("/api/cities", methods=["GET"])
def get_cities():
    db = request.db
    cities = db.query(models.City).all()
    return jsonify([{"key": c.key, "name": c.name, "description": c.description} for c in cities])

@app.route("/api/cities/<city_key>/grid", methods=["GET"])
def get_city_grid(city_key):
    db = request.db
    cells = db.query(models.GridCell).filter(models.GridCell.city_key == city_key).all()
    if not cells:
        return jsonify({"detail": "City grid not found"}), 404
    
    response_cells = []
    for cell in cells:
        bounds = json.loads(cell.bounds_json)
        intervention = INTERVENTIONS.get(cell.applied_intervention_key) if cell.applied_intervention_key else None
        
        response_cells.append({
            "id": cell.id,
            "city_key": cell.city_key,
            "row": cell.row,
            "col": cell.col,
            "bounds": bounds,
            "lst": cell.lst,
            "originalLst": cell.original_lst,
            "ndvi": cell.ndvi,
            "originalNdvi": cell.original_ndvi,
            "density": cell.density,
            "lulc": cell.lulc,
            "ward": cell.ward,
            "popExposure": cell.pop_exposure,
            "severity": cell.severity,
            "originalSeverity": cell.original_severity,
            "mitigated": cell.mitigated,
            "appliedIntervention": intervention
        })
    return jsonify(response_cells)

@app.route("/api/cells/<cell_id>/mitigate", methods=["POST"])
def mitigate_cell(cell_id):
    db = request.db
    cell = db.query(models.GridCell).filter(models.GridCell.id == cell_id).first()
    if not cell:
        return jsonify({"detail": "Grid cell not found"}), 404

    data = request.get_json() or {}
    intervention_key = data.get("intervention_key")
    if not intervention_key or intervention_key not in INTERVENTIONS:
        return jsonify({"detail": "Invalid or missing intervention key"}), 400

    intervention = INTERVENTIONS[intervention_key]
    
    # Calculate simulated parameters
    new_ndvi = min(1.0, cell.original_ndvi + intervention["ndviImpact"])
    new_density = max(0, cell.density + intervention["densityImpact"])
    
    # Use ML predictor to calculate the microclimatic cooling temperature
    predicted_lst = predictor.predict_temperature(new_ndvi, new_density, cell.lulc)
    
    # Bound the LST prediction to be lower than original (mitigation cooling)
    # Ensure it reflects the expected localized drop
    lst_target = cell.original_lst - intervention["lstImpact"]
    # Blend the direct impact and the ML prediction for dynamic variety
    final_lst = float(round((predicted_lst * 0.3) + (lst_target * 0.7), 2))
    if final_lst > cell.original_lst:
         final_lst = cell.original_lst - 0.5 # Force some cooling if ML is highly anomalous
    
    # Recalculate severity level
    new_severity = "Low"
    if final_lst >= 40.0:
        new_severity = "Severe"
    elif final_lst >= 36.0:
        new_severity = "High"
    elif final_lst >= 32.0:
        new_severity = "Moderate"

    # Save to Database
    cell.mitigated = True
    cell.applied_intervention_key = intervention_key
    cell.lst = final_lst
    cell.ndvi = new_ndvi
    cell.severity = new_severity
    db.commit()
    db.refresh(cell)

    bounds = json.loads(cell.bounds_json)
    return jsonify({
        "id": cell.id,
        "city_key": cell.city_key,
        "row": cell.row,
        "col": cell.col,
        "bounds": bounds,
        "lst": cell.lst,
        "originalLst": cell.original_lst,
        "ndvi": cell.ndvi,
        "originalNdvi": cell.original_ndvi,
        "density": cell.density,
        "lulc": cell.lulc,
        "ward": cell.ward,
        "popExposure": cell.pop_exposure,
        "severity": cell.severity,
        "originalSeverity": cell.original_severity,
        "mitigated": cell.mitigated,
        "appliedIntervention": intervention
    })

@app.route("/api/cells/<cell_id>/reset", methods=["POST"])
def reset_cell(cell_id):
    db = request.db
    cell = db.query(models.GridCell).filter(models.GridCell.id == cell_id).first()
    if not cell:
        return jsonify({"detail": "Grid cell not found"}), 404

    cell.mitigated = False
    cell.applied_intervention_key = None
    cell.lst = cell.original_lst
    cell.ndvi = cell.original_ndvi
    cell.severity = cell.original_severity
    db.commit()
    db.refresh(cell)

    bounds = json.loads(cell.bounds_json)
    return jsonify({
        "id": cell.id,
        "city_key": cell.city_key,
        "row": cell.row,
        "col": cell.col,
        "bounds": bounds,
        "lst": cell.lst,
        "originalLst": cell.original_lst,
        "ndvi": cell.ndvi,
        "originalNdvi": cell.original_ndvi,
        "density": cell.density,
        "lulc": cell.lulc,
        "ward": cell.ward,
        "popExposure": cell.pop_exposure,
        "severity": cell.severity,
        "originalSeverity": cell.original_severity,
        "mitigated": cell.mitigated,
        "appliedIntervention": None
    })

@app.route("/api/cities/<city_key>/trends", methods=["GET"])
def get_city_trends(city_key):
    # Returns seasonal analytical values
    multipliers = {
        "delhi": {"lstAdd": 0, "ndviMul": 1.0},
        "bengaluru": {"lstAdd": -6.5, "ndviMul": 1.35},
        "ahmedabad": {"lstAdd": 1.5, "ndviMul": 0.85}
    }

    mult = multipliers.get(city_key, multipliers["delhi"])
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    base_lst = [21.5, 24.8, 30.5, 36.8, 41.5, 39.2, 33.8, 32.2, 33.1, 31.8, 27.2, 22.0]
    base_ndvi = [0.42, 0.40, 0.35, 0.26, 0.18, 0.22, 0.32, 0.38, 0.37, 0.39, 0.41, 0.43]

    trends = []
    for idx, m in enumerate(months):
        trends.append({
            "month": m,
            "LST": float(round(base_lst[idx] + mult["lstAdd"], 1)),
            "NDVI": float(round(base_ndvi[idx] * mult["ndviMul"], 2))
        })
    return jsonify(trends)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
