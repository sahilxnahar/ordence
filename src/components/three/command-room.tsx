"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import SceneCanvas from "./scene-canvas";

/**
 * Command Room — a living isometric mini-city that IS a dashboard.
 * A scripted event stream drives the scene:
 *   lead arrives   → a building flashes violet
 *   order ships    → a truck drives the road
 *   invoice paid   → the revenue tower grows
 *   ticket solved  → the support building pulses green
 * Hovering any district names the real feature. The whole diorama is
 * procedural (boxes + emissive materials) — no downloaded 3D assets.
 */

interface District {
  name: string;
  feature: string;
  position: [number, number, number];
  size: [number, number, number];
  accent: string;
}

const DISTRICTS: District[] = [
  {
    name: "CRM Quarter",
    feature: "Leads route here in under a second",
    position: [-2.2, 0, -1.4],
    size: [1.4, 1.1, 1.4],
    accent: "#6d45e8",
  },
  {
    name: "Revenue Tower",
    feature: "Invoices, GST-ready, auto-reconciled",
    position: [0.2, 0, -2.0],
    size: [1.0, 2.2, 1.0],
    accent: "#8563ee",
  },
  {
    name: "Warehouse",
    feature: "Multi-location stock, live to every quote",
    position: [2.3, 0, -0.8],
    size: [1.8, 0.8, 1.3],
    accent: "#ff5c5c",
  },
  {
    name: "Support Studio",
    feature: "Omnichannel tickets with SLA timers",
    position: [-2.0, 0, 1.6],
    size: [1.2, 0.9, 1.1],
    accent: "#0e8a5f",
  },
  {
    name: "Dispatch Bay",
    feature: "Pick, pack, ship with live tracking",
    position: [2.2, 0, 1.8],
    size: [1.4, 0.7, 1.2],
    accent: "#b26a00",
  },
] as const;

type EventKind = "lead" | "ship" | "invoice" | "ticket";

const EVENT_SCRIPT: { kind: EventKind; label: string }[] = [
  { kind: "lead", label: "New lead — Ameyaa Heights enquiry" },
  { kind: "invoice", label: "Invoice #1042 paid — ₹1.8L" },
  { kind: "ship", label: "Order #883 dispatched — 2 boxes" },
  { kind: "ticket", label: "Ticket resolved — 12m response" },
  { kind: "lead", label: "New lead — WhatsApp campaign" },
  { kind: "ship", label: "Order #884 dispatched — express" },
  { kind: "invoice", label: "Subscription renewed — Growth plan" },
  { kind: "lead", label: "New lead — website form" },
];

function Building({
  district,
  flash,
  grow,
  onHover,
}: {
  district: District;
  flash: number; // timestamp of last activation
  grow?: number; // extra height for revenue tower
  onHover: (d: District | null) => void;
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [w, h, d] = district.size;
  const height = h + (grow ?? 0);

  useFrame(() => {
    if (!mat.current || !mesh.current) return;
    const since = performance.now() / 1000 - flash;
    const glow = Math.max(0, 1 - since * 1.2);
    mat.current.emissiveIntensity = 0.15 + glow * 1.6;
    // grow animation eases toward target height
    const targetY = height;
    const s = mesh.current.scale;
    s.y += (targetY / h - s.y) * 0.06;
    mesh.current.position.y = (h * s.y) / 2;
  });

  return (
    <mesh
      ref={mesh}
      position={[district.position[0], h / 2, district.position[2]]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(district);
      }}
      onPointerOut={() => onHover(null)}
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        ref={mat}
        color="#1b2434"
        emissive={district.accent}
        emissiveIntensity={0.15}
        roughness={0.6}
        metalness={0.2}
      />
    </mesh>
  );
}

function Truck({ activeSince }: { activeSince: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const since = performance.now() / 1000 - activeSince;
    // 6-second run from dispatch bay off the map, then hide
    const t = since / 6;
    if (t >= 0 && t <= 1) {
      group.current.visible = true;
      group.current.position.set(2.2 - t * 8, 0.16, 1.0 - t * 0.2);
    } else {
      group.current.visible = false;
    }
  });
  return (
    <group ref={group} visible={false}>
      <mesh>
        <boxGeometry args={[0.5, 0.22, 0.26]} />
        <meshStandardMaterial color="#ff5c5c" roughness={0.5} />
      </mesh>
      <mesh position={[0.18, 0.02, 0]}>
        <boxGeometry args={[0.14, 0.18, 0.24]} />
        <meshStandardMaterial color="#f2f4f8" roughness={0.5} />
      </mesh>
    </group>
  );
}

