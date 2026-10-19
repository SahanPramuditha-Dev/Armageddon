import React, { useRef, useEffect, useState } from 'react';
import { ShipState, SensorContact, InFlightProjectile, Vector2D } from '@/types/combat';
import { soundEngine } from '@/services/soundEngine';

interface RadarDisplayProps {
  friendlyShips: ShipState[];
  sensorContacts: SensorContact[];
  projectiles: InFlightProjectile[];
  selectedShipId: string | null;
  selectedTargetId: string | null;
  onSelectShip: (id: string) => void;
  onSelectTarget: (id: string, coords: Vector2D) => void;
  className?: string;
}

export const RadarDisplay: React.FC<RadarDisplayProps> = ({
  friendlyShips,
  sensorContacts,
  projectiles,
  selectedShipId,
  selectedTargetId,
  onSelectShip,
  onSelectTarget,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maxRangeKm, setMaxRangeKm] = useState<number>(100);
  const sweepAngleRef = useRef<number>(0);

  // Center radar on selected ship or origin (0, 0)
  const centerPos = friendlyShips.find((s) => s.id === selectedShipId)?.position || { x: 0, y: 0 };

  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      // Clear with dark tactical navy
      ctx.fillStyle = '#060B14';
      ctx.fillRect(0, 0, width, height);

      // Radar Scope Circular Mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();

      // Background grid rings
      const rings = [0.25, 0.5, 0.75, 1.0];
      ctx.strokeStyle = 'rgba(14, 116, 144, 0.25)';
      ctx.lineWidth = 1;

      rings.forEach((ringPct) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * ringPct, 0, 2 * Math.PI);
        ctx.stroke();

        // Range labels
        ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.font = '9px monospace';
        const kmVal = Math.round(maxRangeKm * ringPct);
        ctx.fillText(`${kmVal}km`, centerX + 4, centerY - radius * ringPct + 11);
      });

      // Crosshair Axes
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Bearing degree ticks
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = centerX + Math.cos(rad) * (radius - 6);
        const y1 = centerY + Math.sin(rad) * (radius - 6);
        const x2 = centerX + Math.cos(rad) * radius;
        const y2 = centerY + Math.sin(rad) * radius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Sweeping Beam
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (2 * Math.PI);
      const sweepAngle = sweepAngleRef.current;

      const sweepGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
      sweepGradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.25, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Leading bright line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Helper function: convert world km coordinates to radar canvas pixels
      const worldToCanvas = (wx: number, wy: number) => {
        const relX = wx - centerPos.x;
        const relY = wy - centerPos.y;
        const scale = radius / maxRangeKm;
        return {
          cx: centerX + relX * scale,
          cy: centerY - relY * scale, // Map north is up (-y in canvas)
        };
      };

      // Extraction boundary line (y = -25.0 km)
      const boundaryY_world = -25.0;
      const boundaryCanvas = worldToCanvas(centerPos.x, boundaryY_world);
      if (boundaryCanvas.cy >= centerY - radius && boundaryCanvas.cy <= centerY + radius) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX - radius, boundaryCanvas.cy);
        ctx.lineTo(centerX + radius, boundaryCanvas.cy);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.font = '8px monospace';
        ctx.fillText('--- EXTRACTION BOUNDARY (Y <= -25km) ---', centerX - radius + 14, boundaryCanvas.cy - 4);
        ctx.restore();
      }

      // 1. Draw In-Flight Projectiles
      projectiles.forEach((p) => {
        const { cx, cy } = worldToCanvas(p.current_position.x, p.current_position.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
        ctx.fillStyle = p.attacker_faction === 'THE_HARVESTERS' ? '#FF3B30' : '#00E5FF';
        ctx.fill();

        // Projectile trajectory line
        const originCanvas = worldToCanvas(p.origin.x, p.origin.y);
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(originCanvas.cx, originCanvas.cy);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = p.attacker_faction === 'THE_HARVESTERS' ? 'rgba(255, 59, 48, 0.4)' : 'rgba(0, 229, 255, 0.4)';
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Draw Sensor Contacts (Enemies & Unidentified)
      sensorContacts.forEach((contact) => {
        const { cx, cy } = worldToCanvas(
          contact.estimated_position.x,
          contact.estimated_position.y
        );

        const isTarget = selectedTargetId === contact.id;
        const errPx = (contact.confidence_radius / maxRangeKm) * radius;
        const classification = contact.classification || 'UNKNOWN';

        ctx.save();

        if (classification === 'CONFIRMED_HOSTILE') {
          // Solid Red Threat
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(8, errPx), 0, 2 * Math.PI);
          ctx.fillStyle = isTarget ? 'rgba(255, 59, 48, 0.25)' : 'rgba(255, 59, 48, 0.12)';
          ctx.fill();
          ctx.strokeStyle = '#FF3B30';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 2]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Reticle diamond
          ctx.beginPath();
          ctx.moveTo(cx, cy - 5);
          ctx.lineTo(cx + 5, cy);
          ctx.lineTo(cx, cy + 5);
          ctx.lineTo(cx - 5, cy);
          ctx.closePath();
          ctx.fillStyle = '#FF3B30';
          ctx.fill();

          // Target lock halo
          if (isTarget) {
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
            ctx.strokeStyle = '#FF3B30';
            ctx.lineWidth = 1.8;
            ctx.stroke();
            // Reticle tick marks
            ctx.beginPath();
            ctx.moveTo(cx - 18, cy); ctx.lineTo(cx - 11, cy);
            ctx.moveTo(cx + 11, cy); ctx.lineTo(cx + 18, cy);
            ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy - 11);
            ctx.moveTo(cx, cy + 11); ctx.lineTo(cx, cy + 18);
            ctx.stroke();
          }

          // Label
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#FF3B30';
          const label = contact.apparent_type ? `HOSTILE ${contact.apparent_type}` : 'CONFIRMED HOSTILE';
          ctx.fillText(`${label}`, cx + 9, cy + 3);

        } else if (classification === 'SUSPECTED_HOSTILE') {
          // Amber Warning Track
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(10, errPx), 0, 2 * Math.PI);
          ctx.fillStyle = isTarget ? 'rgba(255, 179, 0, 0.25)' : 'rgba(255, 179, 0, 0.08)';
          ctx.fill();
          ctx.strokeStyle = '#FFB300';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Amber triangle
          ctx.beginPath();
          ctx.moveTo(cx, cy - 5);
          ctx.lineTo(cx + 5, cy + 4);
          ctx.lineTo(cx - 5, cy + 4);
          ctx.closePath();
          ctx.fillStyle = '#FFB300';
          ctx.fill();

          if (isTarget) {
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
            ctx.strokeStyle = '#FFB300';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Label with confidence percentage
          ctx.font = '9px monospace';
          ctx.fillStyle = '#FFB300';
          const label = contact.apparent_type ? `SUSPECTED ${contact.apparent_type}` : 'SUSPECTED HOSTILE';
          ctx.fillText(`${label} [${Math.round(contact.confidence_level * 100)}%]`, cx + 8, cy + 3);

        } else if (classification === 'LOST_CONTACT') {
          // Faded Ghost Blip
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(12, errPx * 1.5), 0, 2 * Math.PI);
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ghost cross
          ctx.beginPath();
          ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx + 4, cy + 4);
          ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy + 4);
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Last known heading trail
          if (contact.last_known_heading !== undefined) {
            const headingRad = (contact.last_known_heading - 90) * (Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(headingRad) * 16, cy + Math.sin(headingRad) * 16);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.stroke();
          }

          ctx.font = '8px monospace';
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(`[LOST CONTACT]`, cx + 8, cy + 3);

        } else if (classification === 'DECOY') {
          // Hollow Decoy marker
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(6, errPx), 0, 2 * Math.PI);
          ctx.strokeStyle = '#EAB308';
          ctx.lineWidth = 1;
          ctx.setLineDash([1, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.strokeRect(cx - 3, cy - 3, 6, 6);
          ctx.strokeStyle = '#EAB308';
          ctx.stroke();

          ctx.font = '8px monospace';
          ctx.fillStyle = '#EAB308';
          ctx.fillText(`[DECOY/JAMMING]`, cx + 8, cy + 3);

        } else {
          // Default UNKNOWN Track
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(8, errPx), 0, 2 * Math.PI);
          ctx.fillStyle = isTarget ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 229, 255, 0.05)';
          ctx.fill();
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Question mark / dot
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#00E5FF';
          ctx.fill();

          ctx.font = '9px monospace';
          ctx.fillStyle = '#38BDF8';
          ctx.fillText(`? UNKNOWN [${Math.round(contact.confidence_level * 100)}%]`, cx + 8, cy + 3);
        }

        ctx.restore();
      });

      // 3. Draw Friendly Ships
      friendlyShips.forEach((ship) => {
        const { cx, cy } = worldToCanvas(ship.position.x, ship.position.y);
        const isSelected = selectedShipId === ship.id;
        const isDisabled = ship.damage_state === 'DISABLED';
        const isRetreating = ship.is_retreating;
        const isRescued = ship.is_rescued;

        // Ship Heading Arrow
        const headingRad = (ship.heading - 90) * (Math.PI / 180);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(headingRad);

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();

        if (isDisabled) {
          ctx.fillStyle = '#F97316';
        } else if (isRetreating) {
          ctx.fillStyle = '#38BDF8';
        } else if (isSelected) {
          ctx.fillStyle = '#00E5FF';
        } else {
          ctx.fillStyle = '#0284C7';
        }
        ctx.fill();
        ctx.strokeStyle = '#082F49';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Selected halo
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(cx, cy, 13, 0, 2 * Math.PI);
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Disabled pulsating distress beacon
        if (isDisabled) {
          ctx.beginPath();
          ctx.arc(cx, cy, 16, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label
        ctx.font = '9px monospace';
        if (isDisabled) {
          ctx.fillStyle = '#F97316';
          ctx.fillText(`${ship.name.split(' ')[0]} [DISABLED]`, cx + 10, cy + 3);
        } else if (isRescued) {
          ctx.fillStyle = '#10B981';
          ctx.fillText(`${ship.name.split(' ')[0]} [RESCUED]`, cx + 10, cy + 3);
        } else if (isRetreating) {
          ctx.fillStyle = '#38BDF8';
          ctx.fillText(`${ship.name.split(' ')[0]} [RETREATING]`, cx + 10, cy + 3);
        } else {
          ctx.fillStyle = '#00E5FF';
          ctx.fillText(ship.name.split(' ')[0], cx + 10, cy + 3);
        }
      });

      ctx.restore(); // Restore mask

      // Outer bezel ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [friendlyShips, sensorContacts, projectiles, selectedShipId, selectedTargetId, maxRangeKm, centerPos]);

  // Handle click on canvas to select contact or ship
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    // Convert click to world coords
    const relPixelX = clickX - centerX;
    const relPixelY = centerY - clickY;
    const scale = radius / maxRangeKm;

    const worldX = centerPos.x + relPixelX / scale;
    const worldY = centerPos.y + relPixelY / scale;

    // Check if clicked near sensor contact
    const clickedContact = sensorContacts.find((c) => {
      const dist = Math.hypot(c.estimated_position.x - worldX, c.estimated_position.y - worldY);
      return dist <= 8.0;
    });

    if (clickedContact) {
      soundEngine.playUIClick();
      onSelectTarget(clickedContact.id, clickedContact.estimated_position);
      return;
    }

    // Check if clicked near friendly ship
    const clickedShip = friendlyShips.find((s) => {
      const dist = Math.hypot(s.position.x - worldX, s.position.y - worldY);
      return dist <= 6.0;
    });

    if (clickedShip) {
      soundEngine.playUIClick();
      onSelectShip(clickedShip.id);
      return;
    }

    // Otherwise, select coordinate point
    onSelectTarget('coord_target', { x: Math.round(worldX * 10) / 10, y: Math.round(worldY * 10) / 10 });
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        onClick={handleCanvasClick}
        className="cursor-crosshair rounded-full border border-white/[0.12] shadow-[0_0_24px_rgba(10,132,255,0.15)] bg-[#070D18]"
      />

      {/* Range controls */}
      <div className="flex items-center gap-3 mt-3 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
        <button
          onClick={() => setMaxRangeKm(Math.max(30, maxRangeKm - 25))}
          className="px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
        >
          - Zoom
        </button>
        <span className="text-[10px] font-mono-tech text-sky-400 font-bold px-1.5">
          {maxRangeKm}km
        </span>
        <button
          onClick={() => setMaxRangeKm(Math.min(150, maxRangeKm + 25))}
          className="px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
        >
          + Zoom
        </button>
      </div>
    </div>
  );
};
