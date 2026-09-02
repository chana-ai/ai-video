"use client"

import React, { useState } from 'react'
import { Triangle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MergeSelection } from './hooks/use-merge-adapter'

interface MergeButtonProps {
  onClick: () => void
  isPanelOpen: boolean
  isMerging: boolean
  selection: MergeSelection
  disabled?: boolean
  className?: string
}

export function MergeButton({
  onClick,
  isPanelOpen,
  isMerging,
  selection,
  disabled = false,
  className = ""
}: MergeButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getButtonText = () => {
    if (isMerging) return "Merging..."
    if (selection.storyboardIds.length === 0) return "Merge"
    return `Merge (${selection.storyboardIds.length})`
  }

  const getButtonVariant = () => {
    if (disabled) return "outline"
    if (isPanelOpen) return "default"
    return "outline"
  }

  const getButtonColor = () => {
    if (disabled) return ""
    if (isMerging) return "bg-orange-600 hover:bg-orange-700 text-white"
    if (isPanelOpen) return "bg-blue-600 hover:bg-blue-700 text-white"
    return ""
  }

  return (
    <Button
      variant={getButtonVariant()}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getButtonColor()}
        ${className}
        transition-all duration-200
        relative overflow-hidden
        ${isHovered && !disabled ? 'shadow-md' : ''}
        flex items-center gap-2
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isMerging ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {getButtonText()}
        </>
      ) : (
        <>
          {isPanelOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <Triangle className="h-4 w-4" />
          )}
          {getButtonText()}
        </>
      )}

      {/* 选中指示器 */}
      {selection.storyboardIds.length > 0 && (
        <div className="absolute -top-1 -right-1">
          <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selection.storyboardIds.length}
          </span>
        </div>
      )}

      {/* 提示信息 */}
      {selection.storyboardIds.length === 0 && !isMerging && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          点击打开合并面板
        </div>
      )}
    </Button>
  )
}