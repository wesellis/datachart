from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class APMApplication(Base):
    __tablename__ = "apm_applications"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    vendor_name = Column(String, nullable=False)
    owner_name = Column(String)
    owner_email = Column(String)
    department = Column(String)
    
    cost_2024 = Column(Float, default=0)
    cost_2025 = Column(Float, default=0)
    monthly_cost = Column(Float, default=0)
    cost_per_user = Column(Float, default=0)
    
    total_licenses = Column(Integer, default=0)
    used_licenses = Column(Integer, default=0)
    utilization_rate = Column(Float, default=0)
    
    contract_end = Column(DateTime)
    renewal_date = Column(DateTime)
    auto_renewal = Column(Boolean, default=False)
    notice_period = Column(Integer, default=90)
    
    patch_status = Column(String, default="unknown")
    compliance_score = Column(Integer, default=0)
    security_score = Column(Integer, default=0)
    last_update = Column(DateTime, default=datetime.utcnow)
    
    risk_level = Column(String, default="Low")
    business_criticality = Column(String, default="Medium")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)