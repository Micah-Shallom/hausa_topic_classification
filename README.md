# Hausa News Topic Classifier

A topic classification system for Hausa news using AfroXLMR-base, achieving a test F1 score of 0.9277. This project fine-tunes a transformer model on the MasakhaNEWS dataset and deploys it with a FastAPI backend (`server`) and a frontend (`client`), including an "Other" category for out-of-scope texts.

## Project Structure
- **`client/`**: Frontend (e.g., React/Vue with pnpm).
- **`server/`**: Backend (FastAPI with AfroXLMR-base model).

## Features
- Classifies Hausa news into 7 topics: Business, Entertainment, Health, Politics, Religion, Sport, Technology.
- Focal loss (α=0.6, γ=2.0), temperature scaling (T=1.5), and threshold (0.6) for "Other" category.
- Real-time inference via API and interactive UI.

## Prerequisites
- **Client**: Node.js, pnpm (`npm install -g pnpm`).
- **Server**: Python 3.8+, dependencies (`fastapi`, `uvicorn`, `torch`, `transformers`, `numpy`).

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Micah-Shallom/hausa-topic-classifier.git
   cd hausa-topic-classifier
   ```

2. **Install Client Dependencies**:
   ```bash
   cd client
   pnpm install
   ```

3. **Install Server Dependencies**:
   ```bash
   cd ../server
   pip install fastapi uvicorn torch transformers numpy --index-url https://download.pytorch.org/whl/cpu
   ```

4. **Download Model Weights**:
   - Due to size (~1.04 GB), model files are not included.
   - Download from: [Google Drive Link](https://drive.google.com/drive/folders/1fEvLEjKdMiM1Fta1-st8HwIVjXx0zFfM?usp=sharing)  
   - Files: `config.json`, `model.safetensors`, `sentencepiece.bpe.model`, `special_tokens_map.json`, `tokenizer_config.json`, `tokenizer.json`.
   - Move them to `server/model/` directory:
     ```bash
     mkdir server/model
     mv /path/to/downloaded/files/* server/model/
     ```

## Usage
1. **Start the Server**:
   ```bash
   cd server
   uvicorn main:app --reload
   ```
   - Runs on `http://localhost:8000`.

2. **Start the Client**:
   ```bash
   cd client
   pnpm dev
   ```
   - Typically runs on `http://localhost:3000` (check client config).

3. **Test the API**:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"text": "Shugaban Najeriya ya gana da gwamnoni"}' http://localhost:8000/api/predict
   ```
   - Response:
     ```json
     {
         "topic": "Politics",
         "confidence_scores": [
             {"topic": "Business", "confidence": 0.05},
             {"topic": "Politics", "confidence": 0.85},
             ...
         ]
     }
     ```

## Training
- **Script**: `server/train.py` (Colab GPU recommended).
- **Dataset**: MasakhaNEWS Hausa (7 classes).
- **Model**: AfroXLMR-base, fine-tuned with AdamW (LR=2e-5), early stopping.

## Results
- **Test F1**: 0.9277 (vs. MasakhaNEWS baseline ~0.91).
- **Test Accuracy**: 0.9278.
- **Improvements**: Outperforms baseline with robust short-text and out-of-category handling.

## Future Work
- Train AfroXLMR-large for F1 > 0.93.
- Enhance dataset with diverse short texts.

## Credits
- **Author**: Shallom Micah Bawa
- **Model**: AfroXLMR-base by Davlan (Hugging Face).
- **Dataset**: MasakhaNEWS (Masakhane).
- **Course**: COEN541 - Natural Language Processing.


