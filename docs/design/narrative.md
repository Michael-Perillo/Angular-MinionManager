# Minion Manager — Narrative Design

> All content in this document is **[PROPOSED]** unless explicitly marked otherwise.
> The game currently has no narrative system — this document defines the story framework for future implementation.
>
> **See also:** [game-design-vision.md](game-design-vision.md) for the high-level run structure, phase transitions, rival organizations, and Government/IRS mechanics that intersect with narrative design.

---

## Tone Guide

### Corporate Satire Meets Cartoon Villainy

The central joke: **you are doing evil project management.** The entire game is a parody of corporate productivity tools applied to villainy. The kanban board isn't just a UI pattern — it's the punchline.

**Voice principles:**
- Parody corporate speak at every opportunity: "synergize our mayhem vertical", "Q3 world domination OKRs", "let's circle back on the doomsday device"
- Evil is treated as a career, not a calling — minions have PTO, performance reviews, and mandatory team-building
- The hero opposition is framed as "regulatory compliance issues" or "hostile competitor interference"
- Raids are "surprise audits from the Hero League"

**Tone boundaries:**
- **PG-13 cartoon evil** — steal the moon, hold cities for ransom, build doomsday devices. Never hurt people directly.
- Consequences are comedic, not tragic — captured minions go to "hero jail" (basically a timeout), not worse
- Failure is funny, not punishing — raid losses are setbacks, not devastation
- Think Despicable Me meets Office Space meets Dungeon Keeper

### Example Flavor Text

**Mission names (existing):**
- "Hack the Mainframe" (Research)
- "Rob the Art Museum" (Heists)
- "Blackmail the Mayor" (Schemes)
- "Unleash the Kraken" (Mayhem)

**Proposed notification messages:**
- "Grim just completed 'Corporate Espionage' and is requesting overtime pay."
- "Your Schemes department has exceeded its quarterly sabotage quota. HR would like a word."
- "URGENT: Hero spotted near base. Switching to 'Totally Normal Business' mode."
- "Skulk has been promoted to Grunt. They've updated their LinkedIn to 'Professional Evildoer'."

---

## Player Character

### The Reluctant Middle Manager of Evil

**Backstory:** You are a mid-level evil manager who just got "promoted" when the previous boss was defeated by heroes. Congratulations — you've inherited a barely functional evil organization, a handful of minions who'd rather be on break, and a leaky lair.

**Your lair:** A startup-style evil HQ. Open floor plan. Standing desks. Kombucha on tap. "Move Fast and Break Things" poster (meant literally). The break room has a doomsday device prototype being used as a coffee table.

### Villain Level Titles [CURRENT + PROPOSED]

Current titles exist in code. Proposed corporate parallels for flavor:

| Level | Current Title | Corporate Parallel |
|-------|--------------|-------------------|
| 1–2 | Petty Troublemaker | Junior Associate of Evil |
| 3–4 | Aspiring Villain | Evil Coordinator |
| 5–6 | Notorious Scoundrel | Senior Evil Analyst |
| 7–8 | Criminal Mastermind | Director of Villainy |
| 9–10 | Arch-Villain | VP of Nefarious Operations |
| 11–14 | Dark Overlord | Chief Villainy Officer |
| 15–20 | Supreme Evil Genius | CEO of Chaos |

---

## Minion Development

### Personality System [PROPOSED]

Minions currently have names, colors, accessories, and specialties. Proposed expansion:

**Personality traits** (randomly assigned at hire, 1–2 per minion):
- **Ambitious** — works faster near department managers, slows when unmanaged
- **Lazy** — occasionally "takes a break" (brief idle pause), but higher efficiency when working
- **Chatty** — generates flavor text notifications about their day
- **Paranoid** — works slower at high notoriety, faster at low notoriety
- **Show-off** — small chance to generate bonus gold, but increases notoriety slightly

**Personality events:** After completing X tasks, a minion might trigger a brief event:
- "Grim wants to talk about their career goals." (Choose: +loyalty or +stat)
- "Skulk found a shortcut. Use it?" (Choose: faster completion or safer route)
- "Vex is feuding with Mortis. Resolve it?" (Choose: +both loyalty or +one stat each)

### Loyalty System [PROPOSED]

