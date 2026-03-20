import React, { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { useProjectActions } from "../../hooks/useProjectActions";
import { formatCurrency } from "../../utils/currency";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tool = "select" | "wall" | "room" | "door" | "window";

interface Point { x: number; y: number; }

interface Wall {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  thickness: number;
}

interface Room {
  id: string;
  x: number; y: number;
  width: number; height: number;
  label: string;
  color: string;
}

interface Door {
  id: string;
  x: number; y: number;
  width: number;
  rotation: number;
  wallId?: string;
}

interface WindowEl {
  id: string;
  x: number; y: number;
  width: number;
  rotation: number;
}

interface FloorPlan {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: WindowEl[];
  gridSize: number;
  scale: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_SIZE = 20;
const CANVAS_W = 900;
const CANVAS_H = 600;
const SNAP = GRID_SIZE;

const ROOM_PRESETS: { label: string; w: number; h: number; color: string }[] = [
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const ft = (px: number) => Math.round((px / GRID_SIZE) * 10) / 10;
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Component ───────────────────────────────────────────────────────────────

const FloorPlannerCalculator: React.FC = () => {
  const { hasPaid } = useUser();
  const { saveProject, isSaving } = useProjectActions("floor-planner");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plan, setPlan] = useState<FloorPlan>({
    rooms: [], walls: [], doors: [], windows: [],
    gridSize: GRID_SIZE, scale: GRID_SIZE,
  });
  const [tool, setTool] = useState<Tool>("room");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string; edge: string;
    startX: number; startY: number;
    origW: number; origH: number;
    origX: number; origY: number;
  } | null>(null);
  const [drawing, setDrawing] = useState<{ x1: number; y1: number } | null>(null);
  const [ghostPos, setGhostPos] = useState<Point | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeTab, setActiveTab] = useState<"canvas" | "summary">("canvas");
  const [plotWidth, setPlotWidth] = useState("30");
  const [plotDepth, setPlotDepth] = useState("40");

  // ── Draw ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Plot outline
    const pW = Math.min(parseFloat(plotWidth) || 30, 60) * GRID_SIZE;
    const pD = Math.min(parseFloat(plotDepth) || 40, 60) * GRID_SIZE;
    const pX = (CANVAS_W - pW) / 2;
    const pY = (CANVAS_H - pD) / 2;
    ctx.strokeStyle = "#D9A443";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(pX, pY, pW, pD);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(217,164,67,0.04)";
    ctx.fillRect(pX, pY, pW, pD);

    // North indicator
    ctx.save();
    ctx.fillStyle = "#D9A443";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N ↑", pX + pW / 2, pY - 8);
    ctx.restore();

    // Grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= CANVAS_W; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_H; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }
    }

    // Walls
    plan.walls.forEach(w => {
      ctx.strokeStyle = "#59483B";
      ctx.lineWidth = w.thickness;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    });

    // Rooms
    plan.rooms.forEach(room => {
      const isSelected = selectedRoom?.id === room.id;

      ctx.fillStyle = room.color;
      ctx.fillRect(room.x, room.y, room.width, room.height);

      ctx.strokeStyle = isSelected ? "#D9A443" : "#8C6A4E";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeRect(room.x, room.y, room.width, room.height);

      // Label
      ctx.save();
      ctx.font = `${isSelected ? "bold " : ""}12px sans-serif`;
      ctx.fillStyle = "#2D3748";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lx = room.x + room.width / 2;
      const ly = room.y + room.height / 2;
      ctx.fillText(room.label, lx, ly - (showDimensions ? 8 : 0));

      if (showDimensions) {
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#718096";
        ctx.fillText(`${ft(room.width)}′ × ${ft(room.height)}′`, lx, ly + 8);
      }
      ctx.restore();

      // Resize handles when selected
      if (isSelected) {
        [
          { x: room.x + room.width,       y: room.y + room.height / 2 },
          { x: room.x + room.width / 2,   y: room.y + room.height     },
          { x: room.x + room.width,       y: room.y + room.height     },
        ].forEach(h => {
          ctx.fillStyle = "#D9A443";
          ctx.beginPath();
          ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });

    // Doors
    plan.doors.forEach(door => {
      ctx.save();
      ctx.translate(door.x, door.y);
      ctx.rotate((door.rotation * Math.PI) / 180);
      ctx.strokeStyle = "#59483B";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -2, door.width, 4);
      ctx.strokeStyle = "#8C6A4E";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, door.width, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Windows
    plan.windows.forEach(win => {
      ctx.save();
      ctx.translate(win.x, win.y);
      ctx.rotate((win.rotation * Math.PI) / 180);
      ctx.fillStyle = "#B3E5FC";
      ctx.fillRect(0, -3, win.width, 6);
      ctx.strokeStyle = "#0288D1";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -3, win.width, 6);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(win.width / 2, -3); ctx.lineTo(win.width / 2, 3);
      ctx.stroke();
      ctx.restore();
    });

    // Ghost room preview
    if (ghostPos && tool === "room") {
      const preset = ROOM_PRESETS[selectedPreset];
      const gw = preset.w * GRID_SIZE;
      const gh = preset.h * GRID_SIZE;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = preset.color;
      ctx.fillRect(ghostPos.x, ghostPos.y, gw, gh);
      ctx.strokeStyle = "#D9A443";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ghostPos.x, ghostPos.y, gw, gh);
      ctx.globalAlpha = 1;
    }

    // Wall drawing preview
    if (drawing && ghostPos && tool === "wall") {
      ctx.strokeStyle = "#59483B";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(drawing.x1, drawing.y1);
      ctx.lineTo(ghostPos.x, ghostPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [plan, selectedRoom, showGrid, showDimensions, ghostPos, tool, selectedPreset, drawing, plotWidth, plotDepth]);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: snap(e.clientX - rect.left),
      y: snap(e.clientY - rect.top),
    };
  };

  const hitRoom = useCallback((p: Point): Room | null => {
    return [...plan.rooms].reverse().find(r =>
      p.x >= r.x && p.x <= r.x + r.width &&
      p.y >= r.y && p.y <= r.y + r.height
    ) ?? null;
  }, [plan.rooms]);

  const getResizeEdge = (room: Room, p: Point): string | null => {
    const tol = 10;
    const onE = Math.abs(p.x - (room.x + room.width)) < tol;
    const onS = Math.abs(p.y - (room.y + room.height)) < tol;
    if (onE && onS) return "SE";
    if (onE) return "E";
    if (onS) return "S";
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPos(e);

    if (tool === "select" || tool === "room") {
      const room = hitRoom(p);
      if (room) {
        const edge = getResizeEdge(room, p);
        if (edge) {
          setResizing({
            id: room.id, edge,
            startX: p.x, startY: p.y,
            origW: room.width, origH: room.height,
            origX: room.x, origY: room.y,
          });
        } else {
          setDragging({ id: room.id, offX: p.x - room.x, offY: p.y - room.y });
        }
        setSelectedRoom(room);
        return;
      }
      if (tool === "room") {
        const preset = ROOM_PRESETS[selectedPreset];
        const newRoom: Room = {
          id: uid(), x: p.x, y: p.y,
          width: preset.w * GRID_SIZE, height: preset.h * GRID_SIZE,
          label: preset.label, color: preset.color,
        };
        setPlan(prev => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
        setSelectedRoom(newRoom);
        return;
      }
      setSelectedRoom(null);
    }

    if (tool === "wall") setDrawing({ x1: p.x, y1: p.y });

    if (tool === "door") {
      const newDoor: Door = { id: uid(), x: p.x, y: p.y, width: GRID_SIZE * 3, rotation: 0 };
      setPlan(prev => ({ ...prev, doors: [...prev.doors, newDoor] }));
    }

    if (tool === "window") {
      const newWin: WindowEl = { id: uid(), x: p.x, y: p.y, width: GRID_SIZE * 4, rotation: 0 };
      setPlan(prev => ({ ...prev, windows: [...prev.windows, newWin] }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPos(e);
    setGhostPos(p);

    if (dragging) {
      setPlan(prev => ({
        ...prev,
        rooms: prev.rooms.map(r =>
          r.id === dragging.id
            ? { ...r, x: snap(p.x - dragging.offX), y: snap(p.y - dragging.offY) }
            : r
        ),
      }));
    }

    if (resizing) {
      setPlan(prev => ({
        ...prev,
        rooms: prev.rooms.map(r => {
          if (r.id !== resizing.id) return r;
          const dx = p.x - resizing.startX;
          const dy = p.y - resizing.startY;
          let newW = resizing.origW, newH = resizing.origH;
          if (resizing.edge.includes("E")) newW = snap(Math.max(GRID_SIZE * 4, resizing.origW + dx));
          if (resizing.edge.includes("S")) newH = snap(Math.max(GRID_SIZE * 4, resizing.origH + dy));
          return { ...r, width: newW, height: newH };
        }),
      }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPos(e);
    if (drawing && tool === "wall") {
      if (Math.abs(p.x - drawing.x1) > SNAP || Math.abs(p.y - drawing.y1) > SNAP) {
        const newWall: Wall = {
          id: uid(), x1: drawing.x1, y1: drawing.y1,
          x2: p.x, y2: p.y, thickness: 8,
        };
        setPlan(prev => ({ ...prev, walls: [...prev.walls, newWall] }));
      }
      setDrawing(null);
    }
    setDragging(null);
    setResizing(null);
  };

  // ── Calculations ──────────────────────────────────────────────────────────

  const totalSqFt = plan.rooms.reduce((acc, r) => acc + ft(r.width) * ft(r.height), 0);
  const estimatedCost = plan.rooms.reduce((acc, r) => {
    return acc + ft(r.width) * ft(r.height) * (COST_PER_SQFT[r.label] ?? 1800);
  }, 0);

  const deleteSelectedRoom = () => {
    if (!selectedRoom) return;
    setPlan(prev => ({ ...prev, rooms: prev.rooms.filter(r => r.id !== selectedRoom.id) }));
    setSelectedRoom(null);
  };

  const clearAll = () => {
    if (window.confirm("Clear the entire floor plan?")) {
      setPlan({ rooms: [], walls: [], doors: [], windows: [], gridSize: GRID_SIZE, scale: GRID_SIZE });
      setSelectedRoom(null);
    }
  };

  const handleSave = () => {
    saveProject({ plan, plotWidth, plotDepth, totalSqFt, estimatedCost }, estimatedCost);
  };

  const getCursor = () => {
    if (tool === "wall") return "crosshair";
    if (tool === "door" || tool === "window") return "cell";
    if (dragging || resizing) return "grabbing";
    return "default";
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Floor Planner</h2>
          <p className="text-sm text-gray-500">Design your home layout with cost estimation</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("canvas")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "canvas" ? "bg-secondary text-white" : "bg-white border border-gray-200 text-gray-600"}`}
          >
            Floor Plan
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "summary" ? "bg-secondary text-white" : "bg-white border border-gray-200 text-gray-600"}`}
          >
            Summary
          </button>
        </div>
      </div>

      {activeTab === "canvas" ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

          {/* ── Left sidebar ── */}
          <div className="xl:col-span-1 space-y-3">

            {/* Plot size */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Plot Size</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Width (ft)</label>
                  <input
                    type="number" value={plotWidth} min="10" max="100"
                    onChange={e => setPlotWidth(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Depth (ft)</label>
                  <input
                    type="number" value={plotDepth} min="10" max="100"
                    onChange={e => setPlotDepth(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Tools */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Drawing Tools</p>
              <div className="grid grid-cols-2 gap-2">
                {(["room", "wall", "door", "window", "select"] as Tool[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                      tool === t ? "bg-primary text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {t === "room"   && "📦 "}
                    {t === "wall"   && "🧱 "}
                    {t === "door"   && "🚪 "}
                    {t === "window" && "🪟 "}
                    {t === "select" && "↖ "}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Room presets */}
            {tool === "room" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Room Type</p>
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {ROOM_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPreset(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                        selectedPreset === i ? "ring-2 ring-primary bg-primary/5 font-semibold" : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ background: preset.color, border: "1px solid rgba(0,0,0,0.1)" }}
                      />
                      <span className="flex-1">{preset.label}</span>
                      <span className="text-gray-400">{preset.w}×{preset.h}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected room panel */}
            {selectedRoom && (
              <div className="bg-white rounded-xl border border-primary/30 shadow-soft p-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Selected Room</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedRoom.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {ft(selectedRoom.width)}′ × {ft(selectedRoom.height)}′ ={" "}
                  {(ft(selectedRoom.width) * ft(selectedRoom.height)).toFixed(0)} sq.ft
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Est. {formatCurrency(
                    ft(selectedRoom.width) * ft(selectedRoom.height) * (COST_PER_SQFT[selectedRoom.label] ?? 1800)
                  )}
                </p>
                <button
                  onClick={deleteSelectedRoom}
                  className="mt-3 w-full py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                >
                  🗑 Delete Room
                </button>
              </div>
            )}

            {/* Display toggles */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Display</p>
              {[
                { label: "Show Grid",       value: showGrid,       set: setShowGrid       },
                { label: "Show Dimensions", value: showDimensions, set: setShowDimensions },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={value}
                    onChange={e => set(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs text-gray-600">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Canvas ── */}
          <div className="xl:col-span-3 space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  1 grid = 1 ft &nbsp;|&nbsp; {ft(CANVAS_W)}′ × {ft(CANVAS_H)}′ canvas
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={clearAll}
                    className="text-xs px-3 py-1 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || plan.rooms.length === 0}
                    className="text-xs px-3 py-1 bg-primary text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? "Saving…" : "💾 Save"}
                  </button>
                </div>
              </div>
              <div className="overflow-auto">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  style={{ cursor: getCursor(), display: "block" }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setGhostPos(null)}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3 text-center">
                <p className="text-xs text-gray-500">Total Area</p>
                <p className="text-lg font-bold text-secondary">
                  {totalSqFt.toFixed(0)} <span className="text-sm font-normal">sq.ft</span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-3 text-center">
                <p className="text-xs text-gray-500">Est. Cost</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(estimatedCost)}</p>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ── Summary tab ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
            <h3 className="font-bold text-secondary mb-4">Room-wise Summary</h3>
            {plan.rooms.length === 0 ? (
              <p className="text-gray-400 text-sm">No rooms added yet. Switch to Floor Plan tab to add rooms.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="px-3 py-2 text-left">Room</th>
                      <th className="px-3 py-2 text-right">Size (ft)</th>
                      <th className="px-3 py-2 text-right">Area</th>
                      <th className="px-3 py-2 text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {plan.rooms.map(r => {
                      const area = ft(r.width) * ft(r.height);
                      const cost = area * (COST_PER_SQFT[r.label] ?? 1800);
                      return (
                        <tr key={r.id}>
                          <td className="px-3 py-2 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-sm"
                              style={{ background: r.color, border: "1px solid rgba(0,0,0,0.1)" }}
                            />
                            {r.label}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500">{ft(r.width)}×{ft(r.height)}</td>
                          <td className="px-3 py-2 text-right">{area.toFixed(0)} sq.ft</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(cost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-3 py-2" colSpan={2}>Total</td>
                      <td className="px-3 py-2 text-right">{totalSqFt.toFixed(0)} sq.ft</td>
                      <td className="px-3 py-2 text-right text-primary">{formatCurrency(estimatedCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
            <h3 className="font-bold text-secondary mb-4">Plot Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Plot Size</span>
                <span className="font-medium">
                  {plotWidth}′ × {plotDepth}′ = {(parseInt(plotWidth) || 0) * (parseInt(plotDepth) || 0)} sq.ft
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Built-up Area</span>
                <span className="font-medium">{totalSqFt.toFixed(0)} sq.ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">No. of Rooms</span>
                <span className="font-medium">{plan.rooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doors</span>
                <span className="font-medium">{plan.doors.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Windows</span>
                <span className="font-medium">{plan.windows.length}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Estimated Cost</span>
                <span className="text-primary">{formatCurrency(estimatedCost)}</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || plan.rooms.length === 0}
              className="mt-4 w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-all shadow-md"
            >
              {isSaving ? "Saving…" : "💾 Save Floor Plan"}
            </button>
          </div>
        </div>
      )}

      {/* Usage hint */}
      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-xs text-blue-700">
        <strong>How to use:</strong> Select a room type → click on canvas to place → drag to move → drag bottom-right corner to resize.
      </div>
    </div>
  );
};

export default FloorPlannerCalculator;
