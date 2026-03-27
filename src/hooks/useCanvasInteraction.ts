// src/hooks/useCanvasInteraction.ts
import { useState, useCallback, useRef } from 'react';

export interface Box { id: string; x: number; y: number; width: number; height: number; }

export const useCanvasInteraction = (
  gridSize: number,
  onUpdate: (id: string, updates: Partial<Box>) => void
) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0 });

  // Snap to grid logic
  const snap = (val: number) => Math.round(val / gridSize) * gridSize;

  const startDragging = useCallback((obj: Box, mouseX: number, mouseY: number) => {
    setDraggingId(obj.id);
    dragStart.current = {
      x: mouseX,
      y: mouseY,
      objX: obj.x,
      objY: obj.y
    };
  }, []);

  const handleDrag = useCallback((mouseX: number, mouseY: number) => {
    if (!draggingId) return;

    const dx = mouseX - dragStart.current.x;
    const dy = mouseY - dragStart.current.y;

    onUpdate(draggingId, {
      x: snap(dragStart.current.objX + dx),
      y: snap(dragStart.current.objY + dy)
    });
  }, [draggingId, onUpdate]);

  const stopDragging = useCallback(() => {
    setDraggingId(null);
  }, []);

  return { draggingId, startDragging, handleDrag, stopDragging };
};