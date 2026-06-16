import math

class UHIPredictionEngine:
    """
    Pure Python predictive engine simulating microclimate thermal changes.
    Applies a multi-variable regression model with non-linear interaction terms
    and Land Use offsets to estimate Land Surface Temperatures (LST) dynamically
    without requiring external binary machine learning libraries.
    """
    def __init__(self):
        self.intercept = 34.05
        self.coef_ndvi = -15.42
        self.coef_density = 10.75
        self.coef_interaction = -4.25 # NDVI * Density cooling interaction
        
        self.lulc_offsets = {
            "Urban Forest": -2.55,
            "Water Body": -5.62,
            "Residential High-Density": 3.48,
            "Commercial": 5.85,
            "Industrial Area": 7.52,
            "Open Soil": 2.05
        }

    def predict_temperature(self, ndvi: float, density: float, lulc_class: str) -> float:
        """
        Predict LST given updated cell parameters.
        LST = intercept + c1*NDVI + c2*(density/100) + c3*NDVI*(density/100) + LULC_offset + noise
        """
        offset = self.lulc_offsets.get(lulc_class, 2.05)
        density_fraction = density / 100.0
        
        # Calculate thermal prediction
        lst = (
            self.intercept + 
            (self.coef_ndvi * ndvi) + 
            (self.coef_density * density_fraction) + 
            (self.coef_interaction * ndvi * density_fraction) + 
            offset
        )
        
        # Add deterministic microclimate variance to emulate model noise
        variance = math.sin(ndvi * 12.0 + density * 6.0) * 0.15
        
        return float(round(lst + variance, 2))

# Singleton instance
predictor = UHIPredictionEngine()
