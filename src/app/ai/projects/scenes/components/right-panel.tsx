import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type React from "react" // Added import for React

interface RightPanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function RightPanel({ open, onClose, title, children }: RightPanelProps) {
  return (
    <div
      className={`
        fixed top-0 bottom-0 right-0 w-80 lg:w-96 bg-white shadow-lg 
        transform transition-transform duration-300 z-10
        ${open ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

