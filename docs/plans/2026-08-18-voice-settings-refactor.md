# Voice Settings Refactoring Task Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor the voice settings structure to support both TTS and Clone configurations.

**Architecture:** Use a unified `VoiceSetting` interface where `tts` and `clone` are sub-properties. Maintain this state in `page.tsx` under `selectedAsset.voice_setting`. Use the active mode's settings when calling flat backend APIs.

**Tech Stack:** Next.js, React, TypeScript

---

### Task 1: Fix Types in types.ts
**Files:**
- Modify: `src/app/ai/projects/value-assets/types.ts`

**Step 1: Check existing `VoiceSetting` type**
Make sure `types.ts` exports `VoiceSetting` with `tts` and `clone` sub-objects. (Currently it does).
Make sure `VoiceConfig` is not used in types (or replace it with `VoiceSetting` across the app).

**Step 2: Commit**
```bash
git add src/app/ai/projects/value-assets/types.ts
git commit -m "Refactor: confirm VoiceSetting interface in types"
```

---

### Task 2: Refactor VoiceSynthesisTab Component
**Files:**
- Modify: `src/app/ai/projects/components/value-assets/VoiceSynthesisTab.tsx`

**Step 1: Update component inputs**
Update `VoiceSynthesisTabProps` and logic to bind fields to `voiceConfig.tts` (e.g. `voiceConfig.tts?.voice`, `voiceConfig.tts?.desc`).
- Update `voice` model selection: read `voiceConfig.tts?.voice`, write to `tts.voice`, `tts.voice_name`, `tts.desc`.
- Update `desc` text area: read `voiceConfig.tts?.desc`, write to `tts.desc`.
- Update `audioPreviewUrl`: read the passed `audioPreviewUrl`.

**Step 2: Verify component typescript compiles**
Expected: compiles clean.

**Step 3: Commit**
```bash
git add src/app/ai/projects/components/value-assets/VoiceSynthesisTab.tsx
git commit -m "Refactor: bind VoiceSynthesisTab to tts sub-object"
```

---

### Task 3: Refactor VoiceCloningTab Component
**Files:**
- Modify: `src/app/ai/projects/components/value-assets/VoiceCloningTab.tsx`

**Step 1: Update component inputs**
Update `VoiceCloningTabProps` to:
- Accept `voiceSetting: VoiceSetting`.
- Accept `audioPreviewUrl: string`.
- Bind recorded text to `voiceSetting.clone?.desc`.
- Bind `audioPreviewUrl` (the cloned preview url) to display the player.
- Pass updated config `clone.desc` / `clone.voice` to `onVoiceSettingChange`.

**Step 2: Commit**
```bash
git add src/app/ai/projects/components/value-assets/VoiceCloningTab.tsx
git commit -m "Refactor: bind VoiceCloningTab to clone sub-object"
```

---

### Task 4: Refactor AudioConfigTab Component
**Files:**
- Modify: `src/app/ai/projects/components/value-assets/AudioConfigTab.tsx`

**Step 1: Update component bindings**
Update `AudioConfigTabProps` to use `VoiceSetting` instead of `VoiceConfig`.
In `AudioConfigTab`:
- Access `voice_setting.vendor`, `voice_setting.emotion`, `voice_setting.is_master`, `voice_setting.mode`.
- Initialize `voice_setting.tts` and `voice_setting.clone` if missing.
- When `mode` changes, set `mode` on the `voice_setting` (top level).
- Pass `voice_setting` to both `VoiceSynthesisTab` and `VoiceCloningTab`.
- Remove "试听效果 - 公共部分" if it's already rendered inside the tabs, or keep it aligned with `currentAudioPreviewUrl`.

**Step 2: Commit**
```bash
git add src/app/ai/projects/components/value-assets/AudioConfigTab.tsx
git commit -m "Refactor: update AudioConfigTab for nested voice settings"
```

---

### Task 5: Refactor AssetDetail Component
**Files:**
- Modify: `src/app/ai/projects/components/value-assets/AssetDetail.tsx`

**Step 1: Fix types**
- Replace `VoiceConfig` imports and props with `VoiceSetting`.
- Pass updated handlers to `AudioConfigTab`.

**Step 2: Commit**
```bash
git add src/app/ai/projects/components/value-assets/AssetDetail.tsx
git commit -m "Refactor: update AssetDetail imports and types"
```

---

### Task 6: Refactor page.tsx
**Files:**
- Modify: `src/app/ai/projects/value-assets/page.tsx`

**Step 1: Update `selectAsset`**
- Initialize `selectedAsset.voice_setting` with default/loaded configurations under `config.voice_setting`, ensuring `tts` and `clone` sub-objects exist.
- Set `mode` state based on loaded `voice_setting.mode`.
- Set `currentVendor` based on loaded `voice_setting.vendor`.

**Step 2: Update `handleVoiceSettingChange`**
- Write parameters to update `selectedAsset.voice_setting` and `selectedAsset.config.voice_setting`.

**Step 3: Update `handleSaveVoiceSetting`**
- Map flat backend payload properties (`vendor`, `gender`, `emotion`, `desc`, `voice`, `voice_name`, `voice_url`) using current mode (`tts` or `clone`) values.

**Step 4: Update `handleAudioPreview` & `handleVoiceClone`**
- Use correct fields of `selectedAsset.voice_setting` to prepare payloads.
- Update `tts.url` or `clone.url` when URLs are generated, and call `handleVoiceSettingChange`.

**Step 5: Commit**
```bash
git add src/app/ai/projects/value-assets/page.tsx
git commit -m "Refactor: implement state management and API mapping in page.tsx"
```
