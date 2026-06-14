import { useState, useEffect, useRef, useMemo } from "react";
import L from "leaflet";

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const EARTH_R = 6371;

const geo = (a, b) => {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  const y = b.lat - a.lat;
  return Math.sqrt(x * x + y * y) * (Math.PI / 180) * EARTH_R;
};

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Prim's algorithm to compute MST
function computeMST(pts) {
  const n = pts.length;
  if (n === 0) return { weight: 0, degrees: [] };
  const inMST = new Array(n).fill(false);
  const minEdge = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  minEdge[0] = 0;
  let totalWeight = 0;
  const degrees = new Array(n).fill(0);

  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inMST[i] && (u === -1 || minEdge[i] < minEdge[u])) {
        u = i;
      }
    }
    if (u === -1 || minEdge[u] === Infinity) break;
    inMST[u] = true;
    totalWeight += minEdge[u];
    
    if (parent[u] !== -1) {
      degrees[u]++;
      degrees[parent[u]]++;
    }

    for (let v = 0; v < n; v++) {
      if (!inMST[v]) {
        const dist = geo(pts[u], pts[v]);
        if (dist < minEdge[v]) {
          minEdge[v] = dist;
          parent[v] = u;
        }
      }
    }
  }
  return { weight: totalWeight, degrees };
}

// Predict alpha using aspect ratio and leaf ratio
function estimateGart(pts, mst) {
  const n = pts.length;
  if (n < 3) return { length: mst.weight, alpha: 1.0 };
  
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (let i = 0; i < n; i++) {
    if (pts[i].lat < minLat) minLat = pts[i].lat;
    if (pts[i].lat > maxLat) maxLat = pts[i].lat;
    if (pts[i].lng < minLng) minLng = pts[i].lng;
    if (pts[i].lng > maxLng) maxLng = pts[i].lng;
  }
  const dLat = maxLat - minLat;
  const dLng = maxLng - minLng;
  const aspect = dLat > dLng ? dLat / (dLng || 1e-6) : dLng / (dLat || 1e-6);

  let leafCount = 0;
  for (let i = 0; i < n; i++) {
    if (mst.degrees[i] === 1) leafCount++;
  }
  const leafRatio = leafCount / n;

  // Simplified linear regression model from GART 1.0 data
  let alpha = 1.15 + 0.04 * Math.log(aspect + 1) + 0.06 * leafRatio - 0.002 * n;
  alpha = Math.max(1.08, Math.min(1.36, alpha));
  
  return { length: alpha * mst.weight, alpha };
}

const MERCHANTS_CATALOG = [
  { name: "Whole Foods", category: "grocery", card: "Amex Gold", reward: "4x points" },
  { name: "Trader Joe's", category: "grocery", card: "Amex Gold", reward: "4x points" },
  { name: "Starbucks", category: "dining", card: "Chase Sapphire Preferred", reward: "3x points" },
  { name: "Chipotle", category: "dining", card: "Chase Sapphire Preferred", reward: "3x points" },
  { name: "Chevron", category: "gas", card: "Blue Cash Preferred", reward: "3% cashback" },
  { name: "Shell Gas", category: "gas", card: "Blue Cash Preferred", reward: "3% cashback" },
  { name: "CVS Pharmacy", category: "drugstore", card: "Chase Freedom Unlimited", reward: "3% cashback" },
  { name: "Costco Wholesale", category: "wholesale_club", card: "Citi Double Cash", reward: "2% cashback" },
  { name: "Target", category: "everything_else", card: "Wells Fargo Active Cash", reward: "2% cashback" },
  { name: "Netflix Sub", category: "streaming", card: "Blue Cash Preferred", reward: "6% cashback" }
];

