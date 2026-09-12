from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from tensorflow.keras.preprocessing.sequence import pad_sequences
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import FileResponse
from keras.models import load_model
from pathlib import Path
import numpy as np
import os
import pickle
import re
import nltk
from nltk.tokenize import word_tokenize



BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
MODEL_DIR = BASE_DIR / "model" / "gru_model.keras"
TOKENIZER_DIR = BASE_DIR / "model" / "tokenizer.pkl"

max_sequence_length = 50

emotion_labels = ["sadness", "joy", "love", "anger", "fear", "surprise"]


EMOTION_EMOJIS = {
    "sadness": "😢",
    "joy": "😄",
    "love": "❤️",
    "anger": "😠",
    "fear": "😨",
    "surprise": "😲",
}



nltk.download('punkt_tab')
# Necessary NLTK resources download karein
nltk.download('punkt')

# Common Contractions Dictionary
CONTRACTIONS = {
    "can't": "cannot",
    "won't": "will not",
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'d": " would",
    "'ll": " will",
    "'ve": " have",
    "'m": " am"
}

def preprocess(text):
    if not isinstance(text, str):
        return ""

    text = text.lower()

    for contraction, replacement in CONTRACTIONS.items():
        text = text.replace(contraction, replacement)

    text = re.sub(r'\d+', '', text)

    text = re.sub(r'[^\w\s]', '', text)

    word_tokens = word_tokenize(text)

    return " ".join(word_tokens)


class TextInput(BaseModel):
    text: str = Field(...,min_length=1, max_length=2000,description="The text to analyze" ,example="I am feeling very happy today!")
    

class PredictionOutput(BaseModel):
    text: str
    predicted_emotion: str
    confidence: float
    all_probabilities: dict[str, float]
    
class ServerHealthCheck(BaseModel):
    status: str  
    model_loaded: bool
    

dl_model = {}
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Downloading NLTK resources...")
    try:
        nltk.download('stopwords', quiet=True)
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
    except Exception as e:
        print(f"NLTK download error: {e}")
    print("Loading the model and tokenizer...")
    try:
        dl_model['model'] = load_model(MODEL_DIR)
        with open(TOKENIZER_DIR, 'rb') as f:
            dl_model['tokenizer'] = pickle.load(f)
        print("Model and tokenizer loaded successfully.")

    except Exception as e:
        print(f"Error loading model or tokenizer: {e}")
        dl_model['model'] = None
        dl_model['tokenizer'] = None

    yield
        
    dl_model.clear()
    
    
    
app = FastAPI(lifespan=lifespan)
app.mount('/static',StaticFiles(directory=STATIC_DIR),name='static')

@app.get('/', include_in_schema=False)
def serve_ui():
    return FileResponse(STATIC_DIR/'index.html')

@app.get('/health', response_model=ServerHealthCheck)
def check_health():
    return{
        "status" : "Server is Running",
        "model_loaded" : dl_model.get('model') is not None
}
    
    
@app.post('/predict', response_model=PredictionOutput)
def predict(input_text:TextInput):
    gru_model = dl_model.get('model')
    tokenizer = dl_model.get('tokenizer')
    
    if gru_model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet. Please try again later")
    
    cleaned_text = preprocess(input_text.text)
    
    tokenized_text = tokenizer.texts_to_sequences([cleaned_text])
    padded_text = pad_sequences(
        tokenized_text,
        maxlen = max_sequence_length,
        padding = 'post',
        truncating = 'post'
    )
    probabilites = gru_model.predict(padded_text)[0]
    top_emotional_index = int(np.argmax(probabilites))
    
    all_probabilites = {
    label: float(prob) for label, prob in zip(emotion_labels, probabilites)
}
    
    return{
        "text" : input_text.text,
        "predicted_emotion": emotion_labels[top_emotional_index],
        "confidence": float(probabilites[top_emotional_index]),
        "all_probabilities": all_probabilites
}
    