"use client";

import { useCallback, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 0.35;
const PAN_THRESHOLD_PX = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function getTouchCenter(touches: TouchList, rect: DOMRect) {
  const x = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
  const y = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;
  return { x, y };
}

function clampTranslate(
  x: number,
  y: number,
  scale: number,
  width: number,
  height: number
) {
  if (scale <= 1) return { x: 0, y: 0 };
  const maxX = (width * (scale - 1)) / 2;
  const maxY = (height * (scale - 1)) / 2;
  return {
    x: clamp(x, -maxX, maxX),
    y: clamp(y, -maxY, maxY),
  };
}

export function useCampusMapZoom() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const scaleRef = useRef(scale);
  const translateRef = useRef(translate);
  scaleRef.current = scale;
  translateRef.current = translate;

  const panRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const pinchRef = useRef({
    active: false,
    startDistance: 0,
    startScale: 1,
    startTranslate: { x: 0, y: 0 },
    focal: { x: 0, y: 0 },
  });

  const applyTransform = useCallback((nextScale: number, focalX: number, focalY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const prevScale = scaleRef.current;
    const prevTranslate = translateRef.current;

    const ratio = clampedScale / prevScale;
    const nextX = focalX - (focalX - prevTranslate.x) * ratio;
    const nextY = focalY - (focalY - prevTranslate.y) * ratio;

    const clamped = clampTranslate(
      nextX,
      nextY,
      clampedScale,
      rect.width,
      rect.height
    );

    setScale(clampedScale);
    setTranslate(clamped);
  }, []);

  const zoomIn = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    applyTransform(scaleRef.current + ZOOM_STEP, rect.width / 2, rect.height / 2);
  }, [applyTransform]);

  const zoomOut = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    applyTransform(scaleRef.current - ZOOM_STEP, rect.width / 2, rect.height / 2);
  }, [applyTransform]);

  const resetZoom = useCallback(() => {
    setScale(MIN_SCALE);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const focalX = event.clientX - rect.left;
      const focalY = event.clientY - rect.top;
      const delta = event.deltaY > 0 ? -0.15 : 0.15;
      applyTransform(scaleRef.current + delta, focalX, focalY);
    },
    [applyTransform]
  );

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (scaleRef.current <= 1) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    panRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: translateRef.current.x,
      originY: translateRef.current.y,
      moved: false,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan.active || event.pointerId !== pan.pointerId) return;

    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;

    if (!pan.moved && Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return;
    pan.moved = true;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const clamped = clampTranslate(
      pan.originX + dx,
      pan.originY + dy,
      scaleRef.current,
      rect.width,
      rect.height
    );
    setTranslate(clamped);
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan.active || event.pointerId !== pan.pointerId) return;

    pan.active = false;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    pinchRef.current = {
      active: true,
      startDistance: getTouchDistance(event.touches),
      startScale: scaleRef.current,
      startTranslate: { ...translateRef.current },
      focal: getTouchCenter(event.touches, rect),
    };
  }, []);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const pinch = pinchRef.current;
      if (!pinch.active || event.touches.length !== 2) return;

      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      if (pinch.startDistance <= 0) return;

      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const focal = getTouchCenter(event.touches, rect);
      const nextScale = pinch.startScale * (distance / pinch.startDistance);
      applyTransform(nextScale, focal.x, focal.y);
    },
    [applyTransform]
  );

  const handleTouchEnd = useCallback(() => {
    pinchRef.current.active = false;
  }, []);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    if (scaleRef.current > MIN_SCALE) {
      resetZoom();
    } else {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      applyTransform(1.75, rect.width / 2, rect.height / 2);
    }
  }, [applyTransform, resetZoom]);

  return {
    viewportRef,
    scale,
    translate,
    isPanning,
    canPan: scale > 1,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}
