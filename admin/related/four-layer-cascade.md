# The Four-Layer Cascade — Constraints, Qualities, Functions

> The reframe: function underdetermines software. The same user story becomes fifty different pieces of software depending on the constraints it lives inside and the qualities it's tuned for. A user story without a constraint box and a quality vector is not a requirement — it's a wish.

## Why this model exists

Traditional curricula treat non-functional requirements as a checklist that appears after the features are decided. That ordering is backwards. Constraints and qualities should be the coordinate system features are placed into, not a finishing pass over work that's already happened.

The cascade separates three things that are often muddled together:

- **Constraints** — the walls of the box you must work inside. Non-negotiable or expensive to move.
- **Qualities** — dimensions you tune, graded and tradeable, inside the box.
- **Functions** — what the system does, shaped by the qualities and executed within the constraints.

Constraints set the size of your quality budget. Qualities are how you spend it. Functions are what you build with what's left.

---

## Layer 1 — Stakeholders

Every project starts with four kinds of stakeholder and most projects remember only one.

**Users**, usually in segments — power users and casual users need different software even when they want the same feature. **The organization** has goals (revenue, reputation, strategic position) and fears (liability, churn, reputational damage). **Society and regulators** set rules and norms the software must sit inside whether the team likes it or not. **The future maintainer** — frequently the student's own future self — who has to change this code six months from now with half the context.

For each stakeholder the exercise is the same: write down what they *want* and what they *fear*. The fears are usually more informative than the wants. Nobody says "I want software that doesn't leak my data" — they say "I'm afraid of being embarrassed."

## Layer 2 — Constraints

Constraints are the walls. They include:

- **Iron triangle** — time, budget, scope. The classic meta-constraint. You can pick two.
- **Legal and regulatory** — GDPR, HIPAA, FERPA, accessibility law (ADA, EN 301 549), export controls. Binary and auditable. Not a quality you tune, a wall you hit.
- **Platform and environment** — browsers, devices, networks, offline conditions, the actual computers real users have.
- **Team capability** — what this specific team can build well. A constraint students forget because it feels like cheating to admit.
- **Organizational policy** — internal rules, approved vendor lists, deploy processes, the CIO's opinion.

The critical instinct: constraints are established first and revisited only when something moves. Don't pretend a wall doesn't exist because it's inconvenient to the design you already love.