// A small grid-ish street network over Redlands, CA (OSM-style snippet).
function buildNetwork() {
  const cLat = 34.0558, cLng = -117.1835;
  const rows = 7, cols = 8, dLat = 0.0026, dLng = 0.0030;
  const idx = (r, c) => r * cols + c;
  const nodes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({
        lat: cLat + (r - (rows - 1) / 2) * dLat + (Math.random() - 0.5) * dLat * 0.3,
        lng: cLng + (c - (cols - 1) / 2) * dLng + (Math.random() - 0.5) * dLng * 0.3,
        merchant: MERCHANTS_CATALOG[(r * cols + c) % MERCHANTS_CATALOG.length]
      });
    }
  }
  const edges = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1 && Math.random() > 0.12) edges.push([idx(r, c), idx(r, c + 1)]);
      if (r < rows - 1 && Math.random() > 0.12) edges.push([idx(r, c), idx(r + 1, c)]);
    }
  }
  for (let d = 0; d < Math.min(rows, cols) - 1; d++) edges.push([idx(d, d), idx(d + 1, d + 1)]);
  return { nodes, edges };
}

const tourLen = (pts, order) => {
  let s = 0;
  for (let i = 0; i < order.length; i++) s += geo(pts[order[i]], pts[order[(i + 1) % order.length]]);
  return s;
};

function twoOptSnapshots(pts) {
  const n = pts.length;
  let order = shuffle([...Array(n).keys()]);
  const snaps = [order.slice()];
  let improved = true, guard = 0;
  while (improved && guard++ < 300) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const cand = order.slice(0, i).concat(order.slice(i, k + 1).reverse(), order.slice(k + 1));
        if (tourLen(pts, cand) + 1e-9 < tourLen(pts, order)) {
          order = cand; snaps.push(order.slice()); improved = true;
        }
      }
    }
  }
  return snaps;
}

