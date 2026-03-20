import React, { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { formatCurrency } from "../../utils/currency";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tool = "select" | "wall" | "room" | "door" | "window" | "element";

interface Point { x: number; y: number; }

interface Wall {
  id: string; x1: number; y1: number; x2: number; y2: number; thickness: number;
}
interface Room {
  id: string; x: number; y: number; width: number; height: number; label: string; color: string;
}
interface Door {
  id: string; x: number; y: number; width: number; rotation: number;
}
interface WindowEl {
  id: string; x: number; y: number; width: number; rotation: number;
}
interface RoomElement {
  id: string; type: string; x: number; y: number; width: number; height: number; rotation: number; color: string;
}
interface FloorPlan {
  rooms: Room[]; walls: Wall[]; doors: Door[]; windows: WindowEl[]; elements: RoomElement[];
  gridSize: number; scale: number;
}
type SelectedItem =
  | { kind: "room"; item: Room }
  | { kind: "door"; item: Door }
  | { kind: "window"; item: WindowEl }
  | { kind: "element"; item: RoomElement }
  | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_SIZE = 20;
const CANVAS_W = 1400;
const CANVAS_H = 900;
const SNAP = GRID_SIZE;

const ROOM_PRESETS = [
  { label: "Master Bedroom",   w: 14, h: 12, color: "#FFF3E0" },
  { label: "Bedroom",          w: 12, h: 10, color: "#E8F5E9" },
  { label: "Living Room",      w: 18, h: 14, color: "#E3F2FD" },
  { label: "Kitchen",          w: 12, h: 10, color: "#FCE4EC" },
  { label: "Bathroom",         w:  6, h:  8, color: "#F3E5F5" },
  { label: "Dining Room",      w: 14, h: 12, color: "#E0F2F1" },
  { label: "Study",            w: 10, h: 10, color: "#FBE9E7" },
  { label: "Store Room",       w:  8, h:  6, color: "#EFEBE9" },
  { label: "Servant Quarters", w: 10, h:  8, color: "#ECEFF1" },
  { label: "Terrace",          w: 20, h: 16, color: "#E8EAF6" },
  { label: "Garage",           w: 12, h: 20, color: "#CFD8DC" },
  { label: "Balcony",          w: 10, h:  6, color: "#DCEDC8" },
];

const COST_PER_SQFT: Record<string, number> = {
  "Master Bedroom": 2000, "Bedroom": 1800, "Living Room": 2200,
  "Kitchen": 2500, "Bathroom": 3000, "Dining Room": 2000,
  "Study": 1800, "Store Room": 1200, "Servant Quarters": 1500,
  "Terrace": 800, "Garage": 1000, "Balcony": 900,
};

interface ElementDef {
  type: string; label: string; category: string; w: number; h: number; color: string; icon: string;
}

const ELEMENT_DEFS: ElementDef[] = [
  { type: "kitchen-counter", label: "Counter",      category: "Kitchen",  w: 8,  h: 3,  color: "#D7CCC8", icon: "🍳" },
  { type: "sink",            label: "Sink",         category: "Kitchen",  w: 3,  h: 3,  color: "#B3E5FC", icon: "🚿" },
  { type: "stove",           label: "Stove/Hob",    category: "Kitchen",  w: 4,  h: 3,  color: "#FFCCBC", icon: "🔥" },
  { type: "fridge",          label: "Fridge",       category: "Kitchen",  w: 3,  h: 4,  color: "#E1F5FE", icon: "❄️" },
  { type: "dishwasher",      label: "Dishwasher",   category: "Kitchen",  w: 3,  h: 3,  color: "#F5F5F5", icon: "🫧" },
  { type: "toilet",          label: "Toilet",       category: "Bathroom", w: 3,  h: 4,  color: "#F3E5F5", icon: "🚽" },
  { type: "bathtub",         label: "Bathtub",      category: "Bathroom", w: 5,  h: 9,  color: "#E3F2FD", icon: "🛁" },
  { type: "shower",          label: "Shower",       category: "Bathroom", w: 4,  h: 4,  color: "#E1F5FE", icon: "🚿" },
  { type: "washbasin",       label: "Washbasin",    category: "Bathroom", w: 3,  h: 3,  color: "#F3E5F5", icon: "🪥" },
  { type: "bed-double",      label: "Double Bed",   category: "Bedroom",  w: 8,  h: 10, color: "#FFF8E1", icon: "🛏" },
  { type: "bed-single",      label: "Single Bed",   category: "Bedroom",  w: 5,  h: 10, color: "#FFF8E1", icon: "🛏" },
  { type: "wardrobe",        label: "Wardrobe",     category: "Bedroom",  w: 8,  h: 3,  color: "#EFEBE9", icon: "🚪" },
  { type: "dresser",         label: "Dresser",      category: "Bedroom",  w: 5,  h: 3,  color: "#EFEBE9", icon: "🪞" },
  { type: "side-table",      label: "Side Table",   category: "Bedroom",  w: 2,  h: 2,  color: "#F5F5F5", icon: "🪑" },
  { type: "sofa-3",          label: "3-Seat Sofa",  category: "Living",   w: 10, h: 4,  color: "#EDE7F6", icon: "🛋" },
  { type: "sofa-l",          label: "L-Sofa",       category: "Living",   w: 12, h: 8,  color: "#EDE7F6", icon: "🛋" },
  { type: "coffee-table",    label: "Coffee Table", category: "Living",   w: 5,  h: 3,  color: "#D7CCC8", icon: "☕" },
  { type: "tv-unit",         label: "TV Unit",      category: "Living",   w: 8,  h: 2,  color: "#455A64", icon: "📺" },
  { type: "dining-4",        label: "Dining 4-str", category: "Dining",   w: 6,  h: 8,  color: "#D7CCC8", icon: "🍽" },
  { type: "dining-6",        label: "Dining 6-str", category: "Dining",   w: 8,  h: 10, color: "#D7CCC8", icon: "🍽" },
  { type: "study-desk",      label: "Study Desk",   category: "Study",    w: 6,  h: 3,  color: "#F5F5F5", icon: "💻" },
  { type: "bookshelf",       label: "Bookshelf",    category: "Study",    w: 5,  h: 2,  color: "#EFEBE9", icon: "📚" },
  { type: "plant-lg",        label: "Plant (lg)",   category: "Decor",    w: 2,  h: 2,  color: "#C8E6C9", icon: "🌿" },
  { type: "plant-sm",        label: "Plant (sm)",   category: "Decor",    w: 1,  h: 1,  color: "#DCEDC8", icon: "🌱" },
  { type: "ac",              label: "A/C Unit",     category: "Appliance",w: 4,  h: 1,  color: "#B3E5FC", icon: "❄️" },
];

const ELEMENT_CATEGORIES = ["Kitchen","Bathroom","Bedroom","Living","Dining","Study","Decor","Appliance"];

interface PresetPlan {
  name: string; size: string; description: string; plotW: number; plotD: number;
  rooms: Omit<Room,"id">[];
}

const PRESET_PLANS: PresetPlan[] = [
  {
    name: "1BHK Compact", size: "600 sq.ft",
    description: "Cozy 1-bedroom with living, kitchen & bath",
    plotW: 25, plotD: 30,
    rooms: [
      { x: 100, y: 80,  width: 240, height: 200, label: "Living Room",    color: "#E3F2FD" },
      { x: 100, y: 280, width: 180, height: 160, label: "Master Bedroom", color: "#FFF3E0" },
      { x: 280, y: 280, width: 140, height: 160, label: "Kitchen",        color: "#FCE4EC" },
      { x: 100, y: 440, width: 120, height: 100, label: "Bathroom",       color: "#F3E5F5" },
      { x: 220, y: 440, width: 200, height: 100, label: "Balcony",        color: "#DCEDC8" },
    ]
  },
  {
    name: "2BHK Standard", size: "1000 sq.ft",
    description: "2 bedrooms, living, dining, kitchen & baths",
    plotW: 35, plotD: 40,
    rooms: [
      { x: 80,  y: 60,  width: 280, height: 200, label: "Living Room",    color: "#E3F2FD" },
      { x: 360, y: 60,  width: 200, height: 160, label: "Dining Room",    color: "#E0F2F1" },
      { x: 80,  y: 260, width: 220, height: 180, label: "Master Bedroom", color: "#FFF3E0" },
      { x: 300, y: 260, width: 200, height: 180, label: "Bedroom",        color: "#E8F5E9" },
      { x: 360, y: 220, width: 200, height: 200, label: "Kitchen",        color: "#FCE4EC" },
      { x: 80,  y: 440, width: 120, height: 100, label: "Bathroom",       color: "#F3E5F5" },
      { x: 200, y: 440, width: 120, height: 100, label: "Bathroom",       color: "#F3E5F5" },
      { x: 560, y: 60,  width: 160, height: 100, label: "Balcony",        color: "#DCEDC8" },
    ]
  },
  {
    name: "3BHK Family", size: "1500 sq.ft",
    description: "3 beds, study, 2 baths & terrace",
    plotW: 45, plotD: 50,
    rooms: [
      { x: 60,  y: 60,  width: 320, height: 220, label: "Living Room",    color: "#E3F2FD" },
      { x: 380, y: 60,  width: 220, height: 180, label: "Dining Room",    color: "#E0F2F1" },
      { x: 60,  y: 280, width: 240, height: 200, label: "Master Bedroom", color: "#FFF3E0" },
      { x: 300, y: 280, width: 200, height: 200, label: "Bedroom",        color: "#E8F5E9" },
      { x: 500, y: 280, width: 200, height: 200, label: "Bedroom",        color: "#E8F5E9" },
      { x: 380, y: 240, width: 200, height: 180, label: "Kitchen",        color: "#FCE4EC" },
      { x: 60,  y: 480, width: 120, height: 100, label: "Bathroom",       color: "#F3E5F5" },
      { x: 180, y: 480, width: 120, height: 100, label: "Bathroom",       color: "#F3E5F5" },
      { x: 300, y: 480, width: 180, height: 100, label: "Study",          color: "#FBE9E7" },
      { x: 580, y: 60,  width: 200, height: 120, label: "Terrace",        color: "#E8EAF6" },
    ]
  },
  {
    name: "Villa 4BHK", size: "2500 sq.ft",
    description: "Luxury villa with servant quarters & garage",
    plotW: 55, plotD: 60,
    rooms: [
      { x: 60,  y: 60,  width: 380, height: 240, label: "Living Room",      color: "#E3F2FD" },
      { x: 440, y: 60,  width: 260, height: 200, label: "Dining Room",      color: "#E0F2F1" },
      { x: 60,  y: 300, width: 260, height: 220, label: "Master Bedroom",   color: "#FFF3E0" },
      { x: 320, y: 300, width: 220, height: 220, label: "Bedroom",          color: "#E8F5E9" },
      { x: 540, y: 300, width: 220, height: 220, label: "Bedroom",          color: "#E8F5E9" },
      { x: 760, y: 300, width: 200, height: 220, label: "Bedroom",          color: "#E8F5E9" },
      { x: 440, y: 260, width: 240, height: 200, label: "Kitchen",          color: "#FCE4EC" },
      { x: 60,  y: 520, width: 140, height: 120, label: "Bathroom",         color: "#F3E5F5" },
      { x: 200, y: 520, width: 140, height: 120, label: "Bathroom",         color: "#F3E5F5" },
      { x: 340, y: 520, width: 140, height: 120, label: "Bathroom",         color: "#F3E5F5" },
      { x: 480, y: 520, width: 160, height: 120, label: "Study",            color: "#FBE9E7" },
      { x: 700, y: 60,  width: 200, height: 140, label: "Terrace",          color: "#E8EAF6" },
      { x: 700, y: 520, width: 180, height: 120, label: "Servant Quarters", color: "#ECEFF1" },
      { x: 60,  y: 640, width: 220, height: 140, label: "Garage",           color: "#CFD8DC" },
    ]
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const snapV = (v: number) => Math.round(v / SNAP) * SNAP;
const ft = (px: number) => Math.round((px / GRID_SIZE) * 10) / 10;
const uid = () => Math.random().toString(36).slice(2, 9);

function drawElement(ctx: CanvasRenderingContext2D, el: RoomElement, isSelected: boolean, zoom: number) {
  ctx.save();
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);
  const hw = el.width / 2, hh = el.height / 2;

  ctx.fillStyle = el.color;
  ctx.fillRect(-hw, -hh, el.width, el.height);
  ctx.strokeStyle = isSelected ? "#D9A443" : "rgba(0,0,0,0.22)";
  ctx.lineWidth = (isSelected ? 2 : 1) / zoom;
  ctx.strokeRect(-hw, -hh, el.width, el.height);

  switch (el.type) {
    case "sink": case "washbasin": {
      ctx.fillStyle = "#90CAF9";
      ctx.beginPath(); ctx.ellipse(0, 0, hw*0.7, hh*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#555";
      ctx.beginPath(); ctx.arc(0, 0, hw*0.15, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "toilet": {
      ctx.fillStyle = "#E1BEE7"; ctx.fillRect(-hw, -hh, el.width, hh*0.5);
      ctx.fillStyle = "#F3E5F5"; ctx.beginPath(); ctx.ellipse(0, hh*0.2, hw*0.75, hh*0.55, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 1/zoom; ctx.stroke();
      break;
    }
    case "bathtub": {
      ctx.fillStyle = "#BBDEFB"; ctx.fillRect(-hw*0.9, -hh*0.9, el.width*0.9, el.height*0.9);
      ctx.fillStyle = "#90CAF9"; ctx.fillRect(-hw*0.7, -hh*0.7, el.width*0.7, el.height*0.7);
      ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(0, hh*0.55, hw*0.12, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "stove": {
      const r2 = Math.min(hw,hh)*0.22;
      [[-hw*0.4,-hh*0.35],[hw*0.4,-hh*0.35],[-hw*0.4,hh*0.35],[hw*0.4,hh*0.35]].forEach(([bx,by]) => {
        ctx.fillStyle = "#FF8A65"; ctx.beginPath(); ctx.arc(bx,by,r2,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="#BF360C"; ctx.lineWidth=1/zoom; ctx.stroke();
      });
      break;
    }
    case "bed-double": case "bed-single": {
      ctx.fillStyle="#FFCCBC"; ctx.fillRect(-hw*0.9,-hh*0.9,el.width*0.9,hh*0.4);
      ctx.fillStyle="#F8BBD0"; ctx.fillRect(-hw*0.9,-hh*0.5,el.width*0.9,el.height*0.65);
      if (el.type==="bed-double") {
        ctx.strokeStyle="rgba(0,0,0,0.12)"; ctx.lineWidth=1/zoom; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(0,-hh*0.5); ctx.lineTo(0,hh*0.8); ctx.stroke(); ctx.setLineDash([]);
      }
      break;
    }
    case "sofa-3": case "sofa-l": {
      ctx.fillStyle="#9575CD"; ctx.fillRect(-hw*0.9,-hh*0.5,el.width*0.9,el.height*0.85);
      ctx.fillStyle="#B39DDB"; ctx.fillRect(-hw*0.9,hh*0.3,el.width*0.9,hh*0.5);
      ctx.fillStyle="#7E57C2";
      ctx.fillRect(-hw*0.95,-hh*0.5,hw*0.1,hh*1.3);
      ctx.fillRect(hw*0.8,-hh*0.5,hw*0.1,hh*1.3);
      break;
    }
    case "tv-unit": {
      ctx.fillStyle="#263238"; ctx.fillRect(-hw*0.9,-hh*0.9,el.width*0.9,el.height*0.8);
      ctx.fillStyle="#455A64"; ctx.fillRect(-hw*0.85,-hh*0.85,el.width*0.85,el.height*0.6);
      break;
    }
    case "kitchen-counter": {
      ctx.fillStyle="#BCAAA4"; ctx.fillRect(-hw,-hh,el.width,el.height);
      ctx.fillStyle="#D7CCC8"; ctx.fillRect(-hw+3,-hh+3,el.width-6,el.height-6);
      ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.lineWidth=1/zoom;
      for (let i=1;i<3;i++) { ctx.beginPath(); ctx.moveTo(-hw+(el.width*i)/3,-hh+3); ctx.lineTo(-hw+(el.width*i)/3,hh-3); ctx.stroke(); }
      break;
    }
    case "fridge": {
      ctx.fillStyle="#E3F2FD"; ctx.fillRect(-hw*0.9,-hh*0.9,el.width*0.9,el.height*0.9);
      ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.lineWidth=1/zoom;
      ctx.beginPath(); ctx.moveTo(-hw*0.9,0); ctx.lineTo(hw*0.9,0); ctx.stroke();
      ctx.fillStyle="#90CAF9";
      ctx.beginPath(); ctx.arc(hw*0.5,-hh*0.3,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(hw*0.5,hh*0.3,2,0,Math.PI*2); ctx.fill();
      break;
    }
    case "plant-lg": case "plant-sm": {
      ctx.fillStyle="#388E3C"; ctx.beginPath(); ctx.arc(0,0,Math.min(hw,hh)*0.8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1B5E20";
      for (let i=0;i<5;i++) { const a=(i/5)*Math.PI*2; ctx.beginPath(); ctx.arc(Math.cos(a)*hw*0.4,Math.sin(a)*hh*0.4,Math.min(hw,hh)*0.25,0,Math.PI*2); ctx.fill(); }
      break;
    }
    case "dining-4": case "dining-6": {
      ctx.fillStyle="#A1887F"; ctx.fillRect(-hw*0.7,-hh*0.7,el.width*0.7,el.height*0.7);
      // chairs
      const chairs = el.type==="dining-4" ? 4 : 6;
      ctx.fillStyle="#795548";
      for (let i=0;i<chairs;i++) {
        const a=(i/chairs)*Math.PI*2;
        ctx.beginPath(); ctx.arc(Math.cos(a)*hw*0.9,Math.sin(a)*hh*0.9,Math.min(hw,hh)*0.18,0,Math.PI*2); ctx.fill();
      }
      break;
    }
    case "shower": {
      ctx.fillStyle="#B3E5FC"; ctx.fillRect(-hw*0.9,-hh*0.9,el.width*0.9,el.height*0.9);
      ctx.strokeStyle="#0288D1"; ctx.lineWidth=1.5/zoom;
      ctx.beginPath(); ctx.moveTo(-hw*0.9,-hh*0.9); ctx.lineTo(hw*0.9,-hh*0.9); ctx.lineTo(hw*0.9,hh*0.9); ctx.stroke();
      ctx.fillStyle="#0288D1"; ctx.beginPath(); ctx.arc(-hw*0.5,hh*0.5,3,0,Math.PI*2); ctx.fill();
      break;
    }
    default: {
      const def = ELEMENT_DEFS.find(d=>d.type===el.type);
      if (def) {
        ctx.font=`${Math.max(10,Math.min(el.width,el.height)*0.35)}px sans-serif`;
        ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(def.icon,0,0);
      }
    }
  }

  if (isSelected) {
    ctx.fillStyle="#D9A443";
    [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([hx,hy]) => { ctx.beginPath(); ctx.arc(hx,hy,4/zoom,0,Math.PI*2); ctx.fill(); });
  }
  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

const FloorPlannerCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const { saveProject, isSaving } = useProjectActions("floor-planner");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [plan, setPlan] = useState<FloorPlan>({
    rooms: [], walls: [], doors: [], windows: [], elements: [],
    gridSize: GRID_SIZE, scale: GRID_SIZE,
  });
  const [tool, setTool] = useState<Tool>("room");
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [dragging, setDragging] = useState<{ id: string; kind: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string; kind: string; edge: string;
    startX: number; startY: number;
    origW: number; origH: number; origX: number; origY: number;
  } | null>(null);
  const [drawing, setDrawing] = useState<{ x1: number; y1: number } | null>(null);
  const [ghostPos, setGhostPos] = useState<Point | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedElementType, setSelectedElementType] = useState(ELEMENT_DEFS[0].type);
  const [selectedElementCategory, setSelectedElementCategory] = useState("Kitchen");
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeTab, setActiveTab] = useState<"canvas" | "summary" | "presets">("canvas");
  const [plotWidth, setPlotWidth] = useState("40");
  const [plotDepth, setPlotDepth] = useState("50");
  const [zoom, setZoom] = useState(0.7);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);

  // ── Draw ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const pW = Math.min(parseFloat(plotWidth)||40, 80)*GRID_SIZE;
    const pD = Math.min(parseFloat(plotDepth)||50, 80)*GRID_SIZE;
    const pX = (CANVAS_W-pW)/2, pY = (CANVAS_H-pD)/2;
    ctx.strokeStyle="#D9A443"; ctx.lineWidth=2/zoom; ctx.setLineDash([8,4]);
    ctx.strokeRect(pX,pY,pW,pD); ctx.setLineDash([]);
    ctx.fillStyle="rgba(217,164,67,0.04)"; ctx.fillRect(pX,pY,pW,pD);
    ctx.fillStyle="#D9A443"; ctx.font=`bold ${14/zoom}px sans-serif`; ctx.textAlign="center";
    ctx.fillText("N ↑", pX+pW/2, pY-10/zoom);

    if (showGrid) {
      ctx.strokeStyle="rgba(0,0,0,0.06)"; ctx.lineWidth=0.5/zoom;
      for (let x=0;x<=CANVAS_W;x+=GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke(); }
      for (let y=0;y<=CANVAS_H;y+=GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke(); }
    }

    plan.walls.forEach(w => {
      ctx.strokeStyle="#59483B"; ctx.lineWidth=w.thickness/zoom; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(w.x1,w.y1); ctx.lineTo(w.x2,w.y2); ctx.stroke();
    });

    plan.rooms.forEach(room => {
      const isSel = selected?.kind==="room" && selected.item.id===room.id;
      ctx.fillStyle=room.color; ctx.fillRect(room.x,room.y,room.width,room.height);
      ctx.strokeStyle=isSel?"#D9A443":"#8C6A4E"; ctx.lineWidth=(isSel?2.5:1.5)/zoom;
      ctx.strokeRect(room.x,room.y,room.width,room.height);
      ctx.save();
      ctx.font=`${isSel?"bold ":""}${12/zoom}px sans-serif`; ctx.fillStyle="#2D3748"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const lx=room.x+room.width/2, ly=room.y+room.height/2;
      ctx.fillText(room.label, lx, ly-(showDimensions?8/zoom:0));
      if (showDimensions) { ctx.font=`${10/zoom}px sans-serif`; ctx.fillStyle="#718096"; ctx.fillText(`${ft(room.width)}′×${ft(room.height)}′`,lx,ly+8/zoom); }
      ctx.restore();
      if (isSel) {
        [[room.x+room.width,room.y+room.height/2],[room.x+room.width/2,room.y+room.height],[room.x+room.width,room.y+room.height]].forEach(([hx,hy])=>{
          ctx.fillStyle="#D9A443"; ctx.beginPath(); ctx.arc(hx,hy,5/zoom,0,Math.PI*2); ctx.fill();
        });
      }
    });

    plan.elements.forEach(el => {
      const isSel = selected?.kind==="element" && selected.item.id===el.id;
      drawElement(ctx, el, isSel, zoom);
    });

    plan.doors.forEach(door => {
      const isSel = selected?.kind==="door" && selected.item.id===door.id;
      ctx.save();
      ctx.translate(door.x, door.y); ctx.rotate((door.rotation*Math.PI)/180);
      ctx.strokeStyle=isSel?"#D9A443":"#59483B"; ctx.lineWidth=(isSel?3:2)/zoom;
      ctx.strokeRect(0,-3,door.width,6);
      ctx.strokeStyle=isSel?"#D9A443":"#8C6A4E"; ctx.lineWidth=1/zoom;
      ctx.setLineDash([4,3]); ctx.beginPath(); ctx.arc(0,0,door.width,-Math.PI/2,0); ctx.stroke(); ctx.setLineDash([]);
      if (isSel) { ctx.fillStyle="#D9A443"; ctx.beginPath(); ctx.arc(door.width/2,0,5/zoom,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    });

    plan.windows.forEach(win => {
      const isSel = selected?.kind==="window" && selected.item.id===win.id;
      ctx.save();
      ctx.translate(win.x,win.y); ctx.rotate((win.rotation*Math.PI)/180);
      ctx.fillStyle="#B3E5FC"; ctx.fillRect(0,-5,win.width,10);
      ctx.strokeStyle=isSel?"#D9A443":"#0288D1"; ctx.lineWidth=(isSel?2.5:1.5)/zoom;
      ctx.strokeRect(0,-5,win.width,10);
      ctx.strokeStyle="rgba(255,255,255,0.8)"; ctx.lineWidth=1/zoom;
      ctx.beginPath(); ctx.moveTo(win.width/2,-5); ctx.lineTo(win.width/2,5); ctx.stroke();
      if (isSel) { ctx.fillStyle="#D9A443"; [[0,-5],[win.width,-5],[win.width,5],[0,5]].forEach(([hx,hy])=>{ ctx.beginPath(); ctx.arc(hx,hy,4/zoom,0,Math.PI*2); ctx.fill(); }); }
      ctx.restore();
    });

    if (ghostPos && tool==="room") {
      const p = ROOM_PRESETS[selectedPreset];
      ctx.globalAlpha=0.4; ctx.fillStyle=p.color; ctx.fillRect(ghostPos.x,ghostPos.y,p.w*GRID_SIZE,p.h*GRID_SIZE);
      ctx.strokeStyle="#D9A443"; ctx.lineWidth=1.5/zoom; ctx.strokeRect(ghostPos.x,ghostPos.y,p.w*GRID_SIZE,p.h*GRID_SIZE);
      ctx.globalAlpha=1;
    }
    if (ghostPos && tool==="element") {
      const def = ELEMENT_DEFS.find(d=>d.type===selectedElementType);
      if (def) {
        ctx.globalAlpha=0.4; ctx.fillStyle=def.color; ctx.fillRect(ghostPos.x,ghostPos.y,def.w*GRID_SIZE,def.h*GRID_SIZE);
        ctx.strokeStyle="#D9A443"; ctx.lineWidth=1.5/zoom; ctx.strokeRect(ghostPos.x,ghostPos.y,def.w*GRID_SIZE,def.h*GRID_SIZE);
        ctx.globalAlpha=1;
      }
    }
    if (drawing && ghostPos && tool==="wall") {
      ctx.strokeStyle="#59483B"; ctx.lineWidth=6/zoom; ctx.lineCap="round"; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(drawing.x1,drawing.y1); ctx.lineTo(ghostPos.x,ghostPos.y); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }, [plan, selected, showGrid, showDimensions, ghostPos, tool, selectedPreset, selectedElementType, drawing, plotWidth, plotDepth, zoom, panOffset]);

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const screenToCanvas = (sx: number, sy: number): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: snapV(((sx - rect.left) * scaleX - panOffset.x) / zoom),
      y: snapV(((sy - rect.top) * scaleY - panOffset.y) / zoom),
    };
  };

  const screenToCanvasRaw = (sx: number, sy: number): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: ((sx - rect.left) * scaleX - panOffset.x) / zoom,
      y: ((sy - rect.top) * scaleY - panOffset.y) / zoom,
    };
  };

  // ── Hit testing ────────────────────────────────────────────────────────────
  const hitRoom = useCallback((p:Point) => [...plan.rooms].reverse().find(r=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height)??null,[plan.rooms]);
  const hitDoor = useCallback((p:Point) => [...plan.doors].reverse().find(d=>{ const dx=p.x-d.x,dy=p.y-d.y,cos=Math.cos(-d.rotation*Math.PI/180),sin=Math.sin(-d.rotation*Math.PI/180),lx=cos*dx-sin*dy,ly=sin*dx+cos*dy; return lx>=0&&lx<=d.width&&Math.abs(ly)<=12; })??null,[plan.doors]);
  const hitWindow = useCallback((p:Point) => [...plan.windows].reverse().find(w=>{ const dx=p.x-w.x,dy=p.y-w.y,cos=Math.cos(-w.rotation*Math.PI/180),sin=Math.sin(-w.rotation*Math.PI/180),lx=cos*dx-sin*dy,ly=sin*dx+cos*dy; return lx>=0&&lx<=w.width&&Math.abs(ly)<=14; })??null,[plan.windows]);
  const hitElement = useCallback((p:Point) => [...plan.elements].reverse().find(el=>{ const cx=el.x+el.width/2,cy=el.y+el.height/2,dx=p.x-cx,dy=p.y-cy,cos=Math.cos(-el.rotation*Math.PI/180),sin=Math.sin(-el.rotation*Math.PI/180),lx=cos*dx-sin*dy,ly=sin*dx+cos*dy; return Math.abs(lx)<=el.width/2&&Math.abs(ly)<=el.height/2; })??null,[plan.elements]);
  const getResizeEdge = (room:Room, p:Point) => { const tol=12,onE=Math.abs(p.x-(room.x+room.width))<tol,onS=Math.abs(p.y-(room.y+room.height))<tol; return onE&&onS?"SE":onE?"E":onS?"S":null; };

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button===1||(e.button===0&&e.altKey)) { setIsPanning(true); const rect=canvasRef.current!.getBoundingClientRect(); const scaleX=CANVAS_W/rect.width,scaleY=CANVAS_H/rect.height; setPanStart({x:e.clientX*scaleX-panOffset.x,y:e.clientY*scaleY-panOffset.y}); return; }
    const p = screenToCanvas(e.clientX, e.clientY);

    if (tool==="select") {
      const el=hitElement(p); if(el){setSelected({kind:"element",item:el});setDragging({id:el.id,kind:"element",offX:p.x-el.x,offY:p.y-el.y});return;}
      const door=hitDoor(p); if(door){setSelected({kind:"door",item:door});setDragging({id:door.id,kind:"door",offX:p.x-door.x,offY:p.y-door.y});return;}
      const win=hitWindow(p); if(win){setSelected({kind:"window",item:win});setDragging({id:win.id,kind:"window",offX:p.x-win.x,offY:p.y-win.y});return;}
      const room=hitRoom(p);
      if(room){const edge=getResizeEdge(room,p);if(edge)setResizing({id:room.id,kind:"room",edge,startX:p.x,startY:p.y,origW:room.width,origH:room.height,origX:room.x,origY:room.y});else setDragging({id:room.id,kind:"room",offX:p.x-room.x,offY:p.y-room.y});setSelected({kind:"room",item:room});return;}
      setSelected(null); return;
    }
    if (tool==="room") {
      const room=hitRoom(p);
      if(room){const edge=getResizeEdge(room,p);if(edge)setResizing({id:room.id,kind:"room",edge,startX:p.x,startY:p.y,origW:room.width,origH:room.height,origX:room.x,origY:room.y});else setDragging({id:room.id,kind:"room",offX:p.x-room.x,offY:p.y-room.y});setSelected({kind:"room",item:room});return;}
      const preset=ROOM_PRESETS[selectedPreset];
      const nr:Room={id:uid(),x:p.x,y:p.y,width:preset.w*GRID_SIZE,height:preset.h*GRID_SIZE,label:preset.label,color:preset.color};
      setPlan(prev=>({...prev,rooms:[...prev.rooms,nr]}));setSelected({kind:"room",item:nr});return;
    }
    if (tool==="element") {
      const el=hitElement(p);if(el){setSelected({kind:"element",item:el});setDragging({id:el.id,kind:"element",offX:p.x-el.x,offY:p.y-el.y});return;}
      const def=ELEMENT_DEFS.find(d=>d.type===selectedElementType);
      if(def){const ne:RoomElement={id:uid(),type:def.type,x:p.x,y:p.y,width:def.w*GRID_SIZE,height:def.h*GRID_SIZE,rotation:0,color:def.color};setPlan(prev=>({...prev,elements:[...prev.elements,ne]}));setSelected({kind:"element",item:ne});}
      return;
    }
    if (tool==="wall"){setDrawing({x1:p.x,y1:p.y});return;}
    if (tool==="door"){const nd:Door={id:uid(),x:p.x,y:p.y,width:GRID_SIZE*3,rotation:0};setPlan(prev=>({...prev,doors:[...prev.doors,nd]}));setSelected({kind:"door",item:nd});return;}
    if (tool==="window"){const nw:WindowEl={id:uid(),x:p.x,y:p.y,width:GRID_SIZE*4,rotation:0};setPlan(prev=>({...prev,windows:[...prev.windows,nw]}));setSelected({kind:"window",item:nw});return;}
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && panStart) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = CANVAS_W/rect.width, scaleY = CANVAS_H/rect.height;
      setPanOffset({x:e.clientX*scaleX-panStart.x, y:e.clientY*scaleY-panStart.y});
      return;
    }
    const p = screenToCanvas(e.clientX, e.clientY);
    setGhostPos(p);
    if (dragging) {
      if (dragging.kind==="room") setPlan(prev=>({...prev,rooms:prev.rooms.map(r=>r.id===dragging.id?{...r,x:snapV(p.x-dragging.offX),y:snapV(p.y-dragging.offY)}:r)}));
      if (dragging.kind==="door") setPlan(prev=>({...prev,doors:prev.doors.map(d=>d.id===dragging.id?{...d,x:snapV(p.x-dragging.offX),y:snapV(p.y-dragging.offY)}:d)}));
      if (dragging.kind==="window") setPlan(prev=>({...prev,windows:prev.windows.map(w=>w.id===dragging.id?{...w,x:snapV(p.x-dragging.offX),y:snapV(p.y-dragging.offY)}:w)}));
      if (dragging.kind==="element") setPlan(prev=>({...prev,elements:prev.elements.map(el=>el.id===dragging.id?{...el,x:snapV(p.x-dragging.offX),y:snapV(p.y-dragging.offY)}:el)}));
    }
    if (resizing) {
      setPlan(prev=>({...prev,rooms:prev.rooms.map(r=>{
        if(r.id!==resizing.id)return r;
        const dx=p.x-resizing.startX,dy=p.y-resizing.startY;
        let nw=resizing.origW,nh=resizing.origH;
        if(resizing.edge.includes("E"))nw=snapV(Math.max(GRID_SIZE*4,resizing.origW+dx));
        if(resizing.edge.includes("S"))nh=snapV(Math.max(GRID_SIZE*4,resizing.origH+dy));
        return{...r,width:nw,height:nh};
      })}));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if(isPanning){setIsPanning(false);setPanStart(null);return;}
    const p=screenToCanvas(e.clientX,e.clientY);
    if(drawing&&tool==="wall"){
      if(Math.abs(p.x-drawing.x1)>SNAP||Math.abs(p.y-drawing.y1)>SNAP){
        const nw:Wall={id:uid(),x1:drawing.x1,y1:drawing.y1,x2:p.x,y2:p.y,thickness:8};
        setPlan(prev=>({...prev,walls:[...prev.walls,nw]}));
      }
      setDrawing(null);
    }
    setDragging(null);setResizing(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom(z=>Math.min(2,Math.max(0.25,z*(e.deltaY>0?0.9:1.1))));
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const rotateSelected = (deg: number) => {
    if(!selected)return;
    if(selected.kind==="door") setPlan(prev=>({...prev,doors:prev.doors.map(d=>d.id===selected.item.id?{...d,rotation:(d.rotation+deg+360)%360}:d)}));
    if(selected.kind==="window") setPlan(prev=>({...prev,windows:prev.windows.map(w=>w.id===selected.item.id?{...w,rotation:(w.rotation+deg+360)%360}:w)}));
    if(selected.kind==="element") setPlan(prev=>({...prev,elements:prev.elements.map(el=>el.id===selected.item.id?{...el,rotation:(el.rotation+deg+360)%360}:el)}));
  };

  const deleteSelected = () => {
    if(!selected)return;
    if(selected.kind==="room"){if(!window.confirm("Delete this room?"))return; setPlan(prev=>({...prev,rooms:prev.rooms.filter(r=>r.id!==selected.item.id)}));}
    if(selected.kind==="door") setPlan(prev=>({...prev,doors:prev.doors.filter(d=>d.id!==selected.item.id)}));
    if(selected.kind==="window") setPlan(prev=>({...prev,windows:prev.windows.filter(w=>w.id!==selected.item.id)}));
    if(selected.kind==="element") setPlan(prev=>({...prev,elements:prev.elements.filter(el=>el.id!==selected.item.id)}));
    setSelected(null);
  };

  const loadPreset = (preset: PresetPlan) => {
    if(plan.rooms.length>0&&!window.confirm("Replace current plan?"))return;
    setPlan({rooms:preset.rooms.map(r=>({...r,id:uid()})),walls:[],doors:[],windows:[],elements:[],gridSize:GRID_SIZE,scale:GRID_SIZE});
    setPlotWidth(preset.plotW.toString());setPlotDepth(preset.plotD.toString());
    setSelected(null);setActiveTab("canvas");
  };

  const totalSqFt = plan.rooms.reduce((a,r)=>a+ft(r.width)*ft(r.height),0);
  const estimatedCost = plan.rooms.reduce((a,r)=>a+ft(r.width)*ft(r.height)*(COST_PER_SQFT[r.label]??1800),0);

  const selectedLabel = !selected ? null
    : selected.kind==="room" ? (selected.item as Room).label
    : selected.kind==="door" ? "Door"
    : selected.kind==="window" ? "Window"
    : (ELEMENT_DEFS.find(d=>d.type===(selected.item as RoomElement).type)?.label ?? "Element");

  const canRotate = selected && (selected.kind==="door"||selected.kind==="window"||selected.kind==="element");

  const getCursor = () => isPanning?"grabbing":tool==="wall"?"crosshair":(tool==="door"||tool==="window")?"cell":(dragging||resizing)?"grabbing":"default";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-secondary">Floor Planner</h2>
          <p className="text-xs text-gray-500">Design your home layout with cost estimation</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {([["canvas","🗺 Floor Plan"],["summary","📊 Summary"],["presets","📐 Preset Plans"]] as const).map(([t,label])=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab===t?"bg-secondary text-white":"bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRESETS ── */}
      {activeTab==="presets"&&(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_PLANS.map((preset,i)=>(
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-soft p-5 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-2">
                <div><h3 className="font-bold text-secondary">{preset.name}</h3><p className="text-xs text-gray-500">{preset.description}</p></div>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{preset.size}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {preset.rooms.map((r,j)=>(<span key={j} className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600" style={{background:r.color}}>{r.label}</span>))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Plot: {preset.plotW}′×{preset.plotD}′</p>
                <button onClick={()=>loadPreset(preset)} className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-yellow-600 transition-all">Load Plan →</button>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 text-sm font-medium mb-1">Start from scratch</p>
            <p className="text-gray-400 text-xs mb-3">Use the Floor Plan tab to design your own layout</p>
            <button onClick={()=>setActiveTab("canvas")} className="px-4 py-2 bg-secondary text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all">Open Floor Plan</button>
          </div>
        </div>
      )}

      {/* ── CANVAS ── */}
      {activeTab==="canvas"&&(
        <div className="flex gap-3">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0 space-y-2" style={{maxHeight:"calc(100vh - 170px)",overflowY:"auto"}}>

            {/* Plot */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Plot Size</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[["W (ft)",plotWidth,setPlotWidth],["D (ft)",plotDepth,setPlotDepth]].map(([lbl,val,set])=>(
                  <div key={String(lbl)}>
                    <label className="text-xs text-gray-500 mb-1 block">{lbl}</label>
                    <input type="number" value={String(val)} min="10" max="100" onChange={e=>(set as (v:string)=>void)(e.target.value)}
                      className="w-full p-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                  </div>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Zoom {Math.round(zoom*100)}%</p>
              <div className="flex gap-1 mb-1.5">
                <button onClick={()=>setZoom(z=>Math.max(0.25,z-0.1))} className="flex-1 py-1.5 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200">−</button>
                <button onClick={()=>{setZoom(0.7);setPanOffset({x:0,y:0});}} className="flex-1 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Fit</button>
                <button onClick={()=>setZoom(z=>Math.min(2,z+0.1))} className="flex-1 py-1.5 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200">+</button>
              </div>
              <input type="range" min="25" max="200" value={Math.round(zoom*100)} onChange={e=>setZoom(parseInt(e.target.value)/100)} className="w-full accent-primary"/>
            </div>

            {/* Tools */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tools</p>
              <div className="grid grid-cols-2 gap-1">
                {([["room","📦 Room"],["element","🛋 Furnish"],["wall","🧱 Wall"],["door","🚪 Door"],["window","🪟 Window"],["select","↖ Select"]] as const).map(([id,label])=>(
                  <button key={id} onClick={()=>setTool(id)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${tool===id?"bg-primary text-white":"bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Room presets */}
            {tool==="room"&&(
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Room Type</p>
                <div className="space-y-0.5 max-h-52 overflow-y-auto">
                  {ROOM_PRESETS.map((p,i)=>(
                    <button key={i} onClick={()=>setSelectedPreset(i)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${selectedPreset===i?"ring-2 ring-primary bg-primary/5 font-semibold":"hover:bg-gray-50"}`}>
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:p.color,border:"1px solid rgba(0,0,0,0.1)"}}/>
                      <span className="flex-1 truncate">{p.label}</span>
                      <span className="text-gray-400 text-[10px]">{p.w}×{p.h}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Element picker */}
            {tool==="element"&&(
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Furniture & Fittings</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {ELEMENT_CATEGORIES.map(cat=>(
                    <button key={cat} onClick={()=>setSelectedElementCategory(cat)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${selectedElementCategory===cat?"bg-secondary text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {ELEMENT_DEFS.filter(d=>d.category===selectedElementCategory).map(def=>(
                    <button key={def.type} onClick={()=>setSelectedElementType(def.type)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${selectedElementType===def.type?"ring-2 ring-primary bg-primary/5 font-semibold":"hover:bg-gray-50"}`}>
                      <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{background:def.color}}>{def.icon}</span>
                      <span className="flex-1 truncate">{def.label}</span>
                      <span className="text-gray-400 text-[10px]">{def.w}×{def.h}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected panel */}
            {selected&&(
              <div className="bg-white rounded-xl border border-primary/30 shadow-soft p-3">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Selected</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedLabel}</p>
                {selected.kind==="room"&&<p className="text-xs text-gray-500">{ft((selected.item as Room).width)}′ × {ft((selected.item as Room).height)}′</p>}
                {selected.kind==="door"&&<p className="text-xs text-gray-400">Rotation: {(selected.item as Door).rotation}°</p>}
                {canRotate&&(
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">Rotate</p>
                    <div className="grid grid-cols-4 gap-1">
                      {([-90,-45,45,90] as const).map(deg=>(
                        <button key={deg} onClick={()=>rotateSelected(deg)}
                          className="py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold">
                          {deg>0?`+${deg}`:deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={deleteSelected} className="mt-2 w-full py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">🗑 Delete</button>
              </div>
            )}

            {/* Display */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3 space-y-1.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Display</p>
              {[["Grid",showGrid,setShowGrid],["Dimensions",showDimensions,setShowDimensions]].map(([lbl,val,set])=>(
                <label key={String(lbl)} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={Boolean(val)} onChange={e=>(set as (v:boolean)=>void)(e.target.checked)} className="w-3.5 h-3.5 text-primary rounded"/>
                  <span className="text-xs text-gray-600">{String(lbl)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500 flex items-center gap-3">
                  <span>1 grid = 1 ft</span>
                  <span className="text-gray-300">|</span>
                  <span>Alt+drag or scroll to navigate</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={()=>{setZoom(0.7);setPanOffset({x:0,y:0});}} className="text-xs px-2 py-1 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100">Reset View</button>
                  <button onClick={()=>{if(window.confirm("Clear everything?")) {setPlan({rooms:[],walls:[],doors:[],windows:[],elements:[],gridSize:GRID_SIZE,scale:GRID_SIZE});setSelected(null);}}} className="text-xs px-2 py-1 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100">Clear All</button>
                  <button onClick={()=>saveProject({plan,plotWidth,plotDepth,totalSqFt,estimatedCost},estimatedCost)} disabled={isSaving||plan.rooms.length===0} className="text-xs px-3 py-1 bg-primary text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                    {isSaving?"Saving…":"💾 Save"}
                  </button>
                </div>
              </div>
              <div style={{height:"calc(100vh - 240px)",minHeight:520,overflow:"hidden",position:"relative"}}>
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                  style={{cursor:getCursor(),display:"block",width:"100%",height:"100%"}}
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                  onMouseLeave={()=>{setGhostPos(null);if(isPanning){setIsPanning(false);setPanStart(null);}}}
                  onWheel={handleWheel}/>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[["Total Area",`${totalSqFt.toFixed(0)} sq.ft`],["Est. Cost",formatCurrency(estimatedCost)],["Rooms",plan.rooms.length],["Elements",plan.doors.length+plan.windows.length+plan.elements.length]].map(([label,val])=>(
                <div key={String(label)} className="bg-white rounded-xl border border-gray-100 shadow-soft p-2 text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-sm font-bold ${String(label)==="Est. Cost"?"text-primary":"text-secondary"}`}>{String(val)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {activeTab==="summary"&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
            <h3 className="font-bold text-secondary mb-4">Room-wise Summary</h3>
            {plan.rooms.length===0?<p className="text-gray-400 text-sm">No rooms added yet.</p>:(
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase"><th className="px-3 py-2 text-left">Room</th><th className="px-3 py-2 text-right">Size</th><th className="px-3 py-2 text-right">Area</th><th className="px-3 py-2 text-right">Est. Cost</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {plan.rooms.map(r=>{const area=ft(r.width)*ft(r.height),cost=area*(COST_PER_SQFT[r.label]??1800);return(
                      <tr key={r.id}>
                        <td className="px-3 py-2 flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{background:r.color,border:"1px solid rgba(0,0,0,0.1)"}}/>{r.label}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{ft(r.width)}×{ft(r.height)}</td>
                        <td className="px-3 py-2 text-right">{area.toFixed(0)} sq.ft</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(cost)}</td>
                      </tr>
                    );})}
                  </tbody>
                  <tfoot><tr className="bg-gray-50 font-bold"><td className="px-3 py-2" colSpan={2}>Total</td><td className="px-3 py-2 text-right">{totalSqFt.toFixed(0)} sq.ft</td><td className="px-3 py-2 text-right text-primary">{formatCurrency(estimatedCost)}</td></tr></tfoot>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
            <h3 className="font-bold text-secondary mb-4">Plot Summary</h3>
            <div className="space-y-2 text-sm">
              {[["Plot Size",`${plotWidth}′×${plotD}′ = ${(parseInt(plotWidth)||0)*(parseInt(plotDepth)||0)} sq.ft`],["Built-up Area",`${totalSqFt.toFixed(0)} sq.ft`],["Rooms",plan.rooms.length],["Doors/Windows",`${plan.doors.length} / ${plan.windows.length}`],["Furniture & Fittings",plan.elements.length]].map(([k,v])=>(
                <div key={String(k)} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-medium">{String(v)}</span></div>
              ))}
              <hr className="my-2"/>
              <div className="flex justify-between text-base font-bold"><span>Estimated Cost</span><span className="text-primary">{formatCurrency(estimatedCost)}</span></div>
            </div>
            <button onClick={()=>saveProject({plan,plotWidth,plotDepth,totalSqFt,estimatedCost},estimatedCost)} disabled={isSaving||plan.rooms.length===0}
              className="mt-4 w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-all shadow-md">
              {isSaving?"Saving…":"💾 Save Floor Plan"}
            </button>
          </div>
        </div>
      )}

      {activeTab==="canvas"&&(
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-xs text-blue-700 flex flex-wrap gap-x-4 gap-y-1">
          <span><strong>Room:</strong> Click canvas to place → drag to move → corner-drag to resize</span>
          <span><strong>Furnish:</strong> Pick category → click to place → Select tool to move/rotate</span>
          <span><strong>Door/Window:</strong> Click to place → select → rotate with ±45°/90° buttons → delete with 🗑</span>
          <span><strong>Navigate:</strong> Scroll = zoom · Alt+drag = pan · Reset View button to reset</span>
        </div>
      )}
    </div>
  );
};

export default FloorPlannerCalculator;
