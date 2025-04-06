"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2, Clock, X, Menu, AlertCircle } from "lucide-react"
import ParticleBackground from "@/components/particle-background"

type ConfidenceScore = {
  topic: string
  confidence: number
}

type ApiResponse = {
  topic: string
  confidence_scores: ConfidenceScore[]
}

type HistoryItem = {
  id: string
  text: string
  predictedTopic: string
  timestamp: Date
  confidenceScores: {
    name: string
    value: number
    fill: string
  }[]
}

// Color mapping for topics
const topicColors: Record<string, string> = {
  Business: "#60a5fa",
  Entertainment: "#34d399",
  Health: "#f87171",
  Politics: "#a78bfa",
  Religion: "#fbbf24",
  Sport: "#fb923c",
  Technology: "#22d3ee",
  Other: "#9ca3af",
}

export default function HausaTopicClassifier() {
  const [newsText, setNewsText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showMobileHistory, setShowMobileHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState({
    predictedTopic: "",
    confidenceScores: [
      { name: "Business", value: 0, fill: topicColors["Business"] },
      { name: "Entertainment", value: 0, fill: topicColors["Entertainment"] },
      { name: "Health", value: 0, fill: topicColors["Health"] },
      { name: "Politics", value: 0, fill: topicColors["Politics"] },
      { name: "Religion", value: 0, fill: topicColors["Religion"] },
      { name: "Sport", value: 0, fill: topicColors["Sport"] },
      { name: "Technology", value: 0, fill: topicColors["Technology"] },
      { name: "Other", value: 0, fill: topicColors["Other"] },
    ],
  })

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("classificationHistory")
    if (savedHistory) {
      try {
        // Parse the JSON string and convert timestamp strings back to Date objects
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setHistory(parsedHistory)
      } catch (err) {
        console.error("Error parsing history from localStorage:", err)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("classificationHistory", JSON.stringify(history))
  }, [history])

  // Close mobile history panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showMobileHistory && !target.closest(".history-sidebar") && !target.closest(".history-toggle")) {
        setShowMobileHistory(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMobileHistory])

  const classifyText = async (text: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()

      // Transform API response to our format
      const transformedScores = data.confidence_scores.map((score) => ({
        name: score.topic,
        value: score.confidence,
        fill: topicColors[score.topic] || "#888888",
      }))

      const newResult = {
        predictedTopic: data.topic,
        confidenceScores: transformedScores,
      }

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        text: text,
        predictedTopic: newResult.predictedTopic,
        timestamp: new Date(),
        confidenceScores: newResult.confidenceScores,
      }

      setHistory((prev) => [historyItem, ...prev])
      setResults(newResult)
      setShowResults(true)
    } catch (err) {
      console.error("Error classifying text:", err)
      setError(err instanceof Error ? err.message : "Failed to classify text. Please try again.")

      // Fallback to mock data for demo purposes
      console.log("Using fallback mock data")
      const mockResult = {
        predictedTopic: "Politics",
        confidenceScores: [
          { name: "Business", value: 0.05, fill: topicColors["Business"] },
          { name: "Entertainment", value: 0.03, fill: topicColors["Entertainment"] },
          { name: "Health", value: 0.07, fill: topicColors["Health"] },
          { name: "Politics", value: 0.65, fill: topicColors["Politics"] },
          { name: "Religion", value: 0.15, fill: topicColors["Religion"] },
          { name: "Sport", value: 0.0, fill: topicColors["Sport"] },
          { name: "Technology", value: 0.05, fill: topicColors["Technology"] },
          { name: "Other", value: 0.0, fill: topicColors["Other"] },
        ],
      }

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        text: text,
        predictedTopic: mockResult.predictedTopic,
        timestamp: new Date(),
        confidenceScores: mockResult.confidenceScores,
      }

      setHistory((prev) => [historyItem, ...prev])
      setResults(mockResult)
      setShowResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClassify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsText.trim()) return
    classifyText(newsText)
  }

  const loadHistoryItem = (item: HistoryItem) => {
    setNewsText(item.text)
    setResults({
      predictedTopic: item.predictedTopic,
      confidenceScores: item.confidenceScores,
    })
    setShowResults(true)
    setShowMobileHistory(false) // Close mobile history panel after selection
  }

  const removeHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([])
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const truncateText = (text: string, maxLength = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // History sidebar component
  const HistorySidebar = ({ className = "" }: { className?: string }) => (
    <aside className={`bg-gray-800/80 border-r border-gray-700 overflow-y-auto history-sidebar ${className}`}>
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="font-bold text-purple-300 flex items-center">
          <Clock className="mr-2 h-4 w-4" /> Classification History
        </h2>
        {history.length > 0 && (
          <button onClick={clearAllHistory} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
            Clear All
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-700">
        {history.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm italic">No history yet</div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="p-3 hover:bg-gray-700/50 cursor-pointer transition-colors"
              onClick={() => loadHistoryItem(item)}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-purple-300">{item.predictedTopic}</span>
                <div className="flex items-center">
                  <span className="text-xs text-gray-400 mr-2">{formatTime(item.timestamp)}</span>
                  <button onClick={(e) => removeHistoryItem(item.id, e)} className="text-gray-500 hover:text-gray-300">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{truncateText(item.text)}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100 relative overflow-hidden">
      <ParticleBackground />

      <header className="py-6 text-center bg-gray-800/80 relative z-10 border-b border-gray-700 flex items-center justify-center">
        <button
          className="absolute left-4 md:hidden history-toggle"
          onClick={() => setShowMobileHistory(!showMobileHistory)}
        >
          <Menu className="h-6 w-6 text-purple-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-purple-300">Hausa Topic Classifier</h1>
          <p className="mt-2 text-gray-400">
            Classify Hausa text into Business, Entertainment, Health, Politics, Sport, Religion or Technology
          </p>
        </div>
      </header>

      <div className="flex flex-1 relative z-10">
        {/* Desktop History Sidebar */}
        <div className="hidden md:block md:w-64">
          <HistorySidebar />
        </div>

        {/* Mobile History Sidebar (slide-in) */}
        <div
          className={`fixed inset-y-0 left-0 w-64 z-30 transform transition-transform duration-300 ease-in-out ${
            showMobileHistory ? "translate-x-0" : "-translate-x-full"
          } md:hidden`}
        >
          <HistorySidebar className="h-full" />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
          <form onSubmit={handleClassify} className="w-full max-w-2xl flex flex-col items-center">
            <label htmlFor="newsText" className="text-lg font-medium mb-2 self-start text-teal-300">
              Enter Hausa Text
            </label>
            <textarea
              id="newsText"
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              placeholder="Shugaban Najeriya ya gana da gwamnoni kan matsalar tsaro a kasar. Gwamnonin sun bayyana damuwarsu game da rashin tsaro da kuma bukatar a samar da karin jami'an tsaro domin magance wannan matsala."
              className="w-full min-h-[200px] p-4 border rounded-md shadow-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-800/80 text-gray-100 border-gray-700 backdrop-blur-sm"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded shadow-md transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Classify"
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 w-full max-w-2xl bg-red-900/50 border border-red-700 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {showResults && (
            <div className="mt-10 w-full max-w-2xl bg-gray-800/80 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-700">
              <h2 className="text-xl font-bold mb-4">
                Predicted Topic: <span className="text-purple-300">{results.predictedTopic}</span>
              </h2>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={results.confidenceScores}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      stroke="#9ca3af"
                    />
                    <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, "Confidence"]}
                      labelFormatter={(value) => `${value}`}
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" }}
                    />
                    <Bar dataKey="value" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="py-4 bg-gray-800/80 text-center text-sm text-gray-400 w-full border-t border-gray-700 relative z-10">
        Powered by AfroXLMR-base, trained on MasakhaNEWS dataset
      </footer>
    </div>
  )
}

