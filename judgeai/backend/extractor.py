import fitz
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

class ConfidenceScores(BaseModel):
    case_number: str
    date: str
    directions: str
    deadline: str

class ExtractedData(BaseModel):
    case_number: str
    date: str
    petitioner: str
    respondent: str
    directions: List[str]
    deadline: str
    department: str
    confidence: ConfidenceScores

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_structured_data(pdf_path: str) -> dict:
    text = extract_text_from_pdf(pdf_path)
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return {
            "case_number": "MOCK-123",
            "date": "2023-10-01",
            "petitioner": "John Doe",
            "respondent": "Jane Doe",
            "directions": ["Do something"],
            "deadline": "2023-10-15",
            "department": "Civil",
            "confidence": {
                "case_number": "high",
                "date": "high",
                "directions": "medium",
                "deadline": "high"
            }
        }
    
    model = genai.GenerativeModel('gemini-1.5-pro')
    prompt = f"""
    You are an expert legal data extractor. Extract the following information from the court order provided below.
    If a field is not found, leave it empty.
    For confidence, use "high", "medium", or "low" based on how certain you are of the extracted value.
    
    Court Order Text:
    {text}
    """
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=ExtractedData,
            temperature=0.0,
        ),
    )
    
    return json.loads(response.text)
