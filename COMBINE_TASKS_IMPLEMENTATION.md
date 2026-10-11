# Combine Tasks Implementation Summary

## Overview
Implemented **Option A (Quick View)** and **Option B (Detailed Panel)** for displaying combine tasks in the Scenes page.

## Architecture

### Components Created

1. **CombineTasksPanel.tsx** (`src/app/ai/projects/scenes/components/combine-tasks-panel.tsx`)
   - Displays all combine tasks for the current project
   - Shows task list with columns: ID, Status, Progress, Time, Preview
   - Supports expand/collapse for each task
   - Fetches data from `/api/v2/task/list` API
   - Auto-refreshes every 5 seconds
   - Video player and download for completed tasks

2. **CombineTasksQuickView.tsx** (`src/app/ai/projects/scenes/components/combine-tasks-quick-view.tsx`)
   - Compact view next to Merge button
   - Shows quick stats: "Combine Tasks: X running"
   - Badge for completed and failed tasks
   - Click arrow to open detailed panel

3. **Updated Types** (`src/app/ai/projects/types.ts`)
   - Added `TaskStatusItem` interface matching backend response
   - Added `TaskStats` interface for quick statistics
   - Fixed TypeScript `int` → `number` type error

4. **Updated Utilities** (`src/lib/utils.ts`)
   - Added `formatDuration()` function for MM:SS format

## API Integration

### Backend Endpoints

1. **Task List**: `GET /api/v2/task/list`
   - Parameters:
     - `project_id` (int)
     - `stage_id` (int)
     - `user_id` (int)
     - `only_combination` (bool, default: true)
     - `start` (int, default: 0)
     - `page_size` (int, default: 100)
   - Response: `TaskStatusResponseList` with array of `TaskStatusItem`

2. **Quick Summary**: `GET /api/v2/task/quick_summary`
   - Returns: `{ total, completed, running, fail }`
   - Currently not used but available in backend

### Data Flow

```
User clicks Merge button
    ↓
Backend accepts task → WebSocket: createVideoCombinationAccepted
    ↓
WebSocket callback updates local state
    ↓
CombineTasksPanel auto-refreshes every 5 seconds
    ↓
Quick View shows updated stats
```

## Page Integration

### Updates to `page.tsx`

1. Added imports for new components
2. Added state: `isCombineTasksPanelOpen`
3. Added state: `userId` (from local cache)
4. Added callback: `handleCloseCombineTasksPanel`
5. Integrated CombineTasksQuickView in top bar
6. Integrated CombineTasksPanel as modal

### Layout

```
[Scenes Panel]
  Left Panel (20%):
    - Scene list
    - Merge Button
    - Combine Tasks Quick View (Option A)

  Right Panel (80%):
    - Scene/Storyboard settings

  Overlay:
    - Merge Panel (modal)
    - Combine Tasks Panel (modal) - Option B
```

## Key Features

### CombineTasksPanel (Option B)
- Lists all tasks for current project
- Task columns:
  - Task ID (truncated to last 6 chars)
  - Status badge (PENDING, RUNNING, COMPLETED, FAILED)
  - Progress bar (0-100%)
  - Message/Description
  - Created/Updated timestamps
  - Video preview (for completed tasks)
  - Download button (for completed tasks)
  - Error message display (for failed tasks)
- Expandable task cards for details
- Auto-refresh every 5 seconds
- Loading state indicator

### CombineTasksQuickView (Option A)
- Compact display showing only running tasks
- Shows: "Combine Tasks: X running"
- Badges for completed (✓) and failed (✗) tasks
- Click arrow to open detailed panel

## WebSocket Integration

The merge adapter in `use-merge-adapter.ts` continues to handle WebSocket callbacks:

1. **createVideoCombinationAccepted**: New task created
2. **createVideoCombinationProgress**: Task progress updates
3. **createVideoCombinationComplete**: Task completed
4. **createVideoCombinationError**: Task failed

The CombineTasksPanel component independently fetches data from the API to maintain its own task list and statistics.

## User Flow

1. User opens Scenes page for a project
2. **Quick View** (Option A) appears next to Merge button
3. User clicks Merge button → Opens Merge Panel
4. User selects storyboards → Starts merge
5. Backend accepts task → Task appears in Quick View and Detailed Panel
6. **Option B Panel** shows real-time progress updates every 5 seconds
7. When task completes → Shows video preview and download button
8. User can expand task to see details, timestamps, and play video

## Testing

The development server is running at http://localhost:3002

### Manual Testing Checklist

- [ ] Quick View appears next to Merge button
- [ ] Clicking arrow opens Detailed Panel
- [ ] Panel shows task list (empty if no tasks)
- [ ] Clicking Merge opens Merge Panel
- [ ] Selecting storyboards and starting merge creates a task
- [ ] Task appears in Combine Tasks Panel after a few seconds
- [ ] Progress updates every 5 seconds
- [ ] Completed task shows video player and download button
- [ ] Failed task shows error message
- [ ] Panel auto-refreshes every 5 seconds

## Notes

1. The serializable props warnings (TypeScript) are not critical and don't affect functionality
2. Task list fetching is independent of WebSocket for better data consistency
3. Auto-refresh interval can be adjusted (currently 5 seconds)
4. The `only_combination: true` parameter filters to only combination tasks

## Future Enhancements

- Add "Cancel Task" functionality
- Add "Delete Task" functionality
- Show total duration for combined videos
- Add task filtering (by status, date range)
- Add task search functionality
