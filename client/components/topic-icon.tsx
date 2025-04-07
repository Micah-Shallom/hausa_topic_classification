"use client"

import { useState, useEffect } from "react"
import { Briefcase, Music, Heart, Award, Landmark, Cpu, HelpCircle, BookOpen } from "lucide-react"

type TopicIconProps = {
  topic: string
  size?: number
  color?: string
}

export default function TopicIcon({ topic, size = 64, color = "#ffffff" }: TopicIconProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Trigger animation when component mounts or topic changes
  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 1000)
    return () => clearTimeout(timer)
  }, [topic])

  const getIcon = () => {
    const iconProps = {
      size,
      color,
      className: `transition-all duration-500 ${isAnimating ? "scale-110" : "scale-100"}`,
    }

    switch (topic) {
      case "Business":
        return <Briefcase {...iconProps} />
      case "Entertainment":
        return <Music {...iconProps} />
      case "Health":
        return <Heart {...iconProps} />
      case "Politics":
        return <Landmark {...iconProps} />
      case "Religion":
        return <BookOpen {...iconProps} />
      case "Sport":
        return <Award {...iconProps} />
      case "Technology":
        return <Cpu {...iconProps} />
      default:
        return <HelpCircle {...iconProps} />
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`p-6 rounded-full bg-gray-700/50 backdrop-blur-sm border-2 transition-all duration-500 ${
          isAnimating ? "border-purple-400 shadow-lg shadow-purple-500/20" : "border-gray-600"
        }`}
      >
        {getIcon()}
      </div>
    </div>
  )
}

