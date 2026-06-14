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

// Floyd-Warshall for all-pairs shortest paths on the street network
function computeAllPairsShortestPaths(nodes, edges, geoDistFn) {
  const V = nodes.length;
  const distMatrix = Array.from({ length: V }, () => new Array(V).fill(Infinity));
  const nextMatrix = Array.from({ length: V }, () => new Array(V).fill(-1));

  for (let i = 0; i < V; i++) {
    distMatrix[i][i] = 0;
    nextMatrix[i][i] = i;
  }

  for (const [u, v] of edges) {
    const d = geoDistFn(nodes[u], nodes[v]);
    distMatrix[u][v] = d;
    distMatrix[v][u] = d;
    nextMatrix[u][v] = v;
    nextMatrix[v][u] = u;
  }

  for (let k = 0; k < V; k++) {
    for (let i = 0; i < V; i++) {
      for (let j = 0; j < V; j++) {
        if (distMatrix[i][k] + distMatrix[k][j] < distMatrix[i][j]) {
          distMatrix[i][j] = distMatrix[i][k] + distMatrix[k][j];
          nextMatrix[i][j] = nextMatrix[i][k];
        }
      }
    }
  }

  // Ensure fully connected distance matrix for MDS stability (straight-line fallback)
  for (let i = 0; i < V; i++) {
    for (let j = 0; j < V; j++) {
      if (distMatrix[i][j] === Infinity) {
        distMatrix[i][j] = geoDistFn(nodes[i], nodes[j]) * 1.4;
      }
    }
  }

  return { distMatrix, nextMatrix };
}

// Reconstruct exact street-network path
function reconstructPath(start, end, nextMatrix) {
  if (start === end) return [start];
  if (nextMatrix[start][end] === -1) return [start, end];
  const path = [start];
  let curr = start;
  let guard = 0;
  while (curr !== end && guard++ < 100) {
    curr = nextMatrix[curr][end];
    if (curr === -1) {
      path.push(end);
      break;
    }
    path.push(curr);
  }
  return path;
}

// Jacobi EVD for Classical MDS
function jacobiEVD(B, maxIterations = 100, tolerance = 1e-9) {
  const N = B.length;
  const A = B.map(row => [...row]);
  const V = Array.from({ length: N }, (_, i) => {
    const row = new Array(N).fill(0);
    row[i] = 1;
    return row;
  });

  for (let iter = 0; iter < maxIterations; iter++) {
    let maxVal = 0;
    let p = 0, q = 1;
    for (let i = 0; i < N - 1; i++) {
      for (let j = i + 1; j < N; j++) {
        const val = Math.abs(A[i][j]);
        if (val > maxVal) {
          maxVal = val;
          p = i;
          q = j;
        }
      }
    }

    if (maxVal < tolerance) break;

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const tau = (aqq - app) / (2 * apq);
    const t = tau >= 0 
      ? 1.0 / (tau + Math.sqrt(1.0 + tau * tau))
      : -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));

    const c = 1.0 / Math.sqrt(1.0 + t * t);
    const s = t * c;

    A[p][p] = app - t * apq;
    A[q][q] = aqq + t * apq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let r = 0; r < N; r++) {
      if (r !== p && r !== q) {
        const arp = A[r][p];
        const arq = A[r][q];
        A[r][p] = c * arp - s * arq;
        A[p][r] = A[r][p];
        A[r][q] = s * arp + c * arq;
        A[q][r] = A[r][q];
      }
    }

    for (let i = 0; i < N; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }

  const eigenvalues = A.map((_, i) => A[i][i]);
  return { eigenvalues, eigenvectors: V };
}

// Classical MDS
function classicalMDS(D, dimensions = 2) {
  const N = D.length;
  if (N === 0) return [];

  const B = Array.from({ length: N }, () => new Array(N).fill(0));
  const rowMeans = new Array(N).fill(0);
  let totalMean = 0;

  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let j = 0; j < N; j++) {
      sum += D[i][j] * D[i][j];
    }
    rowMeans[i] = sum / N;
    totalMean += sum;
  }
  totalMean /= (N * N);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      B[i][j] = -0.5 * (D[i][j] * D[i][j] - rowMeans[i] - rowMeans[j] + totalMean);
    }
  }

  const { eigenvalues, eigenvectors } = jacobiEVD(B);

  const pairs = eigenvalues.map((val, idx) => ({
    val,
    vector: eigenvectors.map(row => row[idx])
  }));

  pairs.sort((a, b) => b.val - a.val);

  const coords = Array.from({ length: N }, () => new Array(dimensions).fill(0));
  for (let d = 0; d < dimensions; d++) {
    const eigenvalue = pairs[d].val;
    if (eigenvalue > 0) {
      const sqrtEigen = Math.sqrt(eigenvalue);
      for (let i = 0; i < N; i++) {
        coords[i][d] = pairs[d].vector[i] * sqrtEigen;
      }
    }
  }

  return coords;
}

// Prim's algorithm to compute MST on spatial points
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
        // Calculate 2D Euclidean distance in the coordinate space (e.g. MDS coordinates)
        const dx = pts[u].lat - pts[v].lat;
        const dy = pts[u].lng - pts[v].lng;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minEdge[v]) {
          minEdge[v] = dist;
          parent[v] = u;
        }
      }
    }
  }
  return { weight: totalWeight, degrees };
}

