from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np

app = FastAPI(
    title="Hausa News Topic Classifier",
    description="Classify Hausa news text into topics",
    version="0.1.0"
)

origins = [
    "http://192.168.43.161:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

class ConfidenceScores(BaseModel):
    topic: str
    confidence: float

class TopicResponse(BaseModel):
    topic: str
    confidence_scores: list[ConfidenceScores]

topics = [
    "Business",
    "Entertainment",
    "Health",
    "Politics",
    "Religion",
    "Sport",
    "Technology"
]
CONFIDENCE_THRESHOLD = 0.6  

# Load model and tokenizer
MODEL_PATH = "./model"  
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    device = torch.device("cpu")
    model.to(device)
    model.eval()
    print(f"Model loaded successfully from {MODEL_PATH} on {device}")
except Exception as e:
    print(f"Error loading model: {e}")
    raise

def classify_text(text: str) -> tuple[str, dict[str, float]]:
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        temperature = 1.5
        probs = torch.softmax(logits / temperature, dim=-1).squeeze().cpu().numpy()
    
    confidence_scores = {topic: float(prob) for topic, prob in zip(topics, probs)}
    
    max_confidence = max(confidence_scores.values())
    if max_confidence < CONFIDENCE_THRESHOLD:
        predicted_topic = "Others"
        confidence_scores["Others"] = max_confidence
    else:
        predicted_idx = np.argmax(probs)
        predicted_topic = topics[predicted_idx]
        confidence_scores["Others"] = round(0.00, 16)

    print(f"Predicted topic: {predicted_topic}, Confidence scores: {confidence_scores}")
    
    return predicted_topic, confidence_scores

@app.post("/api/predict", response_model=TopicResponse)
async def predict(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text field is required")
    predicted_topic, confidence_scores = classify_text(request.text)
    formatted_scores = [
        ConfidenceScores(topic=topic, confidence=score) 
        for topic, score in confidence_scores.items()
    ]
    return TopicResponse(topic=predicted_topic, confidence_scores=formatted_scores)

@app.get("/")
async def root():
    return {"message": "Welcome to Hausa News Topic Classifier API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)