# SceneSettings Component

A reusable component for displaying and editing scene settings with a **compact, clean layout**.

## Location

- **Main Component**: `src/components/scene-settings/SceneSettings.tsx`
- **Shared Types**: `src/types/scene-settings.ts`
- **API Utility**: `src/lib/api/scene-api.ts`
- **Custom Hooks**: `src/hooks/useSceneState.ts`, `src/hooks/useAssetList.ts`, `src/hooks/useGalleryNavigation.ts`
- **Subcomponents**:
  - `SceneMetaSection.tsx` - Scene title and description editing
  - `AssetReferenceMap.tsx` - Asset reference display
  - `VisualReferenceGallery.tsx` - Interactive image gallery with keyboard nav
  - `ScenePromptSection.tsx` - Prompt generation interface
  - `SceneVideoPanel.tsx` - Video display
  - `ImageViewerDialog.tsx` - Image zoom dialog

## Design

**Compact Layout**: The component is designed with a minimal, space-efficient layout:
- Reduced padding and margins throughout
- Smaller typography (9-11px labels, 10-14px text)
- Compact grids and panels
- Minimal borders and shadows
- Focused on essential information

## Usage

### Basic Usage

```tsx
import { SceneSettings } from '@/components/scene-settings'

function MyPage() {
  const [scene, setScene] = useState<Scene>(initialScene)

  const handleUpdate = (key: string, value: any) => {
    setScene(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SceneSettings
      scene={scene}
      onUpdate={handleUpdate}
    />
  )
}
```

### Advanced Usage (Customize Subcomponents)

```tsx
import {
  SceneSettings,
  SceneMetaSection,
  VisualReferenceGallery
} from '@/components/scene-settings'

function MyPage() {
  const [scene, setScene] = useState<Scene>(initialScene)

  return (
    <SceneSettings
      scene={scene}
      onUpdate={(key, value) => setScene(prev => ({ ...prev, [key]: value }))}
    >
      {/* Override default sections */}
      <SceneMetaSection customProps={value} />
      <VisualReferenceGallery customProps={value} />
    </SceneSettings>
  )
}
```

## Props

### SceneSettingsProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `scene` | `Scene` | Yes | Scene data object (id, title, description, prompt, etc.) |
| `onUpdate` | `(key: string, value: any) => void` | Yes | Callback for state updates |

## Features

- ✅ Keyboard navigation for image gallery (← → arrow keys)
- ✅ Zoom images in dialog
- ✅ Generate scene images from prompts
- ✅ Asset reference map with clickable images
- ✅ Visual reference gallery with history thumbnails
- ✅ Scene pre-vis video display
- ✅ Auto-fetch assets from API
- ✅ Loading states
- ✅ Error handling with toast notifications
- ✅ Modular and customizable
- ✅ Compact, clean layout

## Technical Details

### Data Flow

1. **Props In**: Scene data is passed as props
2. **State Management**: Custom hooks manage local state (title, description, prompt, previewIndex)
3. **Updates**: Parent component receives updates via `onUpdate` callback
4. **API Calls**: Centralized in `sceneApi` utility

### Custom Hooks

#### useSceneState
Manages scene metadata with automatic sync from props.

```typescript
const { title, setTitle, description, setDescription, prompt, setPrompt, handleUpdate } = useSceneState(scene)
```

#### useAssetList
Fetches and manages asset list for a project/stage.

```typescript
const { assets, loading, error } = useAssetList(projectId, stageId)
```

#### useGalleryNavigation
Manages gallery navigation with keyboard support.

```typescript
const { previewIndex, setPreviewIndex } = useGalleryNavigation(imageUrls, -1)
```

### API Utility

All API calls are centralized in `sceneApi`:

```typescript
import { sceneApi } from '@/lib/api/scene-api'

// List assets
sceneApi.listAssets(projectId, stageId, true)

// Generate scene image
sceneApi.generateSceneImage(sceneId, projectId, stageId, prompt)

// Update scene
sceneApi.updateScene(id, projectId, stageId, data)
```

## Migration from Legacy Path

### Old Path
```tsx
import { SceneSettings } from './components/scene-settings'
```

### New Path
```tsx
import { SceneSettings } from '@/components/scene-settings'
```

### No Changes Needed
The props interface remains identical:
```tsx
<SceneSettings
  scene={selectedScene}
  onUpdate={(key, value) => handleSceneUpdate(key, value)}
/>
```

## Dependencies

- React 18+
- Tailwind CSS
- Radix UI components (Button, Textarea, Input, Label, Dialog)
- lucide-react icons
- Custom hooks (useSceneState, useAssetList, useGalleryNavigation)

## Future Enhancements

- [ ] Add character image selection dialog
- [ ] Support for storyboard nodes
- [ ] Advanced image editing features
- [ ] Export scene configuration
- [ ] Integration with storyboarding

## Design Principles

1. **Compact**: Minimal padding, smaller fonts, efficient use of space
2. **Clean**: Minimal borders, subtle shadows, focused on content
3. **Usability**: All features accessible, keyboard navigation supported
4. **Scalable**: Components can be used independently
5. **Maintainable**: Clear structure with well-documented sections
