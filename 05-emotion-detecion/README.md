# EmotiSense — Emotion Detection API & UI

Real-time **text emotion classification** powered by a GRU deep learning model, served through FastAPI, with a dark, animated frontend built in plain HTML, CSS, and JavaScript.

Predicts one of six emotions:

| Emotion   | Example cue                          |
|-----------|--------------------------------------|
| Sadness   | Loss, emptiness, grief               |
| Joy       | Happiness, celebration, excitement   |
| Love      | Affection, longing, care             |
| Anger     | Frustration, unfairness, rage        |
| Fear      | Anxiety, dread, worry                |
| Surprise  | Shock, unexpected events             |

---

## Features

- **GRU model inference** via `/predict`
- **Interactive dark UI** with animated particle background, emotion-reactive accents, and confidence bars
- **Sample prompts** for quick demos
- **Local analysis history** (browser `localStorage`)
- **Live health indicator** for API / model status
- Fully **responsive** (desktop & mobile)

---

## Project structure

```text
05-emotion-detecion/
├── api/
│   └── app.py                 # FastAPI app, preprocessing, prediction
├── model/
│   ├── gru_model.keras        # Trained GRU model
│   ├── tokenizer.pkl          # Fitted Keras tokenizer
│   └── emotion_detection.ipynb
├── static/
│   ├── index.html             # EmotiSense UI
│   ├── css/styles.css
│   └── js/app.js
├── requirements.txt
└── README.md
```

---

## Requirements

- Python **3.10+** (3.11 / 3.12 recommended)
- ~2 GB free disk for TensorFlow and model artifacts
- Modern browser (Chrome, Firefox, Edge, Safari)

---

## Setup

### 1. Create a virtual environment

```bash
cd 05-emotion-detecion
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

NLTK tokenizers download automatically on first API startup.

### 3. Confirm model files exist

Ensure these paths are present:

- `model/gru_model.keras`
- `model/tokenizer.pkl`

---

## Run the app

From the project root:

```bash
uvicorn api.app:app --reload --host 0.0.0.0 --port 8000
```

Open the UI:

```text
http://127.0.0.1:8000/
```

API docs (Swagger):

```text
http://127.0.0.1:8000/docs
```

---

## API reference

### `GET /health`

Returns server and model load status.

```json
{
  "status": "Server is Running",
  "model_loaded": true
}
```

### `POST /predict`

**Request body**

```json
{
  "text": "I am feeling very happy today!"
}
```

**Response**

```json
{
  "text": "I am feeling very happy today!",
  "predicted_emotion": "joy",
  "confidence": 0.94,
  "all_probabilities": {
    "sadness": 0.01,
    "joy": 0.94,
    "love": 0.02,
    "anger": 0.01,
    "fear": 0.01,
    "surprise": 0.01
  }
}
```

Constraints: `text` length **1–2000** characters.

---

## Frontend usage

1. Open the home page served by FastAPI.
2. Type or paste text, or click a sample chip.
3. Click **Detect Emotion** (or `Ctrl/Cmd + Enter`).
4. Review the predicted emotion, confidence meter, and full probability map.
5. Re-run past analyses from **Recent analyses**.

The UI theme shifts color based on the detected emotion; the canvas particles react to pointer movement and prediction bursts.

---

## Model notes

- Architecture: **GRU** sequence classifier (Keras / TensorFlow)
- Dataset: [dair-ai/emotion](https://huggingface.co/datasets/dair-ai/emotion)
- Preprocessing: lowercasing, contraction expansion, digit/punctuation cleanup, NLTK tokenization, padding to length **50**
- Labels: `sadness`, `joy`, `love`, `anger`, `fear`, `surprise`

Training details and experiments live in `model/emotion_detection.ipynb`.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| UI shows “API offline” | Confirm uvicorn is running on port 8000 |
| “Model is not loaded” / 503 | Check `model/gru_model.keras` and `tokenizer.pkl` paths |
| Slow first request | Cold TensorFlow / NLTK startup — wait a few seconds |
| Import errors | Reinstall from `requirements.txt` inside a clean venv |

---

## License

This project is provided for educational and demonstration purposes. Add a license file if you plan to distribute it publicly.
