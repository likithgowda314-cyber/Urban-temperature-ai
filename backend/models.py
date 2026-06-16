from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class City(Base):
    __tablename__ = "cities"

    key = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Relationships
    cells = relationship("GridCell", back_populates="city", cascade="all, delete-orphan")


class GridCell(Base):
    __tablename__ = "grid_cells"

    id = Column(String, primary_key=True, index=True) # e.g. "DL-R0-C0"
    city_key = Column(String, ForeignKey("cities.key"), nullable=False)
    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)
    bounds_json = Column(String, nullable=False) # JSON encoded lat/lng range, e.g. "[[28.6139, 77.2090], [28.6258, 77.2210]]"
    
    # Active parameters
    lst = Column(Float, nullable=False)
    original_lst = Column(Float, nullable=False)
    ndvi = Column(Float, nullable=False)
    original_ndvi = Column(Float, nullable=False)
    density = Column(Integer, nullable=False)
    lulc = Column(String, nullable=False)
    ward = Column(String, nullable=False)
    pop_exposure = Column(Integer, nullable=False)
    severity = Column(String, nullable=False)
    original_severity = Column(String, nullable=False)
    
    # Mitigation Sandbox state
    mitigated = Column(Boolean, default=False)
    applied_intervention_key = Column(String, nullable=True)

    # Relationships
    city = relationship("City", back_populates="cells")
