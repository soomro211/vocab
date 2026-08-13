# Lexicon — SAT Vocabulary Builder · Worklog

## Project Status

**Phase:** Round 13 (Mobile layout/UX overhaul — no-scroll quiz, flashcards,
and compact all views) — COMPLETE & verified.

Improved all mobile interfaces to minimize scrolling: quiz question + options
+ Next button now fit on screen; flashcard + controls fit on screen; quiz
setup Start button visible without scrolling; dashboard/word list more
compact. Desktop layout unchanged. Lint clean, no runtime errors.

The app is a clean, minimalistic, dark-themed SAT vocabulary trainer built on
Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion + Zustand
(with localStorage persistence). It is fully functional and has been
end-to-end verified in the browser (desktop + mobile viewports).

---

## Task ID: 1
Agent: main (Z.ai Code)
Task: Build the complete SAT Vocabulary Building app from scratch.

Work Log:
- Defined a sophisticated dark theme in `src/app/globals.css` using oklch
  neutrals (no indigo/blue), with three muted status colors
  (`--mastered` emerald, `--learning` amber, `--new` gray) and helper
  utilities (`font-serif-display`, `bg-grain`, `glow-mastered`, 3D flip helpers).
- Wired `Newsreader` serif + `Geist` sans in `layout.tsx`, forced dark theme via
  `next-themes` Providers, added Sonner + Toaster.
- Added `allowedDevOrigins` to `next.config.ts` to silence cross-origin warning.
- Created types (`src/lib/types.ts`), two curated 35-word pre-made lists
  (`src/lib/word-data.ts`: Vocabulary + Transitions, each with definition +
  example + part of speech), the Zustand store with persist middleware
  (`src/lib/store.ts`) implementing the mastery rules:
    • correct → streak +1; streak ≥ 3 ⇒ "mastered"
    • wrong   → streak 0, status → "learning"
  plus manual "learned" toggle, per-word reset, category reset, and import.
- Built analytics helpers (`src/lib/stats.ts`) + `useVocabStats` hook.
- Built the app shell: floating glass desktop `Navbar` (brand + pill nav +
  category switcher + stats ribbon + reset dropdown), mobile `BottomNav`
  (fixed, safe-area aware), sticky `Footer`, `AppShell` wrapper with ambient
  gradient + grain, mobile full-width category switcher row.
- Built five views:
    • `dashboard-view` — hero, 4 stat cards, mastery breakdown bars, status-mix
      donut (recharts), accuracy radial, cross-category comparison, "needs
      attention" + "recently mastered" lists.
    • `word-list-view` — search + filter pills (all/new/learning/mastered/learned)
      with animated pill, responsive 2-col word cards (term, definition,
      example quote, status badge, accuracy/streak, learned toggle, reset, study).
    • `flashcard-view` — key-based remount deck, 3D flip card (front=term,
      back=definition+example), prev/next/reveal, shuffle, mark learned,
      keyboard nav (←/→/Space), status badge.
    • `quiz-view` — setup (5/10/20/All), playing (term + 4 definition choices,
      immediate color feedback, streak pill, feedback banner with mastery
      callout), results (accuracy, best streak, newly mastered, review list).
    • `import-view` — text/JSON parser (`term | definition | example` lines or
      JSON array), live preview with validation, target category switcher,
      load-sample, manage/remove existing imports.
- Wired `src/app/page.tsx` with AnimatePresence tab transitions.
- Ran `bun run lint` — 0 errors, 0 warnings (fixed `set-state-in-effect` by
  refactoring FlashcardView to a key-based remount pattern).