function CityScene({
  flashes,
  towerGrow,
  trucks,
  onHover,
}: {
  flashes: Record<string, number>;
  towerGrow: number;
  trucks: number[];
  onHover: (d: District | null) => void;
}) {
  const rig = useRef<THREE.Group>(null);

  useFrame(({ pointer }) => {
    if (!rig.current) return;
    // gentle parallax
    rig.current.rotation.y +=
      (pointer.x * 0.25 - rig.current.rotation.y) * 0.04;
    rig.current.rotation.x +=
      (-pointer.y * 0.08 - rig.current.rotation.x) * 0.04;
  });

  const roads = useMemo(
    () => [
      { pos: [0, 0.01, 0.9] as const, size: [9, 0.02, 0.5] as const },
      { pos: [-0.6, 0.01, 0] as const, size: [0.5, 0.02, 6] as const },
    ],
    [],
  );

  return (
    <group ref={rig}>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#111827" roughness={0.95} />
      </mesh>
      {/* grid lines */}
      <gridHelper
        args={[10, 24, "#26314a", "#1b2434"]}
        position={[0, 0.001, 0]}
      />
      {/* roads */}
      {roads.map((r, i) => (
        <mesh key={i} position={r.pos as unknown as [number, number, number]}>
          <boxGeometry args={r.size as unknown as [number, number, number]} />
          <meshStandardMaterial color="#26314a" roughness={0.9} />
        </mesh>
      ))}
      {/* districts */}
      {DISTRICTS.map((d) => (
        <Building
          key={d.name}
          district={d}
          flash={flashes[d.name] ?? -100}
          grow={d.name === "Revenue Tower" ? towerGrow : 0}
          onHover={onHover}
        />
      ))}
      {/* trucks */}
      {trucks.map((t, i) => (
        <Truck key={i} activeSince={t} />
      ))}

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1.2} color="#dfe6ff" />
      <pointLight position={[-4, 3, -3]} intensity={1.4} color="#6d45e8" />
      <pointLight position={[4, 2, 3]} intensity={0.8} color="#ff5c5c" />
    </group>
  );
}

export default function CommandRoom({ className }: { className?: string }) {
  const [flashes, setFlashes] = useState<Record<string, number>>({});
  const [towerGrow, setTowerGrow] = useState(0);
  const [trucks, setTrucks] = useState<number[]>([]);
  const [feed, setFeed] = useState<{ label: string; kind: EventKind }[]>([]);
  const [hovered, setHovered] = useState<District | null>(null);
  const step = useRef(0);

  // Scripted demo stream — one event every 2.4s, looping.
  useEffect(() => {
    const id = setInterval(() => {
      const ev = EVENT_SCRIPT[step.current % EVENT_SCRIPT.length];
      step.current += 1;
      const now = performance.now() / 1000;
      setFeed((f) => [{ ...ev }, ...f].slice(0, 5));
      if (ev.kind === "lead") {
        setFlashes((m) => ({ ...m, ["CRM Quarter"]: now }));
      } else if (ev.kind === "invoice") {
        setFlashes((m) => ({ ...m, ["Revenue Tower"]: now }));
        setTowerGrow((g) => Math.min(g + 0.12, 1.4));
      } else if (ev.kind === "ship") {
        setFlashes((m) => ({
          ...m,
          ["Dispatch Bay"]: now,
          ["Warehouse"]: now,
        }));
        setTrucks((t) => [...t.slice(-2), now]);
      } else {
        setFlashes((m) => ({ ...m, ["Support Studio"]: now }));
      }
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const dotColor: Record<EventKind, string> = {
    lead: "#6d45e8",
    ship: "#b26a00",
    invoice: "#8563ee",
    ticket: "#0e8a5f",
  };

  return (
    <div className={className}>
      {/* browser-window frame: “your business, in a tab” */}
      <div className="overflow-hidden rounded-panel border border-border bg-surface shadow-mid">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-4 py-3">
          <span className="size-2.5 rounded-full bg-coral-400" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
          <span className="ml-3 text-xs text-muted-subtle">
            app.ordence.com — Command Room
          </span>
        </div>

        <div className="relative aspect-[16/10] bg-[#0b101b]">
          <SceneCanvas
            frameloop="always"
            camera={{ position: [7.5, 6.5, 8.5], fov: 30 }}
            lookAt={[0, 0.4, 0]}
            fallback={
              <div className="size-full bg-[radial-gradient(50%_60%_at_50%_50%,rgba(109,69,232,0.25),transparent_70%)]" />
            }
          >
            <CityScene
              flashes={flashes}
              towerGrow={towerGrow}
              trucks={trucks}
              onHover={setHovered}
            />
          </SceneCanvas>

          {/* hover tooltip */}
          {hovered && (
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-[#111827]/90 px-4 py-2 text-center backdrop-blur">
              <span className="text-xs font-semibold text-white">
                {hovered.name}
              </span>
              <span className="ml-2 text-xs text-[#a8b2c7]">
                {hovered.feature}
              </span>
            </div>
          )}

          {/* live event feed */}
          <div className="absolute bottom-4 left-4 flex w-64 flex-col gap-1.5">
            {feed.map((e, i) => (
              <div
                key={`${e.label}-${i}`}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/85 px-3 py-1.5 backdrop-blur transition-opacity"
                style={{ opacity: 1 - i * 0.18 }}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: dotColor[e.kind] }}
                />
                <span className="truncate text-xs text-[#dfe4f2]">
                  {e.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs tracking-wide text-muted-subtle">
        Hover the districts — every light is a real feature.
      </p>
    </div>
  );
}
