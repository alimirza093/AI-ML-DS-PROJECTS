from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal
import pandas as pd
import joblib
from pathlib import Path
import logging

class MentalHealthInput(BaseModel):
    Age: int
    Gender: Literal['Male', 'Female']
    Country_Grouped: str
    Academic_Level: Literal['Undergraduate', 'Graduate', 'High School']
    Most_Used_Platform: Literal['Facebook','LinkedIn','Instagram','Snapchat','Twitter','YouTube','TikTok','LINE','KakaoTalk','VKontakte','WhatsApp','WeChat']
    Purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']
    Avg_Daily_Usage_Hours: float = Field(..., ge=0, le=24, description="Average daily usage hours must be between 0 and 24.")
    Daily_Unlocks: int = Field(..., ge=0, description="Daily unlocks must be a non-negative integer.")
    Study_Hours: float = Field(..., ge=0, description="Study hours must be a non-negative number.")
    Physical_Activity_Hours: float = Field(..., ge=0, description="Physical activity hours must be a non-negative number.")
    Sleep_Hours_Per_Night: float = Field(..., ge=0, le=24, description="Sleep hours per night must be between 0 and 24.")
    Stress_Level: Literal['Medium', 'Low', 'Very High', 'High']


class MentalHealthOutput(BaseModel):
    Mental_Health_Score: float


COLUMNS = [
    'Age', 'Gender', 'Country_Grouped', 'Academic_Level', 'Most_Used_Platform',
    'Purpose_Of_Use', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks',
    'Study_Hours', 'Physical_Activity_Hours', 'Sleep_Hours_Per_Night',
    'Stress_Level'
]

ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"
MODEL_PATH = ROOT_DIR / "model" / "mental_health_model.pkl"

app = FastAPI(
    title="Mental Health Prediction API",
    description="An API to predict mental health scores based on user input.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
try:
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
    else:
        logging.warning(
            "Model file not found at %s. Predictions will fail until model is saved there.",
            MODEL_PATH,
        )
except Exception as e:
    logging.exception("Failed to load model from %s: %s", MODEL_PATH, e)


@app.get("/api")
def greeting():
    return {"message": "Welcome to the Mental Health Prediction API!"}


@app.post("/predict", response_model=MentalHealthOutput)
def predict_mental_health(input_data: MentalHealthInput):
    top_countries = [
        'Other', 'Canada', 'USA', 'India', 'Australia',
        'UK', 'Germany', 'Mexico', 'Turkey', 'Pakistan'
    ]
    country_group = (
        input_data.Country_Grouped
        if input_data.Country_Grouped in top_countries
        else 'Other'
    )
    input_rows = pd.DataFrame([{
        'Age': input_data.Age,
        'Gender': input_data.Gender,
        'Country_Grouped': country_group,
        'Academic_Level': input_data.Academic_Level,
        'Most_Used_Platform': input_data.Most_Used_Platform,
        'Purpose_Of_Use': input_data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours': input_data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks': input_data.Daily_Unlocks,
        'Study_Hours': input_data.Study_Hours,
        'Physical_Activity_Hours': input_data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night': input_data.Sleep_Hours_Per_Night,
        'Stress_Level': input_data.Stress_Level,
    }])[COLUMNS]

    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded. Please ensure the model file exists.",
        )

    try:
        prediction = model.predict(input_rows)[0]
    except Exception as e:
        logging.exception("Prediction failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    return {"Mental_Health_Score": round(float(prediction), 2)}


@app.get("/")
def serve_home():
    index = FRONTEND_DIR / "index.html"
    if not index.exists():
        raise HTTPException(status_code=404, detail="Frontend not found.")
    return FileResponse(index)


if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/styles.css")
    def serve_css():
        return FileResponse(FRONTEND_DIR / "styles.css")

    @app.get("/script.js")
    def serve_js():
        return FileResponse(FRONTEND_DIR / "script.js")