*Situational suitability splits across categories and the split is itself instructive.* Regulatory fit is a constraint (did you comply or didn't you). Cultural and social fit is a quality (how well does this land in context). Same phrase, two layers.

## Layer 3 — Qualities (the ilities)

Qualities are the dimensions you tune within the box. A starting set of twelve:

usability, accessibility, aesthetic integrity, performance, reliability, security & privacy, maintainability, modifiability, portability, observability, internationalization, cultural/situational fit.

The rule is **forced scarcity**: pick at most three as Critical. You cannot maximize everything. A project that lists ten Criticals has done no prioritization and will quietly optimize for whichever quality the team finds most fun to work on.

The quality vector is bounded by the constraint box above it. You cannot declare accessibility Critical on a two-week timeline with a team that has never run axe. The ambition has to match the budget the constraints left behind. When the ambition exceeds the budget, something has to move — stretch a constraint wall, or lower the quality target. Pretending neither has to happen is how projects fail.

## Layer 4 — Functions and architecture

Functions are what the software does. They come from stakeholder needs, shaped by the quality vector, executed within the constraint box. The architecture that implements them is a *consequence* of layers 1–3, not an independent choice.

A concrete example: *"Because accessibility is Critical and offline fit is Acceptable, we will not ship a SPA without a server-rendered fallback."* That sentence is an architectural commitment that follows directly from the layers above. It is not a preference. It is not a framework debate. It is what the cascade produced.

---

## Diagnosis — the failure ladder

When a project goes sideways, the four layers double as a failure taxonomy. Walk up from the bottom:

1. **Wrong functions or architecture.** Built it badly. Bugs, brittleness, wrong abstraction. This is where most postmortems stop.
2. **Wrong quality priorities.** The thing works and nobody wants to use it. Optimized for the wrong ilities.
3. **Wrong constraints.** Promised what couldn't be delivered in the time, money, or skill available. The plan was impossible before the first commit.
4. **Wrong stakeholder model.** Built the wrong thing for the wrong people. The software succeeds on its own terms and fails in the world.

Most postmortems blame layer 4 (really: layer 1 in this list — "built it badly") when the rot is actually at the top. Giving students the vocabulary to name the higher layers is the point.

---

## The Constraint Canvas — Layer 2 tool

A small web component (Vanilla Breeze host) that captures the constraint box before any quality or function work begins.

**What it does.** Presents the five constraint categories — iron triangle, legal, platform, capability, policy — with structured inputs for each. The iron triangle uses three sliders plus a "pick two" lock that forces the user to acknowledge the trade. Legal is a checklist by jurisdiction. Platform and capability are free-text with prompts. Policy is a simple list.

**What it outputs.** A JSON constraint profile. Small, machine-readable, versionable, committable alongside the code it constrains.

```json
{
  "ironTriangle": {
    "time": "6 weeks",
    "budget": "2 devs",
    "scope": "MVP features only",
    "locked": ["time", "budget"]
  },
  "legal": ["GDPR", "WCAG 2.1 AA"],
  "platform": ["evergreen browsers", "no native apps", "flaky mobile networks"],
  "capability": ["strong JS", "no backend experience", "never shipped an a11y audit"],
  "policy": ["no third-party analytics", "must deploy through org CI"]
}
```

**Why it's separate from the Compass.** Constraints are the walls; qualities are what fits inside them. Mixing them in one tool is the category error that made the first draft of this model wrong. The Canvas runs first. Its output becomes an input to the Compass.

## The NFR Compass — Layer 3 tool

A second web component that takes the constraint profile as input and helps the student build a *defensible* quality vector.

**What it does.** Presents the twelve ilities. For each, the student picks Critical / Important / Acceptable / Not-relevant. The UI enforces max three Criticals — the forced scarcity is the whole pedagogical point. Where the constraint profile makes a Critical pick implausible, the tool flags it:

> *You picked accessibility as Critical, but your constraint profile says the team has never shipped an a11y audit and the budget is two devs for six weeks. Raise a wall or lower the ambition.*

That friction **is** the lesson.

**What it outputs.** A JSON quality vector with a short rationale sentence per Critical pick.

```json
{
  "critical": [
    { "ility": "accessibility",    "why": "core segment uses screen readers" },
    { "ility": "maintainability",  "why": "students hand this off in week 10" },
    { "ility": "performance",      "why": "target users on 3G campus wifi" }
  ],
  "important":   ["usability", "security", "observability"],
  "acceptable":  ["aesthetic", "modifiability", "portability", "i18n"],
  "notRelevant": ["offline", "cultural fit"]
}
```

**Why forced scarcity matters.** Without the cap, students list every ility as Critical and learn nothing. With the cap, they argue. The argument is the learning. A pair of students defending three different Critical picks each is doing the exact cognitive work the tool exists to provoke.

## How the two tools compose

The Canvas runs first and produces the constraint profile. The Compass consumes the profile and produces the quality vector. Both outputs — plus the stakeholder list and the derived architectural commitments — feed the **Pre-Code Brief**, a structured `CLAUDE.md` sitting at the root of the repo that Claude Code reads on every turn.

```
Canvas (constraints)  ─┐
                       ├─►  Pre-Code Brief (CLAUDE.md)  ─►  agent + human build
Compass  (qualities)  ─┘
```

The brief is the world-model externalized. The Canvas and Compass are the instruments that populate it. The four layers are what they're measuring. The cascade is why the order matters.

---

> **Bottom line for students.** Agentic dev removed the friction of writing code. It also removed the natural pause where developers used to think. The Canvas, the Compass, and the Brief are the reintroduced friction — deliberate, structured, and the place where your judgment still matters. Not more documentation. The only part of the process where being a human is still the point.