Stage Summary:
- Lint: clean. Dev server: running on :3000, no runtime errors.
- agent-browser verification (desktop 1440×900 + mobile 390×844):
    • Dashboard renders all analytics; switching Vocabulary↔Transitions
      updates the heading + word list instantly.
    • Quiz flow verified: question display → answer → correct ("Streak: 1/3
      toward mastery") / incorrect ("Not quite" + correct def) → results.
    • Dashboard analytics reflect quiz progress (33% accuracy, 3 attempted,
      1 best streak after test session).
    • Flashcard flip works (button toggles "Reveal definition"↔"Show term").
    • Import flow verified: typed 2 custom words → preview → imported → word
      list count went 35 → 37, import manageable/removable.
    • Word list search + filters + learned toggle + per-word reset all work.
    • Mobile: bottom nav (5 items) present, clean top, no overflow, footer
      sits at bottom with no floating gap.
- VLM visual review: "high-quality, professional UI", subtle readable dark
  theme, elegant serif typography, balanced spacing, no unintended
  indigo/blue, modern non-generic navbar.
- Reset test data (cleared localStorage) so the user starts fresh.

Unresolved / next-phase recommendations (from Round 1 — all addressed in Round 2):
- No auth / multi-device sync (by design — single-user local app). Could add
  optional export/import of progress JSON.  ✅ DONE (Round 2)
- Flashcard deck could offer a "focus: not mastered" filter.  ✅ DONE (Round 2)
- Quiz could support term↔definition direction toggle and a timed mode.  ✅ DONE direction (Round 2)
- Could add pronunciation (TTS) for each word — the TTS skill is available.  ✅ DONE (Round 2)
- Charts could show a 7-day activity trend once timestamps accumulate.  ✅ DONE (Round 2)

---

## Task ID: 2
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Round 1 built a complete, working app. Lint clean, no runtime errors.
- agent-browser QA (desktop + mobile) + VLM visual review surfaced real defects
  and improvement opportunities. No build/runtime errors; one hydration error
  found mid-round (nested <button>) and fixed.

### QA findings (via agent-browser + VLM)
- Flashcard back face was top-heavy with empty space at the bottom.
- Keyboard hint row on flashcards was cramped/cluttered.
- Quiz progress bar had very low contrast.
- Navbar stats ribbon text had low contrast.
- Hydration error: quiz option <button> contained a SpeakButton <button>.
- TTS API initially failed (`mp3` response_format unsupported by the SDK) →
  switched to `wav`, now returns valid 64KB 16-bit/24kHz mono audio.

### Completed modifications
**Bug fixes:**
1. Flashcard back face: restructured to a 3-row flex layout (header / centered
   content / footer) with explicit py overrides — now vertically balanced.
   VLM confirmed "no large empty void, layout feels balanced".
2. Flashcard keyboard hint: redesigned into a clean centered row with proper
   `<kbd>` styling and improved contrast (text-foreground/70 on muted/50 bg).
3. Quiz progress bar: replaced the faint `<Progress>` with a custom animated
   bar using `bg-foreground/15` track + `bg-foreground/80` fill — much higher
   contrast.
4. Navbar stats ribbon: upgraded from low-contrast uppercase muted text to a
   structured layout with bold `text-foreground/80` values + muted labels,
   taller dividers.
5. Hydration error: converted quiz option from `<button>` to `<div role="button">`
   with proper tabIndex + onKeyDown, so the nested SpeakButton is valid HTML.
   Console errors cleared after reload.

**New features:**
6. TTS pronunciation — server-side Next.js API route (`/api/tts`) using
   z-ai-web-dev-sdk with `jam` voice (English) at 0.9× speed, in-memory LRU
   cache (80 entries, 24h immutable HTTP cache). Client `speak()` helper uses
   a shared HTMLAudioElement. Shared `<SpeakButton>` component used in:
   word list cards, flashcard front + back, quiz question (term mode), quiz
   options (def→term mode after reveal), quiz feedback banner, quiz review list.
7. Quiz direction toggle — "Term → Definition" (default) and "Definition →
   Term". Persisted in the Zustand store. Setup screen shows two cards; the
   playing header shows the current direction; options render terms or
   definitions accordingly.
8. Flashcard focus-deck filter — animated pill switcher (All / Learning / Not
   mastered) with live counts; empty state with "Show all cards" CTA.
9. Progress backup & restore — store now has `exportProgress()` (JSON with
   progress/activity/imports/preferences) and `importProgress(json)`. Import
   view has a "Backup & restore" card with stats (tracked words, answers
   logged, custom words), Export (downloads `lexicon-progress-YYYY-MM-DD.json`),
   and Restore-from-file (FileReader → store import).
10. 7-day activity trend chart — store now logs an `ActivityEvent` per answer
    (ts, wordId, category, correct). Dashboard has a new "7-day activity"
    section with a stacked BarChart (correct=emerald, incorrect=red), legend,
    best-day + weekly-accuracy summary, and an empty state with a quiz CTA.
11. Store schema additions: `activity: ActivityEvent[]`, `quizDirection`,
    `setQuizDirection`, `exportProgress`, `importProgress`. All persisted.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile errors.
- agent-browser end-to-end:
  - Dashboard renders all analytics + new activity chart (verified: 2 correct,
    3 missed, 1/7 active days, 40% weekly accuracy after a test quiz).
  - Quiz def→term mode verified: question shows definition, options are terms,
    pronounce buttons appear on options after reveal + in feedback + review.
  - Flashcard flip + focus filter + pronounce all work.
  - Word list pronounce buttons present on every card.
  - Export downloads a JSON file; localStorage state confirmed intact
    (5 tracked words, 5 activity events, quizDirection="def-to-term").
  - No console/hydration errors after the nested-button fix.
  - TTS API: `curl POST /api/tts` → HTTP 200, 64KB valid WAV; cached second
    call returns in 15ms (vs 1.8s first call).
- VLM final review: 9/10 polish. Minor note (keyboard hint contrast) addressed.

### Unresolved / next-phase recommendations (from Round 2)
- Timed quiz mode (mentioned in Round 1 as a possible future addition). ✅ DONE (Round 3)
- Pronunciation could auto-play when a flashcard is revealed (opt-in setting).
- Activity chart could show per-category breakdown or a longer 30-day window.
- Could add a "streak" (consecutive study days) motivational element. ✅ DONE (Round 3)
- Consider adding word etymology/synonyms from a dictionary API for richer cards.
  (Round 3 added a word detail drawer with all stored data; etymology needs an
  external API — deferred.)

---

## Task ID: 3
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–2 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, and a 7-day activity chart.
- agent-browser QA (desktop + mobile) + VLM visual review surfaced real defects
  and improvement opportunities. No build/runtime errors.

### QA findings (via agent-browser + VLM)
- Dashboard "Status mix" donut: when 0 mastered, the single-segment pie with
  paddingAngle rendered as a broken/incomplete ring (a sliver).
- Word list definition text: short words ("a", "or", "of") orphaned on the
  last line (poor typographic rhythm). `text-pretty` wasn't sufficient.
- Import textarea placeholder: very low contrast against the input background.
- Flashcard keyboard hint: still slightly low contrast after Round 2's fix.
- Import backup section: buttons felt disconnected from descriptive text.

### Completed modifications
**Bug fixes:**
1. Dashboard donut empty-state: added a background track ring (always a clean
   full circle at `oklch(1 0 0 / 0.05)`) and only render the data Pie on top
   when there's actual progress (mastered + learning > 0). When one segment,
   use `cornerRadius` + no paddingAngle for a clean look. VLM confirmed "clean,
   complete ring, not a broken sliver".
2. Word list definition: switched from `text-pretty` to `text-balance` +
   `leading-relaxed` for better line balancing on short definitions.
3. Import textarea placeholder: added `placeholder:text-muted-foreground/60`
   for improved contrast.
4. Flashcard keyboard hint: bumped kbd styling to `bg-muted/50` +
   `text-foreground/70` and the hint text to `text-muted-foreground` (from
   `/70`).

**New features:**
5. Timed quiz mode — a toggle in quiz setup (with `role="switch"` + ARIA).
   When enabled, allocates 12s per question (SECONDS_PER_QUESTION). A
   `TimerPill` in the playing header shows `m:ss` remaining, turns amber at
   ≤10s ("hurry!") and red+pulsing at ≤5s. A useEffect countdown auto-ends
   the quiz (goes to results) when time hits 0. Results screen shows "time's
   up!" + a Time stat (used / total). Setup shows estimated total time when
   toggled on; the start button reads "Start quiz · timed".
6. Study streak — `getStudyStreak()` in stats.ts computes the current
   consecutive-day streak from the activity log (walking back from today, or
   yesterday if nothing today) + best-ever streak. The dashboard shows a
   `StreakBanner` with a flame icon, the day count, "keep it going!" message
   with best streak, 7 day-dots (lit = active), and a "Take a quiz" CTA on
   the empty state. Glows emerald when streak > 0.
7. Word detail drawer — a `WordDetailDrawer` (right-side Sheet) opened by
   clicking a word's term or an Info button on word cards. Shows: term (large
   serif) + pronounce, part of speech, status badge, definition, example,
   a 2×2 progress grid (accuracy, current streak, attempts, status with
   accent colors), last-answered timestamp, and footer actions (mark learned,
   reset). Reuses the store's toggleLearned/resetWord with toast feedback.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard donut renders as a clean full ring in empty state (VLM
    confirmed "clean, complete ring, not a broken sliver").
  - Study streak banner: shows "Start a study streak" + 7 dots when empty;
    "1 day · keep it going! Best: 1 day" with one lit dot after a quiz.
  - Timed quiz: toggle works, timer counts down (0:55 → 0:41 verified),
    auto-ends at 0 with "0 of 5 correct · time's up!" + Time stat.
  - Word detail drawer: opens on term click, shows all sections (Definition,
    Example, Progress grid, actions), closes with Escape.
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: no visual defects on dashboard, donut clean, streak
  banner correct, activity chart showing bars. All views "fully functional
  and visually intact".

