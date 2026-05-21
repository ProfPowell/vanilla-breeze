# UUCD Pre-Code Toolkit — Component Catalog

A working list of the components the four-layer cascade actually needs, organized by how essential each one is. Every component is a small, single-responsibility Vanilla Breeze web component with a JSON-in / JSON-out contract so they compose without coupling. The goal is the smallest set that makes the cascade real, not the biggest set that covers every imaginable case.

The catalog is opinionated about what should stay separate. The Canvas/Compass split was the lesson of the previous round — collapsing categories is the failure mode, not a feature. Where two things look mergeable, the default answer is "leave them apart and let them compose."

---

## Tier 1 — The Spine

Four components. Without all four the cascade has no instrument. With all four a student can walk a real project from a stakeholder list to a `CLAUDE.md` an agent can build against.

### 1. Stakeholder Atlas *(Layer 1)*

Captures the four stakeholder kinds — users (in segments), organization, society/regulator, future maintainer — and for each one a paired list of *wants* and *fears*. The fears column is the one students skip and the one that does the most work; the UI should make it the same visual weight as wants, not an afterthought field. Output is a JSON stakeholder list that the Trace Matrix and the Brief both consume.

The pedagogical move baked into the component: it refuses to accept a stakeholder with no fears. Every entry needs at least one. That single constraint surfaces more honest thinking than any prompt could.

### 2. Constraint Canvas *(Layer 2)*

The walls of the box. Five categories — iron triangle, legal & regulatory, platform & environment, team capability, organizational policy — each with its own input pattern. Iron triangle gets sliders plus a "pick two" lock to force the trade. Legal is a checklist by jurisdiction (FERPA, GDPR, WCAG, ADA, EN 301 549, sector-specific). Platform, capability, and policy are structured free text with prompting placeholders.

Output is a JSON constraint profile. It runs first in the workflow because the constraint profile bounds everything that follows.

The hardest part of the component is the capability field. Students will lie to themselves about what their team can do. The component should prompt with concrete questions ("has anyone on this team shipped X?", "could you debug a memory leak in production tonight?") rather than free space, because free space invites optimism and concrete questions invite honesty.

### 3. NFR Compass *(Layer 3)*

Twelve ilities, four levels (Critical / Important / Acceptable / Not relevant), max three Criticals enforced by the UI. Takes the constraint profile from the Canvas as input and flags Critical picks that the constraints make implausible. Each Critical pick requires a one-sentence rationale field — and the field is required, not optional, because the rationale is the artifact that protects the choice from being relitigated every Monday.

Output is a JSON quality vector. The forced scarcity is the entire point: a list of all-Criticals is no list at all.

### 4. Pre-Code Brief Assembler

Not really a separate UI — more of a generator that takes the outputs of the Atlas, Canvas, Compass, and Trace Matrix and emits a structured `CLAUDE.md` at the repo root. The brief is the externalized world-model the agent reads on every turn. The Assembler's job is to make sure the brief stays in sync with the four upstream artifacts and to fail loudly when they drift.

A sensible implementation puts the four JSON files in `.uucd/` and regenerates `CLAUDE.md` from them on commit. The brief is read-only output; you edit the inputs.

---

## Tier 2 — The Connective Tissue

Three components that turn the spine from a set of artifacts into a working method. Tier 1 without Tier 2 is a pile of documents. Tier 1 plus Tier 2 is a process.

### 5. Stakeholder → Ility → Story Trace

A three-column matrix. Every user story has to anchor in at least one stakeholder need *and* declare which ilities it stresses. Orphan rows — stories with no stakeholder, no driving quality, or both — light up red. Those red rows are the warning lights; they're features built on vibes.

The component is tiny but earns its place by making the orphan-row pattern visible. Students consistently underestimate how many of their features have no real owner until they see a column of red.

Output is a JSON trace, embedded in the brief, used by the Architecture Commitment Log to derive constraints on the implementation.

### 6. Architecture Commitment Log

The cascade only matters if it produces decisions that bind the code. This component captures sentences of the form *"Because [quality] is Critical and [constraint] holds, we will [architectural choice] and we will not [alternative]."* Each commitment links back to the Compass entry and the Canvas entry that produced it.

Why it's separate from the Brief: commitments accumulate over the life of the project, the brief is a snapshot. The log is the audit trail. When someone six months later asks "why on earth did we pick this stack?" the answer is in the log, with provenance back to the original constraint and quality decisions.

A reasonable starting set of commitment templates lives inside the component so students aren't writing every one from scratch. Templates are scaffolding, not handcuffs — students should override them when the situation demands.

### 7. Definition-of-Done by Ility

Done is usually defined per feature ("the form submits"). Under UUCD it's defined per quality ("the bundle is under N kb, axe passes, the maintainability check — a fresh student finds feature X in under 90 seconds — passes"). This component generates a DoD checklist from the Critical and Important picks in the Compass, with sensible defaults the student can edit.

