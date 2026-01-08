# Formation Guidebook UI Roadmap

**Project:** Formation Guidebook UI
**Start Date:** 2026-01-08
**Current Phase:** 1

---

## Phase 1: Checkpoint Submission Enhancement
**Goal:** Complete the checkpoint submission flow with validation and word count tracking

**Status:** 🔵 Not Started
**Requires:** Existing checkpoint form foundation
**Research:** No - standard form validation and client-side word counting

**Work:**
- Add word count tracker with 50-word minimum enforcement
- Enhance dwell timer UI with progress indicator
- Implement submit button disabled state until requirements met
- Add client-side validation with clear error messages
- Persist draft reflections to localStorage for recovery

**Output:** Checkpoint submission meets all validation requirements before backend submission

---

## Phase 2: Voice Input & Transcription
**Goal:** Enable voice dictation as alternative to text input for reflections

**Status:** ⚪ Not Started
**Requires:** Phase 1 (validation must work for both input types)
**Research:** Likely - OpenAI Whisper API integration patterns

**Work:**
- Add voice recording UI component with start/stop/pause controls
- Integrate OpenAI Whisper API for real-time transcription
- Display transcribed text in reflection textarea (editable)
- Handle audio chunking for long recordings
- Add error handling for transcription failures
- Test word count validation works with transcribed text

**Output:** Users can dictate reflections via voice, see live transcription, edit if needed

---

## Phase 3: AI Analysis Integration
**Goal:** Call Formation Engine for depth scoring and display quality metrics

**Status:** ⚪ Not Started
**Requires:** Phase 1 (submissions must be validated first)
**Research:** No - Formation Engine API is documented

**Work:**
- Call Formation Engine API after checkpoint submission
- Display AI analysis results (specificity, honesty, alignment scores)
- Show sharpening questions from AI feedback
- Implement loading states during AI processing
- Handle API failures gracefully with retry option
- Store analysis results in formation-reflection records

**Output:** Every reflection receives AI analysis with actionable feedback

---

## Phase 4: Routing Logic Implementation
**Goal:** Implement full publish/journal/thread/review routing decisions

**Status:** ⚪ Not Started
**Requires:** Phase 3 (routing depends on AI analysis scores)
**Research:** No - routing rules defined in roadmap document

**Work:**
- Implement routing decision logic based on depth scores
- Create publish flow (reflection becomes public testimony)
- Create journal flow (private reflection, no follow-up)
- Create thread flow (reflection continues with deeper prompts)
- Create review flow (reflection needs revision before progress)
- Display routing decision clearly to user with explanation
- Persist routing decisions in formation-event log

**Output:** Reflections route correctly based on AI analysis, users understand next steps

---

## Phase 5: Canon Axiom Unlocking
**Goal:** Check prerequisites and unlock canon axioms as users progress

**Status:** ⚪ Not Started
**Requires:** Phase 4 (unlocking happens after routing decisions)
**Research:** No - axiom data structure exists in formation system

**Work:**
- Query axiom prerequisites from Formation Engine
- Check if prerequisites satisfied after each checkpoint
- Unlock axiom if criteria met, persist unlock state
- Display newly unlocked axioms with visual celebration
- Show locked/unlocked states in axiom library view
- Ensure unlocks persist across sessions/devices

**Output:** Axioms unlock reliably when prerequisites met, state persists

---

## Phase 6: Progress Dashboard
**Goal:** Build comprehensive progress tracking UI with timeline and metrics

**Status:** ⚪ Not Started
**Requires:** Phases 1-5 (tracks all formation activities)
**Research:** No - uses existing formation state data

**Work:**
- Create dashboard layout with checkpoint completion grid
- Add phase readiness scoring visualization
- Build recent activity timeline with event log
- Show next checkpoint preview with phase progress
- Display axiom unlock history
- Add reflection archive with search/filter
- Mobile-responsive dashboard layout

**Output:** Users see complete formation journey progress at a glance

---

## Phase 7: Error Handling & Polish
**Goal:** Refine error handling, validation messages, and edge cases

**Status:** ⚪ Not Started
**Requires:** Phases 1-6 (polish on complete feature set)
**Research:** No - refinement of existing features

**Work:**
- Review all validation messages for clarity
- Implement duplicate submission prevention
- Add partial failure recovery without state corruption
- Handle network failures gracefully with local caching
- Add loading states and optimistic UI updates
- Fix XSS vulnerabilities (sanitize HTML in 7 locations per CONCERNS.md)
- Comprehensive error logging for debugging

**Output:** All edge cases handled gracefully, users never see cryptic errors

---

## Domain Expertise

None - standard web development patterns apply (form validation, API integration, state management)

---

## Completion Criteria

Formation Guidebook is complete when:
- [x] Users can submit checkpoints via text or voice
- [x] All validation requirements enforced (50 words, 2 min dwell)
- [x] AI analysis returns reliably for every reflection
- [x] Routing decisions execute correctly based on scores
- [x] Axioms unlock when prerequisites satisfied
- [x] Progress persists across sessions/devices
- [x] All user flows tested end-to-end without errors
- [x] Error handling prevents state corruption
- [x] Security vulnerabilities (XSS) fixed

**Success metric:** User can complete full formation journey from Awakening to Stewardship without encountering bugs or unclear states.