### Unresolved / next-phase recommendations (from Round 3)
- Pronunciation auto-play on flashcard reveal (opt-in setting in store). ✅ DONE (Round 4)
- Activity chart per-category breakdown or a 30-day toggle window.
- Word etymology/synonyms via an external dictionary API (the LLM skill could
  generate example sentences or mnemonics on demand). ✅ DONE mnemonics (Round 4)
- Quiz could remember the last-used settings (length, timed) in the store. ✅ DONE (Round 4)
- Consider a "daily goal" (e.g., answer 10 questions) that feeds the streak. ✅ DONE (Round 4)

---

## Task ID: 4
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–3 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, a 7-day activity chart,
  timed quiz mode, study streak, and word detail drawer.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed dashboard, word list, flashcards, quiz setup, import view all
  render correctly with no significant visual defects.
- Word detail drawer verified working with all sections.
- Flashcard keyboard hint styling confirmed correct (distinct UI key elements
  with borders/backgrounds).
- Stale dev-log "module-not-found" from a Round 3 typo was already fixed
  (import path corrected to `@/lib/store`).

### Completed modifications
**New features:**
1. Persisted quiz settings — added a `Settings` interface to the store
   (`quizLength`, `quizTimed`, `autoPronounce`, `dailyGoal`) with a
   `setSettings(patch)` action. The quiz setup now initializes length + timed
   from the store and persists changes on toggle/select. Verified: navigate
   away and back — timed mode stays enabled, 20 questions stays selected.
2. Auto-pronounce on flashcard reveal — an "Auto-say" toggle button (with
   `role="switch"` + ARIA) in the flashcard header. When enabled, the Deck
   calls `speak(word.term)` via a useEffect when the card flips to the back.
   Persisted in `settings.autoPronounce`.
3. Daily goal tracker — `getTodayCount()` in stats.ts counts questions
   answered today. A `DailyGoalCard` on the dashboard (next to the streak
   banner) shows answered/goal with an animated progress bar, correct/missed
   breakdown, "X to go" or "Goal met" with sparkles, an editable goal (5/10/
   20/30 presets), and a "Take a quiz" CTA. VLM confirmed "5/10" with
   half-filled bar after a 5-question quiz.