The reframe matters: a feature can be functionally complete and DoD-incomplete at the same time. That gap is where most "we shipped it but it sucks" projects live.

---

## Tier 3 — Useful but Deferrable

Three components that earn their keep eventually but should not block shipping the toolkit. Build these only after Tiers 1 and 2 are in real student hands.

### 8. Quality Envelope Visualizer

A small radar/spider chart that shows the *feasible region* of qualities given the current constraint profile, with the student's chosen vector overlaid. When the chosen vector pokes outside the feasible region, the chart shows it and the student has to choose: stretch a constraint wall or pull the quality target back in.

This is largely a UX layer over data the Compass already has. It's deferrable because a good Compass with honest flagging covers 80% of the same lesson. The visualizer is the part that makes the lesson stick for visual learners — worth building, but only after the spine works.

A real engineering risk: spider charts are notoriously misleading about magnitudes. If you build this, resist the urge to make it "look impressive" — accuracy beats polish.

### 9. Failure Ladder Diagnostic

A guided postmortem tool that walks the four layers from the bottom up, asking "did this layer fail?" at each step. Because most postmortems blame layer 4 (the code) when the rot is at layer 1 or 2, the diagnostic forces the conversation to start at layer 1 and only descend when the upper layer is honestly cleared.

Output is a structured postmortem that connects the failure to the layer, with links back to the original Atlas/Canvas/Compass artifacts where the wrong call was made. Most valuable as a teaching tool — students who run it on their own projects develop the diagnostic vocabulary the rest of the toolkit assumes they have.

### 10. Drift Tracker

When a Tier 1 input changes — a constraint moves, a stakeholder fear is added, a Critical quality demotes — this component flags every downstream artifact that may now be wrong. Architecture commitments built on the old constraint, DoD entries based on the old quality vector, trace rows that no longer anchor cleanly. It doesn't fix anything; it just surfaces what needs re-examining.

Deferrable because in early use the four Tier 1 artifacts are small enough that drift is obvious. It becomes essential at the project size where the artifacts no longer fit on one screen. For undergraduate course work, that may be never. For real projects in the Vanilla Breeze ecosystem, it shows up fast.

---

## What deliberately did **not** make the list

A few things I considered and cut, with the reasoning, because the cuts are part of the design:

**A Risk Register.** Tempting, but stakeholder fears (in the Atlas) and constraint walls (in the Canvas) cover most of the same ground. A separate register adds a third place to look for the same information and a third place for it to go stale. If a real risk register is needed, it should be a *view* over the Atlas and Canvas, not a new document.

**A Persona Builder.** Personas are users (Layer 1) with fictional names. The Stakeholder Atlas already handles user segments. Adding a persona builder duplicates the field set and invites students to spend an hour on stock photos instead of fifteen minutes on fears. If your course uses personas, fold them into the Atlas as a render mode, not a new component.

**A Tech Stack Picker.** Stack is a *consequence* of the cascade, not an input to it. Building a component that picks frameworks is the exact category error UUCD exists to fight — it would tempt students to pick the stack first and back-justify it. The Architecture Commitment Log replaces this on purpose: stack choices are commitments derived from constraints and qualities, with provenance.

**An ROI / Business Case Calculator.** Out of scope. Belongs to Layer 1's organizational stakeholder, captured as a "want" and a "fear." A spreadsheet, not a UUCD component.

---

## Composition

```
Atlas ──┐
        │
Canvas ─┼─► Trace ─► Architecture Commitments ──┐
        │                                        │
Compass ┘                                        ├─► Pre-Code Brief (CLAUDE.md)
                                                 │
                              DoD by Ility ──────┘

(Tier 3 sits on the side: Envelope visualizes the Compass; Diagnostic walks
 the whole cascade backwards; Drift Tracker watches the inputs for changes.)
```

Read left to right: Atlas, Canvas, and Compass populate independently; the Trace ties them to user stories and surfaces orphans; commitments and DoD derive from those joined facts; the Brief assembles all of it into the file the agent reads. Each box is a single web component with a JSON contract and no opinion about who calls it.

---

## Build order, if you only had one weekend

Tier 1, in this order:

1. **Constraint Canvas first** — without the constraint profile the Compass can't enforce its flags, and the flags are 80% of the Compass's value.
2. **NFR Compass second** — the moment students play with forced scarcity, the lesson starts paying off.
3. **Stakeholder Atlas third** — add it once the bottom two are real, because the Atlas is most useful when students can immediately see how its output flows into the Canvas and Compass.
4. **Pre-Code Brief Assembler last** — it has no value until the three upstream artifacts exist, but adding it converts the loose tools into a method.

Then stop. Watch students use the spine for two weeks. Tier 2 will tell you which piece they're missing first; build that one next. Don't build Tier 3 until Tier 2 is in steady use.

The discipline is the same one the cascade itself teaches: don't optimize what you haven't yet bounded. Ship the spine, see what hurts, build the next thing in response to actual pain, not anticipated need.
