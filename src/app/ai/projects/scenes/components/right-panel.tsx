"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import FocusTrap from "focus-trap-react"

interface RightPanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function RightPanel({ open, onClose, title, children, className = "" }: RightPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <FocusTrap>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div
          ref={panelRef}
          className={`
            absolute bg-white shadow-lg rounded-lg
            transform transition-transform duration-300
            ${className}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">{title}</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      </div>
    </FocusTrap>
  )
}

