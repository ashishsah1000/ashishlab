# Changelog

All notable changes, new features, and bug fixes for the project are documented in this file.

---

## [Unreleased] - 2026-10-12

### 🎯 New Feature: Goal Monitor & Blueprint System
- **Navbar Integration:** Added a protected **Goals** navigation link, accessible only when logged in.
- **Goal Blueprint Creator (`/create/goal`):**
  - Define custom goals with target deadlines, descriptions, reward attachments, and multi-milestone daily plans.
  - Set specific topics, focus concepts/sub-targets, daily allotted minutes, and end-output competency definitions.
- **Automated Task Scheduling:** Automatically populates weekday tasks (Monday through Friday) across the goal duration, with support for logging weekend extra sessions.
- **Goals Dashboard (`/goals`):**
  - Displays active and completed goal blueprints.
  - GitHub-style monthly consistency heatmaps (days turn green upon reaching ≥80% task completion).
  - Global AI Daily Suggestion Banner reflecting daily priorities.
- **Weekly Calendar (`/weekly/goals`):**
  - 7-day schedule view with quick task completion toggles.
  - Enforced temporal integrity: future tasks are visible but disabled; past missed tasks remain editable.
  - 80% weekly consistency tracker with celebration banner upon unlocking weekly micro-rewards.
- **Milestones Manager (`/goal/[id]`):**
  - Milestone cards featuring a 4-week weekly matrix breakdown (Green for ≥80%, Red for <80%).
  - Inline milestone editing and status toggling (Active / Completed).
- **Deep Performance Analytics (`/overview/goals/[id]`):**
  - Precision analytics: Total Completion Rate %, Historical Failure Rate %, and Show-Up Consistency Rate %.
  - 75% Show-Up Rule tracker for Large Reward goals to unlock early perks.
  - Day-of-week consistency chart identifying fatigue patterns across weekdays.
  - On-demand AI Strategic Report generator analyzing velocity, failure patterns, and high-impact accelerators.
- **AI Coach Assistant (`AiCoachDrawer`):** Slide-out drawer assistant powered by Gemini 2.5 Flash with full GitHub-flavored Markdown formatting support (bullet lists, bold highlights, code blocks, and blockquotes).
- **Email Notifications Engine (`/api/goals/notifications/send-weekly`):** Automated mid-week check-ins and Friday wrap-up reports via Nodemailer, with an interactive preview modal.

---

### 🎁 Rewards Store & Vault Enhancements
- **Enlarged Roomy Modal:** Upgraded `RewardsStoreModal` to `w-[95%] max-w-6xl max-h-[92vh]` with an expansive 3-column responsive card layout.
- **Weekly Tier Lockdown (`onlyTier="small"`):** Opening the rewards modal from the weekly calendar (when the weekly 80% threshold is met) locks strictly to **Weekly Micro-Rewards** (`< ₹1,000`), hiding other tiers.
- **Repeatable Weekly Claims:** Small rewards are **never burned out or removed** upon redemption. Users can claim them repeatedly across qualifying weeks whenever weekly consistency is ≥80%.
- **Strict Dropdown Filtering:** Medium (`< ₹10,000`) and Large (`> ₹10,000`) rewards that have been **selected** (attached to an active goal) or **redeemed/achieved** are excluded from selection dropdowns in `/create/goal` and `AttachRewardModal`.
- **Unlink & Re-attach Fallback (`+ Add Reward`):** Deleting a reward unlinks referencing goals (`goals.rewardId = null`), which immediately render an inline `+ Add Reward` button.

---

### 🛡️ Universal Safe Deletion System (`DeleteConfirmationModal`)
- **Eliminated Native `confirm(...)` Prompts:** Replaced all raw browser dialogs with `DeleteConfirmationModal`.
- **Accurate Record Preview:** Previews the exact record details (Title, Entity Type badge, Deadlines, Tier, Values, Daily Time, Progress Rate).
- **Permanent Action Warning:** Explains the permanent consequences and data implications of deletion.
- **Required Checkbox Activation:** The destructive **Delete button remains strictly disabled** until the user explicitly checks:
  ```
  [x] I confirm that I want to delete this record and understand this cannot be undone.
  ```
- **Integrated Everywhere Deletion Occurs:**
  1. **Goal Blueprints:** Dashboard (`/goals`), Milestones view (`/goal/[id]`), and Deep Analytics (`/overview/goals/[id]`).
  2. **Milestones:** Milestone cards on `/goal/[id]` and draft rows on `/create/goal`.
  3. **Vault Rewards:** Rewards Vault & Store modal (`RewardsStoreModal`).
  4. **Articles & Posts:** Journal entries and Lab Notes (`PostActions`).

---

### 🎨 Layout & UI/UX Fixes
- **80% Width Standardization:** All goal pages now expand to standard `w-[92%] md:w-[85%] lg:w-[80%] mx-auto` instead of narrow centered containers.
- **Tier Selection Stability:** Resolved category switching bugs in the reward creation form so selecting Medium/Large categories remains stable without jumping.
- **Production Build:** Verified cleanly with Next.js 16 (`npm run build`) in 3.7s across all 30 routes with 0 errors.