// Predict alpha using aspect ratio and leaf ratio of embedded nodes
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

  // Linear GART 1.0-style approximation on MDS coordinates
  let alpha = 1.14 + 0.045 * Math.log(aspect + 1) + 0.06 * leafRatio - 0.002 * n;
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

// 2-opt symmetric TSP solver operating on a distance matrix
function solve2OptTSP(dMatrix) {
  const N = dMatrix.length;
  if (N < 3) return [[...Array(N).keys()]];

  let order = shuffle([...Array(N).keys()]);
  const snaps = [order.slice()];
  let improved = true;
  let guard = 0;

  while (improved && guard++ < 300) {
    improved = false;
    for (let i = 1; i < N - 1; i++) {
      for (let k = i + 1; k < N; k++) {
        const prev = order[i - 1];
        const curr = order[i];
        const next = order[k];
        const post = order[(k + 1) % N];

        // Symmetric swap delta evaluation
        const delta = dMatrix[prev][next] + dMatrix[curr][post] - 
                      dMatrix[prev][curr] - dMatrix[next][post];

        if (delta < -1e-9) {
          let left = i, right = k;
          while (left < right) {
            const temp = order[left];
            order[left] = order[right];
            order[right] = temp;
            left++;
            right--;
          }
          snaps.push(order.slice());
          improved = true;
        }
      }
    }
  }
  return snaps;
}

// Compute total network distance of a tour
const networkTourLen = (order, dMatrix) => {
  let sum = 0;
  const N = order.length;
  for (let i = 0; i < N; i++) {
    sum += dMatrix[order[i]][order[(i + 1) % N]];
  }
  return sum;
};

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
  
  // Compute all-pairs shortest paths on the street network
  const netPaths = useMemo(() => {
    return computeAllPairsShortestPaths(net.nodes, net.edges, geo);
  }, [net]);

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

    const drawTourOnStreets = (stopIndices, order, done) => {
      const fullPath = [];
      for (let i = 0; i < order.length; i++) {
        const u = stopIndices[order[i]];
        const v = stopIndices[order[(i + 1) % order.length]];
        const path = reconstructPath(u, v, netPaths.nextMatrix);
        
        for (let j = 0; j < path.length; j++) {
          if (j > 0 || fullPath.length === 0) {
            fullPath.push([net.nodes[path[j]].lat, net.nodes[path[j]].lng]);
          }
        }
      }
      
      const color = done ? "#FF9D3D" : "#4DA3FF";
      if (lineRef.current) { lineRef.current.setLatLngs(fullPath); lineRef.current.setStyle({ color }); }
      else lineRef.current = L.polyline(fullPath, { color, weight: 2.6, opacity: 0.95, interactive: false }).addTo(map);
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
      const stopIndices = shuffle([...Array(net.nodes.length).keys()]).slice(0, size);
      const pts = stopIndices.map(idx => net.nodes[idx]);

      // Extract N x N actual street network distance sub-matrix
      const dMatrix = Array.from({ length: size }, () => new Array(size).fill(0));
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          dMatrix[i][j] = netPaths.distMatrix[stopIndices[i]][stopIndices[j]];
        }
      }

      // Compute Classical MDS for GART Estimation
      const mdsCoords = classicalMDS(dMatrix, 2);
      const mdsPoints = mdsCoords.map(c => ({ lat: c[0], lng: c[1] }));
      
      const mdsMst = computeMST(mdsPoints);
      const gart = estimateGart(mdsPoints, mdsMst);

      const snaps = solve2OptTSP(dMatrix);
      const initLen = networkTourLen(snaps[0], dMatrix);

      clearTsp();
      drawMarkers(pts);

      if (reduce) {
        const last = snaps[snaps.length - 1];
        drawTourOnStreets(stopIndices, last, true);
        const finalLen = networkTourLen(last, dMatrix);
        const gartErr = ((gart.length - finalLen) / finalLen) * 100;
        setHud((h) => ({ 
          ...h, size, len: finalLen, saved: (1 - finalLen / initLen) * 100, inst, done: true,
          mstLen: mdsMst.weight, gartLen: gart.length, gartErr
        }));
        return;
      }

      let s = 0;
      const stepFn = () => {
        if (cancelled) return;
        const order = snaps[s];
        const len = networkTourLen(order, dMatrix);
        const done = s >= snaps.length - 1;
        drawTourOnStreets(stopIndices, order, done);
        
        const gartErr = done ? ((gart.length - len) / len) * 100 : 0;

        setHud((h) => ({ 
          ...h, size, len, saved: (1 - len / initLen) * 100, inst, done,
          mstLen: mdsMst.weight, gartLen: gart.length, gartErr
        }));
        if (!done) { s++; timer = setTimeout(stepFn, 260); }
        else { timer = setTimeout(() => { inst += 1; runInstance(); }, 2200); }
      };
      stepFn();
    };
    runInstance();

    return () => { cancelled = true; clearTimeout(timer); map.remove(); mapRef.current = null; lineRef.current = null; markersRef.current = []; };
  }, [net, netPaths]);

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
