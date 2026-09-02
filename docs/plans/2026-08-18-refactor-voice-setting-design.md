# Design Document: Voice Setting Refactoring

Refactoring the value assets voice configuration flow to match the new `VoiceSetting` structure.

## Proposed Architecture

1. **State Ownership**:
   - `selectedAsset` in `page.tsx` is the single source of truth for the asset being edited.
   - We will parse `asset.config` (if a string) in `selectAsset` to extract `voice_setting`.
   - We will set `selectedAsset.voice_setting` with the parsed config's `voice_setting`, initializing `tts` and `clone` empty structures if not present.

2. **Component Updates**:
   - **`VoiceSynthesisTab.tsx`**:
     - Receives `voiceConfig` (which is `voice_setting.tts` or the whole `voice_setting` - we will pass the whole `voice_setting` to keep gender & vendor access, but map synthesis controls to `tts` sub-object).
     - Displays `voiceConfig.tts?.voice`, `voiceConfig.tts?.desc`.
     - When changing fields, invokes `onVoiceConfigChange` updating `voice_setting.tts`.
   - **`VoiceCloningTab.tsx`**:
     - Receives `voiceSetting` (the whole `voice_setting` representing the current asset setting).
     - Displays recorded text (`voiceSetting.clone?.desc`) and cloned preview URL (`audioPreviewUrl`).
     - When recording/updating text/cloning, updates `voiceSetting.clone`.
   - **`AudioConfigTab.tsx`**:
     - Receives `selectedAsset` (which has `voice_setting` at the top level).
     - Manages common fields (`vendor`, `emotion`, `is_master`, `mode`) at the top level of `voice_setting`.
     - Passes down the relevant preview audio URLs (`audioPreviewUrl_tts`, `audioPreviewUrl_clone`).

3. **Backend Communication (API Payload preservation)**:
   - When calling `handleAudioPreview` or `handleSaveVoiceSetting` or `handleVoiceClone`, we will build the exact payload structure matching the backend's expectations from the active mode's settings.

## Implementation Details

### VoiceSetting Structure
```typescript
export interface VoiceSetting {
    voice: string;
    voice_name: string;
    desc: string;
    gender: string;
    emotion: string;
    vendor: string;
    is_master: boolean;
    mode?: string; // tts | clone
    tts?: {
        url: string;
        desc: string;
        voice: string;
        voice_name: string;
    };
    clone?: {
        url: string;
        desc: string;
        voice: string;
        voice_name: string;
    };
}
```