export default function RouteOptimizer() {
  const mountRef = useRef(null);
  const mapRef = useRef(null);
  const lineRef = useRef(null);
  const markersRef = useRef([]);
  const [hud, setHud] = useState({ 
    nodes: 0, size: 0, len: 0, saved: 0, inst: 1, done: false,
    mstLen: 0, gartLen: 0, gartErr: 0
  });
  const net = useMemo(() => buildNetwork(), []);

  useEffect(() => {
    if (!mountRef.current || mapRef.current) return;
    const map = L.map(mountRef.current, {
      zoomControl: false, attributionControl: true, dragging: true,
      scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false,
      keyboard: false, touchZoom: true, tap: true,
    });
    L.tileLayer(ESRI_IMAGERY, {
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics", maxZoom: 19,
    }).addTo(map);
    map.fitBounds(L.latLngBounds(net.nodes.map((n) => [n.lat, n.lng])), { padding: [22, 22] });

    // faint street network ("OSM snippet")
    net.edges.forEach(([a, b]) =>
      L.polyline([[net.nodes[a].lat, net.nodes[a].lng], [net.nodes[b].lat, net.nodes[b].lng]], {
        color: "#4DA3FF", weight: 1, opacity: 0.16, interactive: false,
      }).addTo(map)
    );
    mapRef.current = map;
    setHud((h) => ({ ...h, nodes: net.nodes.length }));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer, cancelled = false, inst = 1;

    const clearTsp = () => {
      if (lineRef.current) { map.removeLayer(lineRef.current); lineRef.current = null; }
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
    };
    const drawTour = (pts, order, done) => {
      const latlngs = order.map((i) => [pts[i].lat, pts[i].lng]);
      latlngs.push(latlngs[0]);
      const color = done ? "#FF9D3D" : "#4DA3FF";
      if (lineRef.current) { lineRef.current.setLatLngs(latlngs); lineRef.current.setStyle({ color }); }
      else lineRef.current = L.polyline(latlngs, { color, weight: 2.6, opacity: 0.95, interactive: false }).addTo(map);
    };
    const drawMarkers = (pts) => {
      pts.forEach((p, i) => {
        const m = L.circleMarker([p.lat, p.lng], {
          radius: i === 0 ? 5.5 : 4, color: i === 0 ? "#FF9D3D" : "#E7ECF6",
          weight: 2, fillColor: "#0A0E16", fillOpacity: 1, interactive: true,
        }).addTo(map);
        
        const popupContent = `
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #E7ECF6; padding: 4px 6px;">
            <div style="font-weight: 600; color: #FF9D3D; margin-bottom: 2px;">${p.merchant.name}</div>
            <div style="color: #8595B2; font-size: 9px; text-transform: uppercase; margin-bottom: 6px;">Category: ${p.merchant.category.replace('_', ' ')}</div>
            <div style="border-top: 1px solid #1C2638; padding-top: 4px;">
              <span style="color: #4DA3FF; font-size: 9px;">CardWizard Suggests:</span><br/>
              <strong>${p.merchant.card}</strong><br/>
              <span style="color: #FF9D3D; font-size: 10px;">${p.merchant.reward}</span>
            </div>
          </div>
        `;
        
        m.bindPopup(popupContent, {
          closeButton: false,
          minWidth: 150,
          className: "fd-map-popup"
        });

        markersRef.current.push(m);
      });
    };

    const runInstance = () => {
      if (cancelled) return;
      const size = 7 + Math.floor(Math.random() * 5);
      const pts = shuffle([...Array(net.nodes.length).keys()]).slice(0, size).map((i) => net.nodes[i]);
      const snaps = twoOptSnapshots(pts);
      const initLen = tourLen(pts, snaps[0]);
      
      const mst = computeMST(pts);
      const gart = estimateGart(pts, mst);

      clearTsp();
      drawMarkers(pts);

      if (reduce) {
        const last = snaps[snaps.length - 1];
        drawTour(pts, last, true);
        const finalLen = tourLen(pts, last);
        const gartErr = ((gart.length - finalLen) / finalLen) * 100;
        setHud((h) => ({ 
          ...h, size, len: finalLen, saved: (1 - finalLen / initLen) * 100, inst, done: true,
          mstLen: mst.weight, gartLen: gart.length, gartErr
        }));
        return;
      }

      let s = 0;
      const stepFn = () => {
        if (cancelled) return;
        const order = snaps[s];
        const len = tourLen(pts, order);
        const done = s >= snaps.length - 1;
        drawTour(pts, order, done);
        
        const gartErr = done ? ((gart.length - len) / len) * 100 : 0;

        setHud((h) => ({ 
          ...h, size, len, saved: (1 - len / initLen) * 100, inst, done,
          mstLen: mst.weight, gartLen: gart.length, gartErr
        }));
        if (!done) { s++; timer = setTimeout(stepFn, 260); }
        else { timer = setTimeout(() => { inst += 1; runInstance(); }, 2200); }
      };
      stepFn();
    };
    runInstance();

    return () => { cancelled = true; clearTimeout(timer); map.remove(); mapRef.current = null; lineRef.current = null; markersRef.current = []; };
  }, [net]);

  return (
    <div className="fd-map">
      <div className="fd-map-mount" ref={mountRef} />
      <div className="fd-map-hud">
        <span><span className="k">Network</span> <span className="v">{hud.nodes} nodes</span></span>
        <span><span className="k">Instance</span> <span className="v">#{hud.inst} · {hud.size} stops</span></span>
      </div>
      <div className="fd-map-foot" style={{ flexDirection: "column", gap: "4px", padding: "10px 14px", background: "linear-gradient(0deg, rgba(8,11,18,.95) 75%, transparent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <span>MST <span className="v" style={{ color: "var(--text)" }}>{hud.mstLen ? `${hud.mstLen.toFixed(1)} km` : "—"}</span></span>
          <span>GART Pred <span className="v" style={{ color: "var(--blue)" }}>{hud.gartLen ? `${hud.gartLen.toFixed(1)} km` : "—"}</span></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "1px solid var(--line)", paddingTop: "4px", marginTop: "2px" }}>
          <span>Tour <span style={{ color: "var(--text)" }}>{hud.len.toFixed(1)} km</span></span>
          <span className="amber">
            {hud.done 
              ? `Solved · GART Err: ${hud.gartErr >= 0 ? "+" : ""}${hud.gartErr.toFixed(1)}%` 
              : `Solving...`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
