# Minion Manager — Art Direction

> Sections marked **[CURRENT]** document the existing implementation.
> Sections marked **[PROPOSED]** describe future design direction.

---

## Corporate Satire Aesthetic — "Evil Jira" [CURRENT + PROPOSED]

### Design Philosophy [CURRENT]

The UI feels like a real productivity tool that happens to manage evil. The kanban board is the centerpiece — an actual drag-and-drop task management interface, except the tasks are "Rob the Art Museum" and "Unleash the Kraken."

**Current implementation:**
- Kanban board with department columns and player workbench
- Mission board styled as an intelligence briefing grid
- Upgrade shop organized into categories (Click Power, Minion Training, War Room, Department)
- Header with resource counters (gold, notoriety, completion stats)
- Drawer panel for settings and status

### Corporate Renaming Pass [PROPOSED]

Lean harder into the corporate satire by renaming UI panels:

| Current Name | Proposed Name | Rationale |
|-------------|---------------|-----------|
| Mission Board | Intelligence Briefing | Spy agency meets corporate meetings |
| Upgrade Shop | Procurement Portal | Corporate purchasing department |
| Minion Roster | Human Resources (Evil Division) | HR managing non-human resources |
| Hire Minion | Talent Acquisition | Corporate recruiting language |
| Department Column | Division Kanban | Standard corporate terminology |
| Drawer Panel | Executive Dashboard | C-suite analytics feel |
| Notifications | Slack from Minions | Internal messaging parody |
| Prison Panel | HR Incident Report | Capturing is a "personnel issue" |

---

## Color System [CURRENT]

### Full Palette

**Background layers:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#0d0d0d` | Base background |
| `--color-secondary` | `#1a1a2e` | Gradient layer, secondary surfaces |
| `--color-card` | `#16213e` | Card backgrounds, panels |
| `--color-card-hover` | `#1a2744` | Card hover state |

**Text hierarchy:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#e0e0e0` | Primary body text |
| `--color-text-secondary` | `#8892a4` | Secondary/supporting text |
| `--color-text-muted` | `#8892a4` | De-emphasized text |

**Accent colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-gold` | `#f4a261` | Gold currency, primary CTA, interactive elements |
| `--color-gold-dark` | `#c77d3a` | Gold darker shade, pressed states |
| `--color-accent` | `#e74c3c` | Alert red, danger states |
| `--color-success` | `#2ecc71` | Success states, positive feedback |
| `--color-border` | `#2a3a5c` | Panel borders, dividers |

### Tier Colors

Mission tiers each have a distinct color for instant visual classification:

| Tier | Color | Hex | Semantic |
|------|-------|-----|----------|
| Petty | Green | `#2ecc71` | Safe, easy, entry-level |
| Sinister | Purple | `#9b59b6` | Mysterious, mid-level |
| Diabolical | Red | `#e74c3c` | Dangerous, high-level |
| Legendary | Amber/Gold | `#f4a261` | Rare, prestigious, endgame |

### Threat Level Gradient

Notoriety bar transitions through a danger spectrum:

| Threat Level | Color Range | Feeling |
|-------------|-------------|---------|
| Unknown (0–14) | Green | Safe, operating undetected |
| Suspicious (15–34) | Yellow | Caution, being noticed |
| Wanted (35–59) | Orange | Warning, active penalties |
| Hunted (60–84) | Red-Orange | Danger, raids imminent |
| Infamous (85–100) | Deep Red | Critical, maximum threat |

### Usage Guidelines

- **Gold (`#f4a261`)** for all interactive/CTA elements — buttons, links, draggable items
- **Muted tones** for secondary information — avoid competing with gold for attention
- **Tier colors only for tier classification** — don't reuse tier colors for unrelated UI states
- **Red (`#e74c3c`)** reserved for danger/urgency — raids, high notoriety, captures
- **Green (`#2ecc71`)** for positive states — success, completion, low threat
- **Dark backgrounds** throughout — the "evil lair" feel comes from the dark-on-dark layering

---

## Typography [CURRENT + PROPOSED]

### Current Fonts

**Cinzel (serif):**
- Used for headers and titles
- Gives an "evil decree" / "villain proclamation" feeling
- All-caps works well for section headers at this weight

**Inter (sans-serif):**
- Used for body text, labels, data
- Clean readability on dark backgrounds
- Handles small sizes well (important for mobile)

