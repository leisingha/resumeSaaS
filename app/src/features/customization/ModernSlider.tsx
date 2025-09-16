"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

export default function ModernSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Get label based on value
  const getToneProfile = () => {
    if (value < 33) return { title: "Strict", description: "Sticks closely to your provided info." };
    if (value < 66) return { title: "Balanced", description: "Balances your info with creative additions." };
    return { title: "Creative", description: "Takes more creative liberties with your info." };
  }

  // Handle mouse/touch interactions
  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault()

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    setIsDragging(true)
    updateValueFromClientX(clientX)
  }

  const handleInteractionMove = (clientX: number) => {
    if (isDragging) {
      updateValueFromClientX(clientX)
    }
  }

  const handleInteractionEnd = () => {
    setIsDragging(false)
  }

  // Calculate value based on pointer position
  const updateValueFromClientX = (clientX: number) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect()
      // Ensure position is not negative
      const position = Math.max(0, clientX - rect.left)
      const percentage = Math.min(Math.max((position / rect.width) * 100, 0), 100)
      onChange(Math.round(percentage))
    }
  }

  // Event listeners for mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handleInteractionMove(e.clientX)
    }

    const handleMouseUp = () => {
      handleInteractionEnd()
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      // Disable text selection while dragging
      document.body.style.userSelect = "none"
      document.body.style.webkitUserSelect = "none"
    } else {
      // Re-enable text selection when not dragging
      document.body.style.userSelect = ""
      document.body.style.webkitUserSelect = ""
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      // Ensure text selection is re-enabled when component unmounts
      document.body.style.userSelect = ""
      document.body.style.webkitUserSelect = ""
    }
  }, [isDragging, onChange])

  const toneProfile = getToneProfile();

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-2">
        <label className="mb-0 block font-bold text-black dark:text-white mobile-break:text-base text-sm">
          🧑‍🔬 Enhancement
        </label>
        <div className="text-right">
          <div className="mobile-break:text-sm text-xs font-medium text-primary-light">{toneProfile.title}</div>
          <div className="mobile-break:text-xs hidden mobile-break:block text-gray-500 dark:text-gray-400">{toneProfile.description}</div>
        </div>
      </div>

      {/* Slider container with padding to accommodate thumb */}
      <div className="relative py-4">
        {/* Slider track */}
        <div
          ref={sliderRef}
          className="relative h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
          onMouseDown={handleInteractionStart}
          onTouchStart={handleInteractionStart}
          onTouchMove={(e) => {
            e.preventDefault()
            handleInteractionMove(e.touches[0].clientX)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            handleInteractionEnd()
          }}
        >
          {/* Filled track */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>

        {/* Thumb interactive area */}
        <div
          className="absolute top-1/2 h-8 w-8 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ left: `${value}%` }}
          onMouseDown={handleInteractionStart}
          onTouchStart={handleInteractionStart}
        >
          {/* Visible thumb */}
          <div
            className={`w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg border-2 border-purple-500 ${
              isDragging ? 'ring-4 ring-purple-300 ring-opacity-50' : ''
            }`}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 mobile-break:text-xs text-xs text-gray-500 dark:text-gray-400">
        <div>Strict</div>
        <div>Balanced</div>
        <div>Creative</div>
      </div>
    </div>
  )
} 