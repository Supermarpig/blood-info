"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NearbyLocation, UserLocation } from "@/hooks/useNearbyLocations";

/* ── fix Leaflet default icon path broken by webpack ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;
    background:#3b82f6;border:3px solid white;border-radius:50%;
    box-shadow:0 0 0 5px rgba(59,130,246,0.22),0 2px 8px rgba(59,130,246,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function donationIcon(rank: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;
      background:#e11d2a;border:2.5px solid white;border-radius:50%;
      box-shadow:0 2px 10px rgba(225,29,42,0.45);
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:13px;font-weight:700;font-family:system-ui,sans-serif;
    ">${rank}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function fmt(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/* ── auto-fit to show all pins ── */
function BoundsUpdater({ user, locations }: { user: UserLocation; locations: NearbyLocation[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const withCoords = locations.filter((l) => l.event.coordinates);
    if (withCoords.length === 0) return; // wait until data arrives
    const pts: L.LatLngExpression[] = [
      [user.lat, user.lng],
      ...withCoords.map((l) => [l.event.coordinates!.lat, l.event.coordinates!.lng] as L.LatLngExpression),
    ];
    map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 14 });
    fitted.current = true;
  }, [map, user, locations]);

  return null;
}

/* ── animated SVG overlay (lives inside MapContainer so useMap works) ── */
interface PathItem {
  id: string;
  d: string;
  delay: string;
  dur: string;
}

function AnimatedLines({ user, locations }: { user: UserLocation; locations: NearbyLocation[] }) {
  const map = useMap();
  const [frame, setFrame] = useState<{ w: number; h: number; paths: PathItem[] } | null>(null);

  const recompute = useCallback(() => {
    const size = map.getSize();
    const toXY = (lat: number, lng: number) => map.latLngToContainerPoint([lat, lng]);
    const c = toXY(user.lat, user.lng);

    const paths: PathItem[] = locations
      .filter((l) => l.event.coordinates)
      .slice(0, 5)
      .filter((l) => {
        // only draw lines to pins currently visible in the viewport
        const p = toXY(l.event.coordinates!.lat, l.event.coordinates!.lng);
        return p.x >= 0 && p.x <= size.x && p.y >= 0 && p.y <= size.y;
      })
      .map((l, i) => {
        const p = toXY(l.event.coordinates!.lat, l.event.coordinates!.lng);
        const mx = (c.x + p.x) / 2;
        const my = (c.y + p.y) / 2 - 50;
        return {
          id: `al-${i}`,
          d: `M ${c.x.toFixed(1)} ${c.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          delay: `${(i * 0.42).toFixed(2)}s`,
          dur: `${(2.0 + i * 0.35).toFixed(1)}s`,
        };
      });

    setFrame({ w: size.x, h: size.y, paths });
  }, [map, user, locations]);

  useEffect(() => {
    recompute();
    map.on("move zoom resize moveend zoomend", recompute);
    return () => { map.off("move zoom resize moveend zoomend", recompute); };
  }, [map, recompute]);

  if (!frame) return null;

  /* render into map container so it sits above tiles but below UI controls */
  return createPortal(
    <svg
      viewBox={`0 0 ${frame.w} ${frame.h}`}
      style={{
        position: "absolute",
        inset: 0,
        width: frame.w,
        height: frame.h,
        pointerEvents: "none",
        zIndex: 450,
      }}
    >
      <defs>
        {frame.paths.map((p) => (
          <filter key={`f-${p.id}`} id={`gf-${p.id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {frame.paths.map((p) => (
        <g key={p.id}>
          {/* glow halo */}
          <path d={p.d} fill="none" stroke="#e11d2a" strokeWidth="10" strokeOpacity="0.12" filter={`url(#gf-${p.id})`} />
          {/* dashed arc */}
          <path
            id={p.id}
            d={p.d}
            fill="none"
            stroke="#e11d2a"
            strokeWidth="2"
            strokeDasharray="6 10"
            strokeOpacity="0.5"
            strokeLinecap="round"
            style={{
              animation: "nearbyDashFlow 1.8s linear infinite",
              animationDelay: p.delay,
            }}
          />
        </g>
      ))}
    </svg>,
    map.getContainer()
  );
}

interface Props {
  user: UserLocation;
  locations: NearbyLocation[];
}

export default function LeafletMap({ user, locations }: Props) {
  return (
    <MapContainer
      center={[user.lat, user.lng]}
      zoom={15}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <BoundsUpdater user={user} locations={locations} />
      <AnimatedLines user={user} locations={locations} />

      {/* user pin */}
      <Marker position={[user.lat, user.lng]} icon={userIcon}>
        <Popup closeButton={false} offset={[0, -4]}>
          <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "system-ui" }}>你在這</span>
        </Popup>
      </Marker>

      {/* donation pins */}
      {locations.map((loc, i) => {
        const c = loc.event.coordinates;
        if (!c) return null;
        return (
          <Marker key={i} position={[c.lat, c.lng]} icon={donationIcon(i + 1)}>
            <Popup closeButton={false} offset={[0, -14]}>
              <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 150 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                  {loc.event.organization}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
                  {loc.event.location}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#888" }}>{loc.event.time}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e11d2a" }}>
                    {fmt(loc.distance)}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