### Proposed Addition [PROPOSED]

**Monospace font** for "data readouts" to reinforce corporate/technical feel:
- Resource counters, stat numbers, XP values
- Timer displays, countdown text
- "Terminal-style" notifications
- Candidates: JetBrains Mono, Fira Code, or IBM Plex Mono

---

## Iconography [CURRENT + PROPOSED]

### Emoji Vocabulary [CURRENT]

The game uses emoji exclusively for iconography. This is a deliberate design choice — emoji feel approachable and slightly silly, matching the cartoon villainy tone.

**Resources:**
| Concept | Emoji | Context |
|---------|-------|---------|
| Gold | 🪙 | Currency displays, rewards |
| Notoriety | 🔥 | Threat meter, penalty warnings |
| Influence | 📊 (placeholder) | Strategic currency — card packs, automation investments |
| ~~Supplies~~ | ~~⚗️~~ | *Consolidating into Influence* |
| ~~Intel~~ | ~~🕵️~~ | *Consolidating into Influence* |

> **Design change:** Supplies and Intel are being consolidated into a single **Influence** currency. The 📊 emoji is a placeholder — needs a permanent icon that conveys "strategic power" or "organizational influence" while fitting the evil corporate aesthetic. Candidates: 📊 (chart), 🏛️ (institution), 💼 (briefcase), 🎯 (target), or a custom SVG.

**Departments:**
| Department | Emoji | Style |
|-----------|-------|-------|
| Schemes | 🗝️ | Sneaky, lock-and-key |
| Heists | 💎 | Valuable, theft |
| Research | 🧪 | Scientific, experimental |
| Mayhem | 💥 | Explosive, chaotic |

**Status & feedback:**
| Concept | Emoji |
|---------|-------|
| Completed | ✅ |
| Minion | 👾 |
| Raid alert | 🔴 |
| Settings | ⚙️ |
| Save | 💾 |
| Level up | ⭐ |

**Minion accessories:**
| Accessory | Emoji |
|-----------|-------|
| Goggles | 🥽 |
| Helmet | ⛑️ |
| Cape | 🦹 |
| Horns | 😈 |
| None | (minion default) |

### Evolution Plan [PROPOSED]

- **Phase 1:** Keep emoji for charm. They're working.
- **Phase 2:** Add subtle custom SVG icons for core actions (hire, upgrade, bribe) alongside emoji — don't replace, supplement.
- **Phase 3:** Department icons evolve into corporate-style department logos (still playful, but more polished). Think evil corporate letterhead.
- **Never fully replace emoji** — they're part of the game's identity.

---

## Animation Principles [CURRENT]

### Existing Animations

The game has **12 keyframe animations** defined in `src/styles.scss`, plus several utility classes:

**Minion animations:**
| Animation | Duration | Behavior | Purpose |
|-----------|----------|----------|---------|
| `minion-idle` | 2s infinite | Gentle Y bounce (-4px) | Shows minion is alive/waiting |
| `minion-working` | 0.3s infinite | Shake + rotate (±2px, ±2°) | Visually busy, task in progress |

**Feedback animations:**
| Animation | Duration | Behavior | Purpose |
|-----------|----------|----------|---------|
| `gold-pulse` | 0.4s | Scale 1→1.15→1 | Gold counter update feedback |
| `click-ripple` | 0.6s | Scale 0→2.5, fade | Click feedback on tasks |
| `hire-burst` | 0.5s | Scale 0.8→1.1→1 + fade in | Celebrate new minion hire |
| `card-glow` | 2s infinite | Box-shadow pulse (gold) | Highlight special/important cards |
| `subtle-pulse` | 2s infinite | Opacity 1→0.7→1 | Gentle attention draw |

**Notification animations:**
| Animation | Duration | Behavior | Purpose |
|-----------|----------|----------|---------|
| `notification-slide-in` | 0.3s | translateX 100%→0 | Toast enters from right |
| `notification-fade-out` | 0.3s | translateX 0→100% + fade | Toast exits to right |

**Progress animations:**
| Animation | Duration | Behavior | Purpose |
|-----------|----------|----------|---------|
| `progress-shimmer` | 1.5s infinite | Gradient slide across bar | Active task progress indicator |
| `float-up` | self-timed | translateY -60px + shrink + fade | Floating "+gold" text |

### Design Principles

