# 🏠 Floor Planner — Integration Guide for HDE

## What You Get

A full canvas-based floor planner integrated directly into your existing HDE
app as a new tab, with:

- **Drag & drop room placement** — click to place, drag to move, resize from
  corner handles
- **12 Indian room types** — Master Bedroom, Puja Room, Servant Quarters,
  Terrace, Garage, etc.
- **Vastu Shastra checker** — real-time colour-coded overlay showing
  directional compliance per room
- **Auto dimensions** — shows feet × feet and sq.ft on every room
- **Plot boundary** — set your plot width × depth in feet
- **Door & window** drawing tools
- **Wall drawing** tool (click+drag)
- **Cost estimate** — per-room and total, using realistic Indian rates per sq.ft
- **Summary tab** — room table + Vastu report + save to dashboard

---

## 3-Step Integration

### Step 1 — Copy the component

Copy `FloorPlannerCalculator.tsx` into:

```
src/features/construction/FloorPlannerCalculator.tsx
```

No new npm packages needed — it only uses React + native Canvas API.

---

### Step 2 — Replace CalculatorTabs

Replace your existing file:

```
src/features/construction/CalculatorTabs.tsx
```

with the provided `CalculatorTabs.tsx`. The only change is:
- Added `"floor-planner"` to the `CalculatorType` union
- Added the new tab entry (marked as FREE, not premium)
- Added a green "NEW" badge on the tab

---

### Step 3 — Replace App.tsx

Replace `src/App.tsx` with the provided `App.tsx`. The changes are:
- Added `"floor-planner"` to the `CalculatorType` union
- Added the lazy import for `FloorPlannerCalculator`
- Added the `case "floor-planner"` in `renderCalculator()`

---

## File Summary

| File | Action | Destination |
|------|--------|-------------|
| `FloorPlannerCalculator.tsx` | COPY (new file) | `src/features/construction/` |
| `CalculatorTabs.tsx` | REPLACE existing | `src/features/construction/` |
| `App.tsx` | REPLACE existing | `src/` |

---

## Vastu Logic

The Vastu checker works by dividing the canvas into a 3×3 directional grid
(N/NE/E/SE/S/SW/W/NW) and checking whether each room is positioned in the
correct zone according to traditional Vastu Shastra rules:

| Room | Ideal Direction |
|------|----------------|
| Kitchen | SE (Agni/fire corner) |
| Puja Room | NE (Ishaan/divine corner) |
| Master Bedroom | SW (stability) |
| Living Room | N or NE |
| Bathroom | W or NW |
| Study | N or W |

---

## Making Floor Planner Premium (Optional)

If you want to lock it behind Pro, open `CalculatorTabs.tsx` and change:

```ts
{ id: "floor-planner", ..., isPremium: false }
//                              ↑ change to true
```

---

## Cost Rates Used

These are the per sq.ft rates used for the cost estimate:

```ts
Kitchen:          ₹2,500/sq.ft
Puja Room:        ₹2,800/sq.ft
Bathroom:         ₹3,000/sq.ft
Living Room:      ₹2,200/sq.ft
Master Bedroom:   ₹2,000/sq.ft
Bedroom:          ₹1,800/sq.ft
Terrace:          ₹800/sq.ft
Garage:           ₹1,000/sq.ft
```

Adjust these in the `COST_PER_SQFT` constant in `FloorPlannerCalculator.tsx`.
