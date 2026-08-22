import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { MutableRefObject } from 'react'
import { SuggestionList } from './SuggestionList'

interface Asset {
    id: number
    name: string
    images?: { id: number; url: string }[]
}

export default (assetsRef: MutableRefObject<Asset[]>) => ({
    items: ({ query }: { query: string }) => {
        console.log('Suggestion items called, assets:', assetsRef.current)
        if (!query) {
            return assetsRef.current.slice(0, 10)
        }
        return assetsRef.current.filter(asset => asset.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    },

    render: () => {
        let component: ReactRenderer<any>
        let popup: TippyInstance[]

        return {
            onStart: (props: any) => {
                console.log('Suggestion onStart, assets:', assetsRef.current)

                component = new ReactRenderer(SuggestionList, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                    onCreate: () => {
                        console.log('Popup created')
                    }
                })
            },

            onUpdate(props: any) {
                console.log('Suggestion onUpdate, assets:', assetsRef.current)
                component.updateProps({
                    ...props,
                    items: assetsRef.current,
                    asset_image_map: props.asset_image_map  // Pass asset_image_map to SuggestionList
                })

                if (!props.clientRect) {
                    return
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide()
                    return true
                }
                return component.ref?.onKeyDown(props)
            },

            onExit() {
                popup[0].destroy()
                component.destroy()
            },
        }
    },
})
