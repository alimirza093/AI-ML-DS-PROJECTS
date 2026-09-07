# MindPulse — Mental Health Score Predictor

Dark-themed web app that predicts a **mental health score** from lifestyle and social-media habits. A FastAPI backend loads a tuned scikit-learn Random Forest pipeline and serves an interactive HTML/CSS/JS frontend.

> Educational demo only — **not** a clinical diagnosis or medical advice.

## Project structure

```
04-mental-health-prediction/
├── api/
│   └── app.py                 # FastAPI + /predict endpoint + frontend routes
├── frontend/
│   ├── index.html             # Dark UI
│   ├── styles.css             # Responsive dark theme + animations
│   └── script.js              # Form logic, gauge, particle background
├── model/
│   ├── mental_health_model.pkl
│   └── mental-health-prediction.ipynb
├── requirements.txt
└── README.md
```

## Model notes

Inspected artifact: `model/mental_health_model.pkl`

| Item | Detail |
|------|--------|
| Type | `sklearn.pipeline.Pipeline` (`preprocessor` → `regressor`) |
| Regressor | Tuned `RandomForestRegressor` |
| Target | `Mental_Health_Score` (training data roughly **3.6 – 9.4**, higher is better) |
| Features | Age, Gender, Country_Grouped, Academic_Level, Most_Used_Platform, Purpose_Of_Use, Avg_Daily_Usage_Hours, Daily_Unlocks, Study_Hours, Physical_Activity_Hours, Sleep_Hours_Per_Night, Stress_Level |

Countries outside the training “top” set are mapped to `Other` in the API.

## Setup

Use a virtual environment (example uses the shared project venv or a new one):

```bash
cd 04-mental-health-prediction
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Ensure the pickle exists at:

```text
model/mental_health_model.pkl
```

(Re-save it from the notebook with `joblib.dump(best_pipeline, 'mental_health_model.pkl')` if needed.)

## Run the API + website

From the project root:

```bash
uvicorn api.app:app --reload --host 127.0.0.1 --port 8000
```

Then open:

- App UI: http://127.0.0.1:8000/
- API hello: http://127.0.0.1:8000/api
- Interactive docs: http://127.0.0.1:8000/docs

### Predict example

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Age": 21,
    "Gender": "Male",
    "Country_Grouped": "Other",
    "Academic_Level": "Undergraduate",
    "Most_Used_Platform": "Facebook",
    "Purpose_Of_Use": "Networking",
    "Avg_Daily_Usage_Hours": 4.0,
    "Daily_Unlocks": 134,
    "Study_Hours": 4.5,
    "Physical_Activity_Hours": 2.2,
    "Sleep_Hours_Per_Night": 6.7,
    "Stress_Level": "Medium"
  }'
```

Expected shape:

```json
{ "Mental_Health_Score": 6.79 }
```

## Frontend features

- Animated particle + aurora background
- Responsive dark theme (desktop & mobile)
- Live range sliders and stress chips
- Animated score gauge with plain-language insights
- Talks to `/predict` via `fetch` (CORS enabled for local use)

If you open `frontend/index.html` via Live Server / `file://`, the script targets `http://127.0.0.1:8000` automatically. Prefer serving through FastAPI as above.

## Retrain / replace the model

1. Run `model/mental-health-prediction.ipynb`
2. Dump the best pipeline into `model/mental_health_model.pkl`
3. Restart uvicorn

## License / disclaimer

Built for learning and portfolio use. Predictions are statistical estimates from survey-style features and must not replace professional mental-health care.
