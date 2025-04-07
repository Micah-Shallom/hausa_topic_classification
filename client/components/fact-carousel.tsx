"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const facts = [
  {
    title: "Project Objective",
    content:
      "Our objective was to develop a topic classifier for Hausa news using AfroXLMR-base, targeting an F1 score above the MasakhaNEWS baseline (~91%) while addressing short-text misclassification and out-of-category detection.",
  },
  {
    title: "Technical Approach",
    content:
      "We fine-tuned AfroXLMR-base on the MasakhaNEWS dataset (7 classes) with focal loss, AdamW optimizer, and early stopping, followed by deployment via a FastAPI backend with confidence thresholding.",
  },
  {
    title: "Project Results",
    content:
      "Our model achieved a test F1 score of 0.9277, successfully surpassing the baseline performance of the original MasakhaNEWS implementation.",
  },
  {
    title: "Project Significance",
    content:
      "This work improved accuracy and robustness for low-resource NLP, with practical deployment for real-time classification of Hausa text across multiple domains.",
  },
  {
    title: "Hausa Language",
    content:
      "Hausa is one of the most widely spoken languages in Africa, with over 70 million speakers across Nigeria, Niger, and other West African countries.",
  },
  {
    title: "Text Classification",
    content:
      "Text classification is a machine learning technique that automatically assigns categories to text documents, helping organize and analyze large volumes of textual data.",
  },
  {
    title: "AfroXLMR Model",
    content:
      "AfroXLMR is a multilingual language model specifically fine-tuned for African languages, improving performance on tasks like classification for languages with fewer digital resources.",
  },
  {
    title: "MasakhaNEWS Dataset",
    content:
      "MasakhaNEWS is a multilingual news dataset covering 16 African languages, created to advance natural language processing research for African languages.",
  },
  {
    title: "Hausa Script",
    content:
      "Hausa can be written in both Latin script (Boko) and Arabic script (Ajami), with the Latin script being more commonly used in formal education and media.",
  },
  {
    title: "Focal Loss",
    content:
      "We used Focal Loss in our model training, which helps address class imbalance by focusing more on difficult-to-classify examples, improving performance on minority classes.",
  },
  {
    title: "Confidence Scores",
    content:
      "Our model provides confidence scores for each prediction, allowing users to assess reliability and make informed decisions about borderline classifications.",
  },
  {
    title: "Transfer Learning",
    content:
      "This project leverages transfer learning, allowing our model to benefit from knowledge gained on other languages and tasks, which is especially valuable for low-resource languages like Hausa.",
  },
]

export default function FactCarousel() {
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Auto-rotate facts every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextFact()
    }, 10000)

    return () => clearInterval(interval)
  }, [currentFactIndex])

  const nextFact = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentFactIndex((prev) => (prev + 1) % facts.length)
      setIsAnimating(false)
    }, 500)
  }

  const prevFact = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentFactIndex((prev) => (prev - 1 + facts.length) % facts.length)
      setIsAnimating(false)
    }, 500)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <button
          onClick={prevFact}
          className="p-1 rounded-full bg-gray-700/50 hover:bg-gray-700 text-gray-300"
          aria-label="Previous fact"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className={`transition-opacity duration-500 ${isAnimating ? "opacity-0" : "opacity-100"} px-4`}>
          <h4 className="font-medium text-purple-300 mb-1">{facts[currentFactIndex].title}</h4>
          <p className="text-gray-300 text-sm">{facts[currentFactIndex].content}</p>
        </div>

        <button
          onClick={nextFact}
          className="p-1 rounded-full bg-gray-700/50 hover:bg-gray-700 text-gray-300"
          aria-label="Next fact"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex justify-center mt-4 space-x-1">
        {facts.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentFactIndex ? "w-4 bg-purple-400" : "w-1.5 bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

