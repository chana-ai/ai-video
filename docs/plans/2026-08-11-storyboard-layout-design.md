# Design Document: StoryboardSettings Layout Refactoring
Date: 2026-08-11

## Goal
Refactor the visual layout of the `StoryboardSettings` component to group related functionalities into cohesive, modular visual components:
1. **Storyboard Description**: Title and scene description shown at the top of the interface.
2. **Image Component**: Houses the image uploader, actor selection, image prompt chatbox, and the image display box.
3. **Voice Component**: Houses the dialogue script editor (narration vs. dialogue lines), speed and emotion settings, audio track player, and sync audio buttons.
4. **Video Component**: Houses the video player (renders when `video_url` is present), video model selection, video prompt generator, video prompt textarea, and the generate video button.

## Layout Architecture
The interface will be restructured into a full-width header followed by a two-column resizable layout:

```
+-------------------------------------------------------------+
| Storyboard Description                                      |
+------------------------------+------------------------------+
| Left Column (Image & Voice)  | Right Column (Video)         |
|                              |                              |
| +--------------------------+ | +--------------------------+ |
| | Image Component          | | | Video Component          | |
| | - Image Box              | | | - Video Player           | |
| | - Upload & Actors Buttons| | | - Model & Prompt Buttons  | |
| | - PromptChatbox          | | | - Video Prompt Textarea  | |
| +--------------------------+ | | - Generate Video Button  | |
|                              | +--------------------------+ |
| +--------------------------+ |                              |
| | Voice Component          | |                              |
| | - Script Editor          | |                              |
| | - Speed & Emotion Select | |                              |
| | - Play & Sync buttons    | |                              |
| +--------------------------+ |                              |
+------------------------------+------------------------------+
```

## Details of Each Component Group

### 1. Header / Description Group
- Full width top header showing Title and description paragraph.

### 2. Image Component
- Display card with `aspect-video` containing the storyboard's image preview. Clicking zooms the image.
- A horizontal bar with "Upload Image" and "Choose Reference Characters" buttons.
- The `PromptChatbox` for tweaking the image prompt and viewing history.

### 3. Voice Component
- Dialogue/Narration editor textarea or dialogue list.
- Voice configuration parameters: Speed selector, Emotion selector.
- Playback controls (Play/Pause) and "Sync Audio" button.

### 4. Video Component
- Embedded `<video>` element if `video_url` is present.
- Dropdown selector for video model choice (MINMAX vs. WAN) and "Generate Video Prompt" button.
- Video prompt textarea.
- The "GENERATE VIDEO" action button anchored at the bottom of the video component panel.

## Verification
- Run `npm run lint` and verify clean output.
- Compile check using TypeScript `tsc --noEmit`.
