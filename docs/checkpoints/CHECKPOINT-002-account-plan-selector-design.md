# CHECKPOINT-002: Account Plan Selector Component Design

**Date**: 2025-10-12
**Type**: UX/Design Review
**Engineer**: FE
**Status**: ⏸️ AWAITING JUSTIN APPROVAL

---

## Component Purpose

Allow CSMs to select which strategic plan applies to a customer during the "Establish Account Plan" workflow.

---

## Visual Design (ASCII Mockup)

```
┌─────────────────────────────────────────────────────────────────┐
│  Select Account Plan for Obsidian Black                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  INVEST  │  │  EXPAND  │  │  MANAGE  │  │ MONITOR  │      │
│  │          │  │          │  │          │  │          │      │
│  │  1.5x    │  │  1.3x    │  │  1.0x    │  │  1.2x    │      │
│  │          │  │          │  │          │  │          │      │
│  │ Long-term│  │Short-term│  │ Standard │  │ At-risk  │      │
│  │strategic │  │ revenue  │  │  touch   │  │defensive │      │
│  │  growth  │  │opportunity│  │high-event│  │attention │      │
│  │          │  │          │  │          │  │          │      │
│  │ [Select] │  │ [Select] │  │ [Select] │  │ [Select] │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  Currently selected: None                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Decisions Needed

**Layout:**
- **A.** Horizontal row (as shown above) - scannable, fits existing patterns
- **B.** 2x2 grid - more compact, saves vertical space
- **C.** Vertical stack - most clear, requires scrolling

**PM Recommendation:** A (horizontal row)

---

**Card Design:**
- **A.** Minimal with just plan name + description (as shown)
- **B.** Add help icon (?) for more details
- **C.** Add visual icon/illustration for each plan type

**PM Recommendation:** A (minimal, clean)

---

**Selection State:**
- **A.** Subtle border highlight on selected card
- **B.** Fill color change on selected card
- **C.** Checkmark icon appears on selected card

**PM Recommendation:** A (subtle border, calm aesthetic)

---

**Multiplier Display:**
- **A.** Show multipliers (1.5x, 1.3x, etc.) as shown
- **B.** Hide multipliers (too technical for CSM)
- **C.** Show in tooltip only

**PM Recommendation:** A (show multipliers, helps CSMs understand priority impact)

---

## Behavior

**Hover State:**
- Card scales slightly (1.02x)
- Subtle shadow appears
- Cursor changes to pointer

**Click Behavior:**
- Deselects any previously selected card
- Highlights clicked card
- Enables "Continue" button in workflow
- No confirmation dialog (can change selection)

**Mobile/Responsive:**
- < 768px width: Stack vertically
- Maintain card proportions

---

## Questions for Justin

**Q1**: Horizontal row vs grid vs stack?
**Q2**: Show multipliers or hide them?
**Q3**: Any visual elements beyond text (icons, colors)?
**Q4**: Should there be a "Not sure - recommend a plan" option?

---

## Approval

- [ ] **Justin Approved Layout Option**: _____ (A/B/C)
- [ ] **Justin Approved Card Design**: _____ (A/B/C)
- [ ] **Justin Approved Selection Style**: _____ (A/B/C)
- [ ] **Justin Approved Multiplier Display**: _____ (A/B/C)
- [ ] **Justin Requested Changes** - See notes below:

**Notes:**