- Minions start with neutral loyalty
- Loyalty increases by: completing tasks, being promoted, player choosing their events favorably
- Loyalty decreases by: ignoring events, being reassigned frequently, working at high notoriety
- **Loyal minions** (+15% all stats, won't flee during raids)
- **Disloyal minions** (-10% all stats, may leave if notoriety stays high)
- **Mercenary minions** (new hires start here — no bonus or penalty)

### Retirement [PROPOSED]

Level 10+ minions can be retired:
- Permanent passive bonus to all future minions in that specialty (+1% speed/efficiency per retired minion's level)
- Retired minion joins the "Hall of Infamy" — a trophy display
- Retirement frees a minion slot, encouraging turnover rather than hoarding
- Legendary minions (level 15+) provide enhanced retirement bonuses

---

## Campaign Arc

### Act 1 — Startup Evil (Villain Level 1–6)

**Theme:** Learning the ropes. Everything is small-scale and scrappy.

**Story beats:**
1. **Prologue:** Previous boss defeated. You're "promoted." Tutorial introduces basic loop.
2. **First Hire:** Your first minion arrives. They're... not impressed with the facilities.
3. **Department Discovery:** Unlock each department as you hire specialists. Each unlock gets a brief intro: "Welcome to the Research Division. Please don't touch the beakers. Especially the glowing ones."
4. **First Hero Encounter:** A local hero starts investigating. Introduces the notoriety system dramatically.
5. **Act 1 Boss — The Local Hero:** A scripted raid at notoriety 50. Defeat them through gameplay (not cutscene). Reward: permanent -5% notoriety gain, "Hero Repellent" trophy.

**Design goal:** Teach all core mechanics. Player should understand gold, notoriety, departments, and upgrades by end of Act 1.

### Act 2 — Going Corporate (Villain Level 7–12)

**Theme:** Scaling up. Rivals appear. The stakes get real.

**Story beats:**
1. **Rival Introduction:** Another villain organization starts competing for the same missions. Occasionally "steals" board slots (missions disappear faster).
2. **Corporate Restructuring:** Unlock the resource economy (Supplies/Intel/Loot/Chaos sinks become available).
3. **The Hero League Forms:** No longer one hero — it's an organization. Raids become more frequent and more dangerous.
4. **Double Agent Event:** One of your minions is a hero spy. Choose: expose them (lose the minion) or turn them (risky but +loyalty to all minions if it works).
5. **Act 2 Boss — Hero League Captain:** Scripted multi-phase raid at notoriety 75. Phase 1: defend the base. Phase 2: counter-attack (special chain mission). Reward: unlock department managers.

**Design goal:** Introduce resource economy and automation. Player transitions from manual management to strategic oversight.

### Act 3 — World Domination Inc. (Villain Level 13–20)

**Theme:** Full empire. The final push.

**Story beats:**
1. **Global Operations:** Missions now reference world-scale schemes ("Steal the Declaration of Independence", "Redirect the Gulf Stream").
2. **The Board of Evil:** Other villain organizations propose an alliance. Join or go solo? Each choice changes available missions.
3. **Technology Apex:** Tech tree completion unlocks the "Doomsday Project" — a multi-department mega-mission requiring all 4 departments at level 10.
4. **The Chosen One Arrives:** The heroes' ultimate weapon — a prophesied champion. Final countdown begins.
5. **Act 3 Boss — The Chosen One:** Epic multi-phase encounter. Uses all game systems. Reward: victory screen + endless mode unlock.

**Design goal:** Test mastery of all systems. Everything the player has built matters. The final boss should require a well-tuned evil machine.

### Epilogue — Endless Mode

You "won," but evil never rests. The organization needs to keep running.

---

## Story Delivery

### Principles
- **Never block gameplay.** All story delivery is non-modal and dismissible.
- **Show, don't tell.** Deliver narrative through game mechanics (new mission types, system changes) rather than long text dumps.
- **Earn it.** Story beats unlock through gameplay milestones, not timers.

### Delivery Channels

**Milestone events:**
- Triggered by reaching specific villain levels, department levels, or completion counts
- Brief text panel appears at top of screen, auto-dismisses after 8 seconds or on click
- "New department unlocked!" style — informative, not interruptive

**Act transition panels:**
- Full-screen overlay (rare — only 3 in the whole game)
- Brief narrative summary + illustration
- "Press anywhere to continue" — player controls pacing

**Minion dialogue bubbles:**
- Small speech bubbles on minion cards during personality events
- Flavor text only — never mechanically important information
- "My horoscope said today would be good for espionage."

**Mission flavor text:**
- Mission descriptions carry narrative threads
- Act 1 missions reference local scale ("rob the corner store")
- Act 3 missions reference global scale ("infiltrate the UN")
- Chain missions tell mini-stories across 2–3 connected tasks

**Evil Newsletter:**
- Periodic notification styled as an internal company newsletter
- "This Week in Evil: Research division sets new personal best for explosions"
- World-building that doesn't require player attention
- Can be collected in a "Newsletter Archive" for lore enthusiasts

---

## Endless Mode Hooks [PROPOSED]

### Weekly Villain Challenges
- Themed constraints that last 7 days (real-time)
- "Pacifist Week: Mayhem department locked. Compensation: +50% gold from other departments."
- "Speed Run: All tasks complete 2x faster but grant 2x notoriety."
- Completing challenges earns cosmetic rewards or permanent minor bonuses

### Rival Villain AI
- Procedurally generated rival with their own "personality" (aggressive, sneaky, methodical)
- Competes for territory (missions, resources)
- Can be sabotaged using Chaos resource
- Defeating a rival grants their "signature move" as a permanent bonus

### Crisis Events
- Procedurally generated multi-day events
- "Hero Academy Graduation: Hero encounters 3x more frequent for 48 hours"
- "Market Crash: Gold rewards halved, but upgrades cost 50% less"
- "Minion Strike: All minions idle for 2 minutes unless bribed (50g each)"

### Prestige System
- Reset progress for permanent multipliers
- Each prestige gives a new villain identity (new name, new title track)
- Prestige currency ("Infamy Points") spent on permanent unlocks
- Prestige unlocks: starting bonuses, exclusive missions, cosmetic themes
- **Key design:** prestige should feel rewarding, not punishing. Players should want to prestige, not feel forced.
