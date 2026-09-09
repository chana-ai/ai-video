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
        // Check if this asset is already in editor as a resolved mention
        const text = props.editor.getText()
        const regex = new RegExp(`@${props.query}\\S*`)
        const match = text.match(regex)

        let hasResolved = false

        if (match) {
          const assetName = match[0].substring(1) // Remove @

          // Check if this exact mention already exists in editor
          const doc = props.editor.state.doc
          let mentionFound = false
          let hasResolvedMention = false

          doc.descendants((node: any) => {
            if (!mentionFound && node.type.name === 'mention') {
              const nodeAssetName = node.attrs.label || node.attrs.dataAssetName
              if (nodeAssetName === assetName) {
                mentionFound = true
                hasResolvedMention = node.attrs.resolved === true
              }
            }
          })

          hasResolved = hasResolvedMention
        }

        component = new ReactRenderer(SuggestionList, {
          props: {
            ...props,
            hasResolved: hasResolved
          },
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
        const text = props.editor.getText()
        const regex = new RegExp(`@${props.query}\\S*`)
        const match = text.match(regex)

        let hasResolved = false

        if (match) {
          const assetName = match[0].substring(1) // Remove @

          // Check if this exact mention already exists in editor
          const doc = props.editor.state.doc
          let mentionFound = false
          let hasResolvedMention = false

          doc.descendants((node: any) => {
            if (!mentionFound && node.type.name === 'mention') {
              const nodeAssetName = node.attrs.label || node.attrs.dataAssetName
              if (nodeAssetName === assetName) {
                mentionFound = true
                hasResolvedMention = node.attrs.resolved === true
              }
            }
          })

          hasResolved = hasResolvedMention
        }

        component.updateProps({
          ...props,
          items: assetsRef.current,
          asset_image_map: props.asset_image_map,
          hasResolved: hasResolved
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

        // Only intercept up/down/enter for suggestion navigation
        // Let left/right arrow keys pass through to editor for cursor movement
        if (props.event.key === 'ArrowUp' || props.event.key === 'ArrowDown' || props.event.key === 'Enter') {
          return component.ref?.onKeyDown(props)
        }

        return false
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
})
