"""
FINAL_MODEL_PATH = "/content/drive/MyDrive/hausa_topic_classifier/final_model"
tokenizer = AutoTokenizer.from_pretrained(FINAL_MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(FINAL_MODEL_PATH)
model.eval()  # Set to evaluation mode
device = torch.device("cpu")  # Use "cuda" if GPU available later

def classify_text(text: str) -> tuple[str, dict[str, float]]:
    # Tokenize input
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=256)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Predict with model
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1).squeeze().cpu().numpy()  # Probabilities
    
    # Map probabilities to topics
    confidence_scores = dict(zip(topics, probs))
    
    # Get the predicted topic (highest probability)
    predicted_topic = topics[np.argmax(probs)]
    
    return predicted_topic, confidence_scores
"""