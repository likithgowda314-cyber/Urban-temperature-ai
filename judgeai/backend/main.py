from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import tempfile
from pydantic import BaseModel
from typing import Dict, Any

import models
from database import engine, get_db
from extractor import extract_structured_data

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/extract")
async def extract_court_order(file: UploadFile = File(...), db: Session = Depends(get_db)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        shutil.copyfileobj(file.file, temp_pdf)
        temp_pdf_path = temp_pdf.name

    try:
        extracted_data = extract_structured_data(temp_pdf_path)
        
        audit_entry = models.AuditLog(
            action="extraction",
            ai_values=extracted_data
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        
        return {
            "extraction_id": audit_entry.id,
            **extracted_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(temp_pdf_path)

class ApproveRequest(BaseModel):
    extraction_id: int
    verified_data: Dict[str, Any]
    reviewer_name: str

@app.post("/approve")
async def approve_record(request: ApproveRequest, db: Session = Depends(get_db)):
    audit_log = db.query(models.AuditLog).filter(models.AuditLog.id == request.extraction_id).first()
    if not audit_log:
        raise HTTPException(status_code=404, detail="Extraction not found")

    verified_data = request.verified_data

    new_record = models.Record(
        case_number=verified_data.get("case_number", ""),
        date=verified_data.get("date", ""),
        petitioner=verified_data.get("petitioner", ""),
        respondent=verified_data.get("respondent", ""),
        directions=verified_data.get("directions", []),
        deadline=verified_data.get("deadline", ""),
        department=verified_data.get("department", ""),
        confidence=verified_data.get("confidence", {}),
        reviewer_name=request.reviewer_name
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    approval_audit = models.AuditLog(
        record_id=new_record.id,
        action="approval",
        ai_values=audit_log.ai_values,
        approved_values=verified_data,
        reviewer_name=request.reviewer_name
    )
    db.add(approval_audit)
    db.commit()

    return {"message": "Record approved successfully", "record_id": new_record.id}

@app.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    records = db.query(models.Record).order_by(models.Record.deadline.asc()).all()
    return records