**Animations are feedback, not decoration:**
- Every animation communicates state change or draws attention to something actionable
- No animations exist purely for aesthetic — each serves a UX purpose
- If you can't explain what information the animation conveys, it shouldn't exist

**Micro-interactions over flashy effects:**
- `scale-95` on press (tactile feedback)
- `gold-pulse` on counter change (value changed)
- `card-glow` on special missions (attention: time-limited)
- These small touches create "juice" without overwhelming

**Performance constraints:**
- Use `transform` and `opacity` only (GPU-accelerated properties)
- Prefer CSS animations over JavaScript-driven animation
- `will-change` only on elements that actually animate
- Respect `prefers-reduced-motion` for accessibility

### Drag-and-Drop Visual Feedback [CURRENT]

- **Drag preview:** Gold shadow (`0 5px 25px rgba(0,0,0,0.4)`, `0 0 15px rgba(244,162,97,0.2)`)
- **Drop zone highlight:** Gold border (`rgba(244,162,97,0.5)`) + light gold background
- **Drop zone active:** Slightly brighter border when dragging over valid target
- **CDK drag placeholder:** Dashed border placeholder where item will land

---

## Sound Design [PROPOSED]

> No audio currently exists in the game. This section defines direction for when audio is implemented.

### Corporate Satire Audio Direction

The soundscape should reinforce the "evil office" setting — mundane office sounds with sinister undertones.

**Ambient:**
- Base layer: Quiet office ambiance (keyboard clatter, distant murmuring, air conditioning hum)
- Evil undertone: Occasional distant rumble, faint alarm, muffled explosion from "the lab"
- Dynamic: Ambient shifts subtly with threat level (more tense at high notoriety)

**Interaction sounds:**
| Action | Sound Direction |
|--------|----------------|
| Task click | Keyboard press / stamp sound |
| Task completion | Receipt printer / cash register "cha-ching" |
| Gold earned | Coin clink (scale with amount) |
| Minion hired | Brief corporate jingle + door opening |
| Upgrade purchased | Mechanical upgrade whir |
| Bribe paid | Briefcase snap + envelope slide |
| Mission accepted | Stamp of approval |
| Raid warning | Office alarm (comedic, not scary) |
| Raid defense click | Desk fortification sounds |
| Notification | Slack-like "blip" |
| Level up | Triumphant corporate jingle |

**Minion vocalizations:**
- Mumbled corporate speak — "synergy... stakeholder... deliverable..." (like Sims gibberish but with corporate vocabulary)
- Brief and infrequent — triggered by task completion, hiring, personality events
- Department-specific: Research minions mumble science jargon, Mayhem minions make explosion noises

**Music:**
- **Default:** Lofi evil beats — elevator music with minor key undertones
- **Low threat:** Calm, productive office music
- **High threat:** Tempo increases, bass deepens, minor key intensifies
- **Raid active:** Urgent but still comedic (think cartoon chase music)
- **Victory:** Brief triumphant evil theme (3-5 seconds)

---

## Mobile Design Principles [CURRENT]

### Layout Strategy

Desktop uses a three-panel layout (mission board | kanban board | side panels). Mobile completely restructures:

**Tab-based navigation** (bottom nav bar):
- Kanban tab (default) — department carousel
- Missions tab — mission board grid
- Minions tab — roster list
- More tab — upgrades, settings, prison

**Swipeable department carousel:**
- Horizontal swipe between department columns
- Dot indicators for current position
- Each department fills full viewport width

### Touch Optimization

- **Minimum touch targets:** 48px (following Material Design guidelines)
- **`touch-action: manipulation`** on all interactive elements (prevents 300ms delay)
- **Drag-and-drop adaptation:** CDK drag works with touch events, drag preview sized for fingers not cursors
- **Safe area insets:** Proper `env(safe-area-inset-*)` for notch devices (iPhone, Pixel)

### Responsive Breakpoints

- **Mobile:** Default layout (bottom nav, single column, carousel)
- **Tablet/Desktop (`sm:` and up):** Three-panel layout, full kanban board visible
- **Large desktop (`lg:`):** Extra spacing, larger cards

### Playwright Mobile Testing [CURRENT]

Dual test projects ensure mobile-specific behavior is validated:
- `chromium` project: Standard desktop viewport
- `mobile-chrome` project: Pixel 5 device emulation with touch events