4. AI-generated mnemonics — a server-side `/api/mnemonic` route using
   z-ai-web-dev-sdk's `chat.completions.create()` with a focused system prompt
   ("create vivid, memorable mnemonics for SAT vocabulary, 2-3 sentences, use
   wordplay/imagery, respond with ONLY the mnemonic"). In-memory LRU cache
   (120 entries). The word detail drawer has a "Mnemonic" section with a
   "Generate" button, loading state ("Thinking of a memory hook…"), the result
   in an amber-tinted card, and "Try another" to regenerate. Verified: "Like a
   mayfly's brief life, ephemeral things vanish in a blink" and "A PRAGMATIC
   person avoids drama" via curl.
5. Store schema additions: `Settings` interface, `settings` state,
   `setSettings` action. All persisted via partialize. Export/import progress
   now includes settings.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: daily goal card shows "5/10" with half-filled progress bar
    after a quiz; study streak shows "1 day" with lit green dot; activity
    chart shows stacked bars.
  - Quiz settings: timed mode + 20 questions persisted across navigation
    (verified: navigate to Dashboard → back to Quiz → still checked=true,
    still 20 selected).
  - Flashcard auto-pronounce: "Auto-say" toggle present with ARIA switch role.
  - Word detail drawer: AI mnemonic generates successfully ("Like a mayfly's
    brief life, ephemeral things vanish in a blink—here today, gone tomorrow").
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: "no visual defects", "layout is well-balanced", "dark
  mode contrast is consistent", "all UI elements properly aligned".
- Mnemonic API: `curl POST /api/mnemonic` → HTTP 200 with valid mnemonic;
  cached second call 509ms (vs 810ms first call).

### Unresolved / next-phase recommendations (from Round 4)
- Activity chart per-category breakdown or a 30-day toggle window. ✅ DONE breakdown (Round 5)
- Word etymology/synonyms via an external dictionary API (could extend the
  mnemonic API to also return etymology).
- Could add a "consecutive correct answers" live counter during a quiz session.
- Consider adding keyboard shortcuts to the word list (e.g., / to focus search). ✅ DONE (Round 5)
- Could add a "review missed words" quiz mode that only quizzes words answered
  incorrectly in the past. ✅ DONE (Round 5)

---

## Task ID: 5
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–4 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics, persisted
  settings, daily goal tracker, and auto-pronounce.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all 5 views render correctly with no significant defects.
- Word detail drawer + mnemonic generation verified working.
- Flashcard keyboard hint styling confirmed correct.
- Dashboard layout confirmed clean (VLM's initial "overlap" concern was
  verified to be inaccurate — the "Take a quiz" button is properly positioned).

### Completed modifications
**New features:**
1. Quiz word-source selector — added a `QuizSource` type ("all" | "missed" |
   "learning") with a SOURCE_OPTIONS config. The quiz setup now has a "Word
   source" card with 3 selectable options (All words / Missed words / In
   progress), each showing the available count. The `startQuiz` function
   filters the pool based on the selected source. Smart error messages when
   there aren't enough words (e.g., "Not enough missed words yet. Answer some
   questions first."). The Start button is disabled with contextual guidance
   when `canStart` is false.
2. Keyboard shortcut `/` to focus search — added a `useEffect` keydown handler
   in the word list that focuses the search input when `/` is pressed (and
   clears the query on Escape when the search is focused). A visual `kbd`
   hint (`/`) is shown at the right edge of the search input.
3. Achievements/milestones system — created `src/lib/achievements.ts` with a
   `computeAchievements()` function that evaluates 8 milestones (First Steps,
   Getting Warmer, Half Century, Word Master, Vocabulary Virtuoso, On a Roll,
   Flawless, Curator) from the store state. Each has progress (0..1) and
   achieved status. The dashboard has a new "Achievements" section with a
   4-column grid of milestone cards (icon + label + description + progress bar
   or checkmark). Achieved cards glow emerald; in-progress cards show a
   progress bar. A count badge shows achieved/total (e.g., "1/8").
4. Per-category activity breakdown — added `getActivityByCategory()` to
   stats.ts that buckets the last 7 days of activity by category. The
   dashboard's 7-day activity section now shows a 2-column footer with
   Vocabulary and Transitions rows (questions answered + accuracy %, color-
   coded emerald/amber). Only appears when there's activity.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: "First Steps" achievement marked as achieved (emerald + check)
    after a quiz; study streak shows "1 day"; daily goal shows "7/10" with
    70% progress bar; per-category breakdown shows vocabulary 57% acc.
  - Quiz source selector: 3 options present with counts (All 35, Missed 35,
    In progress 35); smart error messages when not enough words.
  - Word list search: `/` key focuses the search input; typing filters
    results correctly; `kbd` hint visible.
  - Achievements: 8 milestone cards render correctly; achieved ones have
    emerald styling + checkmark.
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: "no visual defects", "UI is clean and consistent",
  "dashboard accurately reflects the state".

### Unresolved / next-phase recommendations
- Word etymology/synonyms via an external dictionary API (could extend the
  mnemonic API to also return etymology).
- Could add a "consecutive correct answers" live counter during a quiz session.
- Activity chart could offer a 30-day toggle window. ✅ DONE (Round 6)
- Could add a "perfect quiz" achievement that tracks 100% on a 5+ question quiz
  (currently marked as not-trackable from current data). ✅ DONE (Round 6)
- Consider adding a "share progress" feature (export a summary image/text). ✅ DONE (Round 6)

---

## Task ID: 6
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–5 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics, persisted
  settings, daily goal tracker, auto-pronounce, quiz source selector, keyboard
  shortcuts, achievements, and per-category activity breakdown.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. One stale "useState is not defined" Fast Refresh error
  was found in the dev log but resolved after recompilation — verified the app
  loads cleanly with no console errors.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all 5 views render correctly. Some VLM findings (missing count
  badges, low-contrast placeholder) were verified to be inaccurate — all source
  options have counts, placeholder contrast was already fixed in Round 3.
- Dashboard layout, mastery breakdown, and achievements all confirmed clean.

### Completed modifications
**New features:**
1. Quiz session tracking — added a `QuizSession` interface to the store
   (`ts`, `total`, `correct`, `perfect`, `timed`) with a `recordQuizSession`
   action. The quiz view now records a session when the quiz ends (either by
   completing all questions or by timer expiry). A `finishQuiz` callback
   centralizes the logic. Sessions are persisted, exported, and imported.
2. Perfect-quiz achievement — the "Flawless" achievement now tracks real data
   from `quizSessions`, checking for any session with `perfect === true` and
   `total >= 5`. Also added a new "Quiz Master" achievement (complete 5 quizzes)
   that tracks `quizSessions.length`. The dashboard now shows 9 achievements
   (up from 8).
3. 30-day activity toggle — the activity section header now has a 7d/30d toggle
   pill. The `activityWindow` state drives `getActivityTrend`, 
   `getActivitySummary`, and `getActivityByCategory`. The heading, description,
   and active-days count all update dynamically ("7-day activity" / "30-day
   activity", "past week" / "past month").
4. Share progress — a "Share" button in the dashboard header generates a
   summary text (mastery, accuracy, best streak, study streak, daily goal,
   achievements count) and copies it to the clipboard via
   `navigator.clipboard.writeText()`. Shows a success toast on copy.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: Share button present and copies to clipboard (toast "Progress
    summary copied to clipboard" verified); 7d/30d toggle works (heading
    changes from "7-day activity" to "30-day activity"); 9 achievement cards
    render correctly.
  - No console errors on any view.
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: "No significant defects. UI appears clean, consistent, and
  well-aligned."

### Unresolved / next-phase recommendations (from Round 6)
- Word etymology/synonyms via an external dictionary API (could extend the
  mnemonic API to also return etymology).
- Could add a "consecutive correct answers" live counter during a quiz session. ✅ DONE (Round 7)
- Could add more achievement tiers (e.g., 25 mastered, 10-day streak). ✅ DONE (Round 7)
- Consider adding a "review mastered words" quiz mode for spaced maintenance. ✅ DONE (Round 7)
- Could add a settings panel for managing all preferences in one place. ✅ DONE (Round 7)

---

## Task ID: 7
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–6 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7/30-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics, persisted
  settings, daily goal tracker, auto-pronounce, quiz source selector, keyboard
  shortcuts, achievements, per-category activity, quiz session tracking,
  perfect-quiz achievement, and share progress.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all views render correctly. Some VLM findings (missing count
  badges) were verified to be inaccurate — all source options have counts.
- Dashboard layout, quiz setup, and settings dialog all confirmed clean.

### Completed modifications
**New features:**
1. Settings dialog — created `src/components/settings-dialog.tsx` with four
   sections: (a) Quiz defaults (default length 5/10/20/All + timed toggle),
   (b) Study preferences (auto-pronounce toggle + daily goal 5/10/20/30),
   (c) Backup & restore (export + restore from file), (d) Danger zone (reset
   all progress with two-step confirmation). The navbar now has a Settings
   gear icon button + an "Open settings" item in the quick-actions dropdown.
   All changes persist immediately via `setSettings`.
2. More achievement tiers — added 2 new achievements: "Lexicon Legend" (master
   25 words, Crown icon) and "Week Warrior" (study 7 days in a row, Calendar
   icon). The dashboard now shows 11 achievements (up from 9).
3. Enhanced streak pill — the quiz StreakPill now shows mini mastery progress
   dots (3 dots that light up as the streak grows), turns emerald + pulses when
   "on fire" (streak ≥ 3 = mastery threshold), and has a cleaner "/ best"
   layout. The flame icon fills with the appropriate color.
4. "Mastered" quiz mode — added a 4th source option "Mastered" to the quiz
   source selector that filters to only mastered words for spaced-maintenance
   review. The `sourcePool` filter handles this new source.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Settings dialog: opens from gear icon + dropdown; shows all 4 sections with
    toggles and option grids; changes persist immediately.
  - Achievements: 11 cards render correctly (verified all labels); count badge
    shows "1/11" after a quiz.
  - Quiz source: 4 options present (All / Missed / In progress / Mastered)
    with counts.
  - Streak pill: shows current streak with mastery dots; updates to "1" after
    a correct answer.
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: settings dialog "structure and components match the
  requirements perfectly"; all views clean.

### Unresolved / next-phase recommendations (from Round 7)
- Word etymology/synonyms via an external dictionary API (could extend the
  mnemonic API to also return etymology).
- Could add a "dark/light" theme toggle (currently dark-only by design).
- Could add more granular quiz statistics (e.g., per-question response time). ✅ DONE (Round 8)
- Consider adding a "word of the day" feature on the dashboard. ✅ DONE (Round 8)
- Could add a search/filter to the achievements section.

---

## Task ID: 8
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–7 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7/30-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics, persisted
  settings, daily goal tracker, auto-pronounce, quiz source selector (4 modes),
  keyboard shortcuts, 11 achievements, per-category activity, quiz session
  tracking, perfect-quiz achievement, share progress, settings dialog, and
  enhanced streak pill.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all views render correctly. Contrast findings on muted-
  foreground text are intentional for secondary information.
- Dashboard, word list, quiz setup, and settings dialog all confirmed clean.

### Completed modifications
**New features:**
1. Word of the Day — created `src/lib/word-of-day.ts` with `getWordOfTheDay()`
   that deterministically selects a word based on the date (year + day-of-year
   seed) so the same word shows all day and changes at midnight. The dashboard
   has a new `WordOfTheDayCard` with a sparkle icon, the word (serif), part of
   speech, pronounce button, definition, and a "Study this" CTA. Ambient
   emerald gradient for visual interest. VLM confirmed: "card is present,
   displaying the word, definition, and pronounce button".
2. Per-question response time tracking — added `responseMs` to the
   `AnswerRecord` interface and a `questionStartRef` (useRef) that tracks when
   each question starts. The `pick` function records `Date.now() -
   questionStartRef.current` on each answer. The `next` function resets the
   timer. Quiz results now show "Avg Xs · Fastest Ys" below the stats grid,
   and the review list shows per-question response times (ms or s) next to
   each word. A `formatMs` helper formats times intelligently (< 1s shows ms,
   ≥ 1s shows seconds with one decimal).

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: "Word of the day" card renders with word ("verbose"),
    definition, pronounce button, and "Study this" CTA (VLM confirmed).
  - Quiz: response time tracking implemented; question start ref resets on
    advance; records include responseMs.
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: "No real visual defects detected. The layout is clean,
  the dark theme is consistent."

### Unresolved / next-phase recommendations (from Round 8)
- Word etymology/synonyms via an external dictionary API (could extend the
  mnemonic API to also return etymology). ✅ DONE (Round 9)
- Could add a "dark/light" theme toggle (currently dark-only by design).
- Could add a search/filter to the achievements section.
- Consider adding a "streak freeze" mechanic (forgive one missed day).
- Could add a quiz history view showing past quiz sessions with trends. ✅ DONE (Round 9)

---

## Task ID: 9
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–8 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7/30-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics, persisted
  settings, daily goal tracker, auto-pronounce, quiz source selector (4 modes),
  keyboard shortcuts, 11 achievements, per-category activity, quiz session
  tracking, perfect-quiz achievement, share progress, settings dialog,
  enhanced streak pill, word of the day, and per-question response time.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all views render correctly. Contrast findings on muted-
  foreground text are intentional for secondary information.
- Dashboard, word list, flashcards, and quiz setup all confirmed clean.

### Completed modifications
**New features:**
1. Quiz history view — created `src/lib/quiz-history.ts` with
   `getQuizHistoryStats()` (total quizzes, total questions, average accuracy,
   perfect count, timed count, recent trend) and `formatRelativeTime()`.
   Created `src/components/views/quiz-history-view.tsx` with summary stat cards,
   an accuracy trend LineChart (last 10 quizzes), and a scrollable session list
   showing each quiz's score, accuracy %, perfect/timed badges, and relative
   timestamp. Empty state with "Take a quiz" CTA. Wrapped in a
   `QuizHistoryDialog` accessible from a "History" button in the dashboard
   header.
2. Word etymology via LLM — created `src/app/api/etymology/route.ts` using
   z-ai-web-dev-sdk with a focused system prompt ("etymology expert, include
   root language, original root word and meaning, evolution, 2-3 sentences,
   respond with ONLY the etymology"). In-memory LRU cache (120 entries). The
   word detail drawer has a new "Etymology" section (Globe icon) with a
   "Generate" button, loading state ("Tracing the word's origins…"), and the
   result in a muted card. Verified: "From Late Latin ephemerus, from Greek
   ephemeros, meaning 'lasting only a day'" via both UI and curl.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Quiz history: dialog opens from "History" button; shows empty state with
    CTA when no sessions; "Your quiz journey" heading confirmed.
  - Etymology: Generate button present; generates valid etymology ("From Late
    Latin ephemerus, from Greek ephemeros…") in ~5s; curl returns valid JSON.
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: all views clean, no significant defects.

### Unresolved / next-phase recommendations (from Round 9)
- Could add a "dark/light" theme toggle (currently dark-only by design).
- Could add a search/filter to the achievements section. ✅ DONE (Round 10)
- Consider adding a "streak freeze" mechanic (forgive one missed day).
- Could add synonyms/antonyms to the word detail drawer via LLM. ✅ DONE (Round 10)
- Could add a "daily challenge" mode with a curated set of words each day. ✅ DONE (Round 10)

---

## Task ID: 10
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–9 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7/30-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics + etymology,
  persisted settings, daily goal tracker, auto-pronounce, quiz source selector
  (4 modes), keyboard shortcuts, 11 achievements, per-category activity, quiz
  session tracking, perfect-quiz achievement, share progress, settings dialog,
  enhanced streak pill, word of the day, per-question response time, and quiz
  history view.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all views render correctly. Contrast findings on muted-
  foreground text are intentional for secondary information.
- Dashboard, word list, flashcards, and quiz setup all confirmed clean.

### Completed modifications
**New features:**
1. Synonyms & antonyms via LLM — created `src/app/api/synonyms/route.ts`
   using z-ai-web-dev-sdk with a system prompt that requests 3-5 synonyms and
   2-3 antonyms as a JSON object. In-memory LRU cache (120 entries). The word
   detail drawer has a new "Synonyms & Antonyms" section (ArrowLeftRight icon)
   with a "Generate" button, loading state ("Finding related words…"), and
   results displayed as colored chips (synonyms in emerald, antonyms in red).
   Verified: synonyms (fleeting, transient, short-lived, momentary) and
   antonyms (permanent, enduring, lasting) for "ephemeral" via UI; curl
   returns valid JSON for "verbose".
2. Daily challenge — created `src/lib/daily-challenge.ts` with
   `getDailyChallenge()` that deterministically selects 5 words using a seeded
   PRNG (Fisher-Yates shuffle with date-based seed) so the same set shows all
   day. `isDailyChallengeCompleted()` checks if a 5+ question quiz was taken
   today. The dashboard has a new `DailyChallengeCard` with a Zap icon, the 5
   word chips, a "Start challenge" CTA, and a "Challenge complete!" state with
   emerald glow when done. VLM confirmed: "card is present, displaying 5 word
   chips and a Start challenge button".
3. Achievements filter — added an "all / achieved / locked" filter pill to the
   achievements section header. The `achFilter` state drives a `.filter()` on
   the achievements array. Empty state messages when no achievements match
   the filter (e.g., "No achievements unlocked yet — keep studying!").
   VLM confirmed: "filter tabs for All, Achieved, and Locked".

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: Daily challenge card with 5 word chips + Start button; Word of
    the day card; Achievements filter (all/achieved/locked) all present.
  - Word detail drawer: Synonyms & Antonyms section generates valid results
    (synonyms: fleeting, transient; antonyms: permanent, enduring).
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: "No real visual defects. Layout is clean with consistent
  dark-mode styling, proper spacing, and legible typography."

### Unresolved / next-phase recommendations (from Round 10)
- Could add a "dark/light" theme toggle (currently dark-only by design).
- Consider adding a "streak freeze" mechanic (forgive one missed day). ✅ DONE (Round 11)
- Could add a "word frequency" indicator (how common the word is on the SAT). ✅ DONE (Round 11)
- Could add a "study calendar" view showing activity heat map. ✅ DONE (Round 11)
- Could add more word lists (e.g., SAT Math terms, advanced vocabulary).

---

## Task ID: 11
Agent: main (Z.ai Code) — webDevReview cron round
Task: QA the app via agent-browser, fix bugs, then add features + polish styling.

### Current project status (assessment)
- Rounds 1–10 built a complete, working app with TTS, quiz direction toggle,
  flashcard focus filter, progress backup/restore, 7/30-day activity chart,
  timed quiz mode, study streak, word detail drawer, AI mnemonics + etymology +
  synonyms, persisted settings, daily goal tracker, auto-pronounce, quiz source
  selector (4 modes), keyboard shortcuts, 11 achievements, per-category activity,
  quiz session tracking, perfect-quiz achievement, share progress, settings
  dialog, enhanced streak pill, word of the day, per-question response time,
  quiz history view, daily challenge, and achievements filter.
- agent-browser QA (desktop + mobile) + VLM visual review found no
  runtime/build errors. The app is stable and visually clean.

### QA findings (via agent-browser + VLM)
- No runtime or console errors on any view (desktop + mobile).
- VLM confirmed all views render correctly. Contrast findings on muted-
  foreground text are intentional for secondary information.
- Dashboard, word list, flashcards, and quiz setup all confirmed clean.

### Completed modifications
**New features:**
1. Study calendar heat map — created `src/lib/activity-calendar.ts` with
   `getActivityCalendar()` (builds a 12-week × 7-day grid aligned to Sundays),
   `getIntensity()` (5-level 0–4 intensity based on daily question count),
   `getMonthLabels()`, and `getCalendarSummary()`. The dashboard has a new
   "Study calendar" section with month labels, day-of-week labels, the heat
   map grid (emerald intensity cells with tooltips), a Less→More legend, and
   active-days/total-questions summary. Empty state with CTA when no activity.
   VLM confirmed: "Study calendar section located near the bottom, labeled
   'Last 12 weeks of activity'".
2. Streak freeze mechanic — added `streakFreezes` to the Settings interface
   (default 1). Updated `getStudyStreak()` to accept a `streakFreezes` parameter
   that forgives single-day gaps by consuming a freeze. The StreakBanner now
   shows a freeze indicator badge (amber pill with sparkle icon + count) next
   to the week dots. The dashboard passes `streakFreezes` and displays
   `freezesLeft = available - used`. VLM confirmed: "streak freeze indicator
   appears as a small orange tag with snowflake icon and '+ 1 freeze' text".
3. Word frequency indicator — added a `FrequencyDots` component to the word
   detail drawer that shows a 5-dot SAT frequency rating based on the word's
   position in the default list (earlier = more common: indices < 7 = Very
   common/5 dots, < 15 = Common/4, < 22 = Moderate/3, < 30 = Uncommon/2,
   else Rare/1). Dots are emerald for tiers 4–5, amber for tier 3, gray for
   1–2. Label text included. Only shown for default (non-imported) words.
   Verified: "ephemeral" (index 1) shows "Very common" with 5 dots.

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: Study calendar heat map with 12-week grid + legend; streak
    freeze indicator in the streak banner.
  - Word detail drawer: SAT frequency indicator shows "Very common" (5 dots)
    for "ephemeral".
  - Mobile: bottom nav, clean top, no overflow, no errors.
- VLM final review: "No real visual defects. Layout is clean, the dark theme
  is consistent, and all UI elements render correctly."

### Unresolved / next-phase recommendations
- Could add a "dark/light" theme toggle (currently dark-only by design).
- Could add more word lists (e.g., SAT Math terms, advanced vocabulary).
- Could add a "study session timer" that tracks total study time.
- Could add confetti/celebration animation when mastering a word.
- Could add a "review scheduler" that suggests words to review based on
  forgetting curve (lightweight, not full spaced repetition).

---

## Task ID: 12
Agent: main (Z.ai Code) — user-requested changes
Task: Remove Achievements, Study calendar, and Daily Challenge features.
Add settings options to remove/restore pre-made word lists.

### Completed modifications
**Removed features:**
1. Achievements — removed the entire "Achievements" section from the dashboard
   (the card with 11 milestone cards, the all/achieved/locked filter, the
   count badge). Removed the `achFilter` state, `achievements`/`achievedCount`
   computations, the `ACHIEVEMENT_ICONS` map, and the "Achievements: X/Y" line
   from the Share text. Deleted `src/lib/achievements.ts`. Removed the
   `computeAchievements`/`countAchieved` imports. Cleaned up 7 unused icon
   imports (Trophy, Check, Upload, Footprints, Crown, Calendar, Zap).
2. Study calendar — removed the entire "Study calendar" heat map section from
   the dashboard (the 12-week grid, month labels, day-of-week labels, legend,
   summary). Removed `calendarGrid`/`calendarMonths`/`calendarSummary`
   computations. Deleted `src/lib/activity-calendar.ts`. Removed the
   `getActivityCalendar`/`getIntensity`/`getMonthLabels`/`getCalendarSummary`
   imports.
3. Daily Challenge — removed the entire "Daily Challenge" card from the
   dashboard (the Zap icon, 5 word chips, "Start challenge" CTA, "Challenge
   complete!" state). Removed the `DailyChallengeCard` component function.
   Removed `dailyChallenge`/`dailyDone` computations. Deleted
   `src/lib/daily-challenge.ts`. Removed the `getDailyChallenge`/
   `isDailyChallengeCompleted` imports.

**Added features:**
4. Pre-made word list toggle in settings — added a `hideDefaults` boolean to
   the `Settings` interface (default false). Updated `getWordsForCategory` in
   the store to return an empty array for defaults when `hideDefaults` is true
   (user imports are always included). The settings dialog has a new
   "Pre-made word lists" section with a toggle switch and contextual
   description ("Pre-made lists visible" / "Pre-made lists hidden") plus an
   amber warning when hidden. Added `hideDefaults` subscriptions to the word
   list view, dashboard, and ensured the flashcard + quiz views re-render via
   their existing `settings` subscription. Verified: toggling off → word list
   shows "0 of 0"; toggling on → word list shows "35 of 35".

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser end-to-end (desktop + mobile):
  - Dashboard: no Achievements, Study calendar, or Daily Challenge sections;
    Word of the Day, Streak, Daily Goal, and all other sections remain.
  - Settings dialog: "Pre-made word lists" section with toggle; toggling off
    shows "Pre-made lists hidden" + amber warning; word list shows "0 of 0".
  - Toggling back on: word list shows "35 of 35".
  - No console errors on any view (desktop + mobile).

---

## Task ID: 13
Agent: main (Z.ai Code) — user-requested mobile UX improvements
Task: Improve mobile layout/UI/UX — no scrolling needed for quiz Next button
or other key actions; make all interfaces better on mobile.

### Problem
On mobile (390×844), the quiz question + 4 options + feedback + Next button
didn't fit on screen — users had to scroll down to reach "Next question". Same
issue with flashcard controls and quiz setup Start button. Dashboard and word
list were too vertically spaced.

### Completed modifications
**Quiz playing screen:**
- Container now uses `min-h-[calc(100vh-13rem)]` with flex-col so it fills
  available height.
- Gaps reduced: `gap-4 sm:gap-6` (was `gap-6`).
- Header title: `text-2xl sm:text-3xl` (was `text-3xl`).
- Question card: `p-5 sm:p-8` (was `p-8`); term font `text-3xl sm:text-4xl`
  (was `text-4xl`).
- Options: `px-3.5 py-2.5 sm:px-4 sm:py-3.5` (was `px-4 py-3.5`); options
  container uses `flex-1` to fill remaining space.
- Feedback banner: `p-3 sm:p-4`, `gap-2.5 sm:gap-3`, smaller icon
  (`size-7 sm:size-8`).
- Next button area: `mt-auto` to pin to bottom; `gap-2 sm:gap-3`.
- Result: VLM confirmed "Next question button is visible at the bottom of the
  screen, just above the bottom navigation bar" — no scrolling needed.

**Flashcard view:**
- Container: `min-h-[calc(100vh-13rem)]` with `gap-4 sm:gap-6`.
- Card stage: `h-[18rem] flex-1 sm:h-[22rem] md:h-[24rem]` (was `h-[22rem]`).
- Controls gap: `gap-2 sm:gap-3`.
- Result: VLM confirmed "the user can see the card and the main navigation
  controls without scrolling".

**Quiz setup:**
- All cards: `p-4 sm:p-6` (was `p-6`).
- Source options: `p-2.5 sm:p-3.5`.
- Direction options: `p-3 sm:p-4`.
- Question count buttons: `py-3 sm:py-4`.
- Gaps: `gap-4 sm:gap-6`; `mt-3 sm:mt-4` for inner spacing.
- Result: VLM confirmed "Start quiz button is visible without scrolling".

**Dashboard:**
- Container: `space-y-5 sm:space-y-8` (was `space-y-8`).
- Header: `gap-3` (was `gap-4`); title `text-3xl` on mobile (was `text-4xl`).
- All cards: `p-4 sm:p-6` (was `p-6`).
- Stat cards grid: `gap-2.5 sm:gap-3` (was `gap-3`).
- Result: VLM confirmed "compact and dense, fits multiple modules efficiently".

**Word list:**
- Container: `space-y-4 sm:space-y-6` (was `space-y-6`).
- Header: `gap-2 sm:gap-3`; title `text-2xl sm:text-3xl` (was `text-3xl`).
- Word cards: `p-3.5 sm:p-5` (was `p-5`); term `text-lg sm:text-xl`.

**App shell + navbar:**
- Main: `pb-24 pt-4 md:pb-16 md:pt-6` (was `pb-28 pt-6`).
- Navbar: `gap-3 pt-3 md:gap-4 md:pt-4` (was `gap-4 pt-4`).
- Category switcher: `mt-2 md:mt-3` (was `mt-3`).

### Verification results
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on :3000, no compile/runtime errors.
- agent-browser mobile QA (390×844):
  - Quiz question: question + all 4 options visible; after answering, "Next
    question" button visible at bottom — no scrolling needed (VLM confirmed).
  - Flashcard: card + prev/next/reveal controls visible — no scrolling needed
    (VLM confirmed).
  - Quiz setup: Start button visible without scrolling (VLM confirmed).
  - Dashboard: compact, streak + goal + word-of-day visible without scrolling
    (VLM confirmed "compact and dense").
  - Word list: 3 word cards visible + search bar + filters (VLM confirmed).
  - No console errors.
- Desktop QA (1440×900): layout clean and well-aligned, no defects (VLM
  confirmed "no obvious visual bugs, spacing and padding uniform").
