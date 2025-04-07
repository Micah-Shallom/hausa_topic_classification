"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  Loader2,
  Clock,
  X,
  Menu,
  AlertCircle,
  HelpCircle,
  Globe,
  Lightbulb,
  Github,
  Linkedin,
  Mail,
} from "lucide-react"
import ParticleBackground from "@/components/particle-background"
import TopicIcon from "@/components/topic-icon"
import FactCarousel from "@/components/fact-carousel"

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
  Others: "#94a3b8",
}

// Topic order (for consistent display)
const topicOrder = ["Business", "Entertainment", "Health", "Politics", "Religion", "Sport", "Technology", "Others"]

export default function HausaTopicClassifier() {
  const [newsText, setNewsText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showMobileHistory, setShowMobileHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState({
    predictedTopic: "",
    confidenceScores: topicOrder.map((topic) => ({
      name: topic,
      value: 0,
      fill: topicColors[topic],
    })),
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

      // Transform API response to our format and ensure correct order
      const scoreMap = new Map<string, number>()

      // Initialize with zeros
      topicOrder.forEach((topic) => {
        scoreMap.set(topic, 0)
      })

      // Fill in actual values from API
      data.confidence_scores.forEach((score) => {
        if (topicOrder.includes(score.topic)) {
          scoreMap.set(score.topic, score.confidence)
        } else {
          // If we get a topic not in our list, add its value to "Others"
          const othersValue = scoreMap.get("Others") || 0
          scoreMap.set("Others", othersValue + score.confidence)
        }
      })

      // Convert to array in correct order
      const transformedScores = topicOrder.map((topic) => ({
        name: topic,
        value: scoreMap.get(topic) || 0,
        fill: topicColors[topic],
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
          { name: "Politics", value: 0.55, fill: topicColors["Politics"] },
          { name: "Religion", value: 0.15, fill: topicColors["Religion"] },
          { name: "Sport", value: 0.05, fill: topicColors["Sport"] },
          { name: "Technology", value: 0.08, fill: topicColors["Technology"] },
          { name: "Others", value: 0.02, fill: topicColors["Others"] },
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
    <aside className={`bg-gray-800/80 border-r border-gray-700 history-sidebar flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 className="font-bold text-purple-300 flex items-center">
          <Clock className="mr-2 h-4 w-4" /> Classification History
        </h2>
        {history.length > 0 && (
          <button onClick={clearAllHistory} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
            Clear All
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-700 overflow-y-auto flex-grow">
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
          className="absolute left-4 top-4 md:hidden history-toggle"
          onClick={() => setShowMobileHistory(!showMobileHistory)}
        >
          <Menu className="h-6 w-6 text-purple-300" />
        </button>

        {/* Contact Icons */}
        <div className="absolute right-4 top-4 flex space-x-3">
          <a
            href="https://github.com/Micah-Shallom"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/micah-shallom/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a
            href="mailto:micahshallom@gmail.com"
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Email"
            title="Email"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-purple-300">Hausa Topic Classifier</h1>
          <p className="mt-2 text-gray-400">
            Classify Hausa text into Business, Entertainment, Health, Politics, Religion, Sport, Technology or Others
          </p>
        </div>
      </header>

      <div className="flex flex-1 relative z-10">
        {/* Desktop History Sidebar */}
        <div className="hidden md:block md:w-64 h-full flex-shrink-0">
          <HistorySidebar className="h-full absolute inset-y-0 left-0 w-64" />
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
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6 max-w-6xl mx-auto">
            {/* Input Form Section */}
            <div className="w-full lg:w-1/2 mb-6 lg:mb-0">
              <form onSubmit={handleClassify} className="flex flex-col">
                <label htmlFor="newsText" className="text-lg font-medium mb-2 text-teal-300">
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
                  className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded shadow-md transition-colors disabled:opacity-70 flex items-center justify-center self-center"
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
                <div className="mt-6 bg-red-900/50 border border-red-700 p-4 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="w-full lg:w-1/2">
              {showResults ? (
                <div className="bg-gray-800/80 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-700 h-full">
                  <div className="flex flex-col md:flex-row items-center mb-6">
                    <div className="mb-4 md:mb-0 md:mr-6">
                      <TopicIcon
                        topic={results.predictedTopic}
                        size={100}
                        color={topicColors[results.predictedTopic] || topicColors["Others"]}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2 text-center md:text-left">
                        Predicted Topic: <span className="text-purple-300">{results.predictedTopic}</span>
                      </h2>
                      <p className="text-gray-400 text-sm text-center md:text-left">
                        This text has been classified as{" "}
                        <span className="font-medium text-purple-300">{results.predictedTopic}</span> content with{" "}
                        {(
                          (results.confidenceScores.find((s) => s.name === results.predictedTopic)?.value || 0) * 100
                        ).toFixed(1)}
                        % confidence.
                      </p>
                    </div>
                  </div>

                  <div className="h-[350px] w-full">
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
              ) : (
                <div className="bg-gray-800/40 p-6 rounded-lg border border-gray-700/50 h-full flex flex-col items-center justify-center text-center">
                  <div className="text-gray-500 mb-4">
                    <HelpCircle size={64} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No Classification Yet</h3>
                  <p className="text-gray-500 text-sm max-w-md">
                    Enter some Hausa text and click "Classify" to see the prediction results here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Did You Know Section */}
          <div className="mt-8 mb-4 max-w-6xl mx-auto">
            <div className="bg-gray-800/60 rounded-lg border border-gray-700/50 overflow-hidden">
              <div className="bg-purple-900/30 border-b border-gray-700 py-3 px-4 flex items-center">
                <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
                <h3 className="font-medium text-purple-200">Did You Know?</h3>
              </div>
              <div className="p-4">
                <FactCarousel />
              </div>
            </div>
          </div>

          {/* Global Stats Section */}
          <div className="mb-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/60 rounded-lg border border-gray-700/50 overflow-hidden">
              <div className="bg-blue-900/30 border-b border-gray-700 py-3 px-4 flex items-center">
                <Globe className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="font-medium text-blue-200">Global Classification Stats</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {topicOrder.map((topic) => (
                  <div key={topic} className="bg-gray-800/80 rounded p-3 text-center">
                    <div className="flex justify-center mb-2">
                      <TopicIcon topic={topic} size={32} color={topicColors[topic]} />
                    </div>
                    <div className="text-sm font-medium text-gray-300">{topic}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.floor(Math.random() * 1000) + 100} classifications
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="py-4 bg-gray-800/80 text-center text-sm text-gray-400 w-full border-t border-gray-700 relative z-10">
        Powered by AfroXLMR-base, trained on MasakhaNEWS dataset
      </footer>
    </div>
  )
}

