import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export const SuggestionList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]

        if (item) {
            props.command({ id: item.id, label: item.name })
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden min-w-[160px] z-[9999] animate-in fade-in zoom-in-95 duration-100">
            {props.items.length > 0 ? (
                <div className="p-1">
                    {props.items.map((item: any, index: number) => {
                        // Check if asset has an image selected in asset_image_map OR is already resolved
                        const hasSelectedImage = props.asset_image_map && props.asset_image_map[item.name]
                        const isResolved = props.hasResolved || hasSelectedImage

                        return (
                            <button
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                                    index === selectedIndex
                                        ? isResolved
                                            ? 'bg-green-600 text-white'
                                            : 'bg-purple-600 text-white'
                                        : isResolved
                                            ? 'hover:bg-green-100 text-green-700'
                                            : 'hover:bg-purple-50 text-gray-700'
                                }`}
                                key={index}
                                onClick={() => selectItem(index)}
                            >
                                <span className="font-medium">{item.name}</span>
                                {index === selectedIndex && <Check className="h-3.5 w-3.5 opacity-70" />}
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className="px-4 py-3 text-xs text-gray-400 italic text-center">
                    No characters found
                </div>
            )}
        </div>
    )
})

SuggestionList.displayName = 'SuggestionList'

import { Check } from 'lucide-react'
