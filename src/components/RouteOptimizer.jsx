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

// Classical MDS with Adaptive Dimension selection (variance_threshold = 0.999, max_dim = 100)
function classicalMDS(D, max_dim = 100, variance_threshold = 0.999) {
  const N = D.length;
  if (N === 0) return { coords: [], k: 0 };

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

  const posPairs = pairs.filter(p => p.val > 1e-9);
  if (posPairs.length === 0) {
    return { coords: Array.from({ length: N }, () => new Array(2).fill(0)), k: 2 };
  }

  const totalPositive = posPairs.reduce((sum, p) => sum + p.val, 0);
  let cumulativeSum = 0;
  let k_nat = posPairs.length;
  for (let i = 0; i < posPairs.length; i++) {
    cumulativeSum += posPairs[i].val;
    if (cumulativeSum / totalPositive >= variance_threshold) {
      k_nat = i + 1;
      break;
    }
  }

  // Cap dimension: at least 2D (for aspect ratio), at most max_dim (100) and N-1
  const k = Math.max(2, Math.min(k_nat, max_dim, N - 1));

  const coords = Array.from({ length: N }, () => new Array(k).fill(0));
  for (let d = 0; d < k; d++) {
    const eigenvalue = posPairs[d].val;
    const sqrtEigen = Math.sqrt(eigenvalue);
    for (let i = 0; i < N; i++) {
      coords[i][d] = posPairs[d].vector[i] * sqrtEigen;
    }
  }

  return { coords, k };
}

// Helper mathematical functions for feature extraction
function mean(arr) {
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) * (v - m), 0) / arr.length;
  return Math.sqrt(variance);
}

function getPercentile(sortedArr, q) {
  const L = sortedArr.length;
  if (L === 0) return 0;
  if (L === 1) return sortedArr[0];
  const idx = (L - 1) * (q / 100);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sortedArr[low];
  return sortedArr[low] + (idx - low) * (sortedArr[high] - sortedArr[low]);
}

function getSkewKurtosis(arr) {
  const N = arr.length;
  if (N <= 2) return { skew: 0, kurtosis: 0 };
  const m = mean(arr);
  let variance2 = 0;
  let variance3 = 0;
  let variance4 = 0;
  for (let i = 0; i < N; i++) {
    const diff = arr[i] - m;
    const diff2 = diff * diff;
    variance2 += diff2;
    variance3 += diff2 * diff;
    variance4 += diff2 * diff2;
  }
  const m2 = variance2 / N;
  const m3 = variance3 / N;
  const m4 = variance4 / N;
  if (m2 < 1e-9) return { skew: 0, kurtosis: 0 };
  const skew = m3 / Math.pow(m2, 1.5);
  const kurtosis = (m4 / (m2 * m2)) - 3.0;
  return { skew, kurtosis };
}

// Prim's algorithm to compute MST on spatial points in arbitrary dimensions
function computeMST(pts) {
  const n = pts.length;
  const inMST = new Array(n).fill(false);
  const minEdge = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  minEdge[0] = 0;

  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inMST[i] && (u === -1 || minEdge[i] < minEdge[u])) {
        u = i;
      }
    }
    if (u === -1 || minEdge[u] === Infinity) break;
    inMST[u] = true;

    for (let v = 0; v < n; v++) {
      if (!inMST[v]) {
        let sumSq = 0;
        for (let d = 0; d < pts[u].length; d++) {
          const diff = pts[u][d] - pts[v][d];
          sumSq += diff * diff;
        }
        const dist = Math.sqrt(sumSq);
        if (dist < minEdge[v]) {
          minEdge[v] = dist;
          parent[v] = u;
        }
      }
    }
  }

  const edges = [];
  const degrees = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const p = parent[i];
    let sumSq = 0;
    for (let d = 0; d < pts[i].length; d++) {
      const diff = pts[i][d] - pts[p][d];
      sumSq += diff * diff;
    }
    const dist = Math.sqrt(sumSq);
    edges.push(dist);
    degrees[i]++;
    degrees[p]++;
  }

  return { edges, parent, degrees };
}

// BFS to find farthest node in a tree
function farthest(start, n, adj) {
  const dists = new Array(n).fill(-1);
  dists[start] = 0;
  const q = [start];
  let maxNode = start;
  let maxDist = 0;
  while (q.length > 0) {
    const u = q.shift();
    if (dists[u] > maxDist) {
      maxDist = dists[u];
      maxNode = u;
    }
    for (const edge of adj[u]) {
      if (dists[edge.node] < 0) {
        dists[edge.node] = dists[u] + edge.weight;
        q.push(edge.node);
      }
    }
  }
  return { node: maxNode, dist: maxDist };
}

// GART 2.0 Linear Regression Model Constants
const IMPUTER_MEDIANS = [
  75.0, 10.0, 44.87965581083406, -40.58755351580169, 5.984498748190735, 844.93915, 135.12121,
  1179.2169, 182.3480110168457, 672.079935, 98.76577499999999, -0.10074982, 0.18379855,
  962.720725, 473.7183135986328, 562.4901275634766, 671.4127502441406, 759.6314697265625,
  831.2696105957032, 0.141178165, 1.288943432518626, 0.4333333333333333, 1.9732142857142858,
  1.0214314574273804, 5.0, 11511.671691894531, 0.27728288829009773, 11.0
];

const SCALER_MEAN = [
  249.375, 18.470588235294116, 28.034791047284557, -23.68875015562966, 1572328132684.499,
  3738.122196621567, 502.57346286489366, 4862.412938193914, 673.1026674527895, 3511.5947888450346,
  366.9371175936229, -0.01826675144615482, 0.47569371788046433, 4348.798859490074,
  3073.0465209589147, 3289.270391423994, 3521.461582995284, 3742.160714971389, 3936.6414439351224,
  0.19890262709233458, 1.5574919034603751, 0.4326395414484832, 1.9118482142857143, 1.0444403164363683,
  6.044948973741543, 67487.26866550025, 0.3618522667821387, 36.27988476092191
];

const SCALER_SCALE = [
  315.3203149840915, 15.49997209507478, 238.00524272036185, 237.04341287809964, 5349414727122.605,
  5324.639484254835, 624.9179447219863, 6593.2620930553385, 858.7782723555675, 5818.55765127871,
  509.88937831827707, 0.6692936660666947, 4.750180229956686, 6698.321850249723, 5347.062406669924,
  5586.828081067196, 5839.438899957241, 6080.683997483192, 6294.04012534694, 0.15833109841581097,
  0.9770442638938492, 0.09743964478494714, 0.11908319934154406, 0.29800061579380444, 3.5477540615331904,
  129115.14101819515, 0.2837661235253147, 46.184786874225274
];

const MODEL_COEF = [
  -0.028830027142132595, -0.019853033662624496, 6.97590524539578, 6.938635075924781,
  -0.004473204976906619, -0.010333468288370316, 0.027562712217856146, -0.03253595735084008,
  0.0009709867835814484, 0.40670733607154896, 0.010067076751436218, 0.0026785275369736617,
  -0.00846400310789718, -0.026240538758362377, -0.0036046049117289735, -0.03435478643789339,
  -0.053693439462717193, -0.14893755951539392, -0.13392250278543164, 0.09336986866279769,
  0.014512771278885304, 0.003374544778734428, -0.048578032575419455, 0.0035127025344207667,
  0.00017453829605398527, 0.006697876882816933, 0.0028303830061464363, 0.017331887334876124
];

const MODEL_INTERCEPT = 1.1365752951035502;

const FEATURE_NAMES = [
  'n_customers', 'dimension', 'log_bounding_hypervolume', 'log_node_density',
  'aspect_ratio', 'centroid_dist_mean', 'centroid_dist_std',
  'centroid_dist_max', 'centroid_dist_iqr', 'mst_edge_mean', 'mst_edge_std',
  'mst_edge_skew', 'mst_edge_kurtosis', 'mst_edge_max', 'mst_edge_q10',
  'mst_edge_q25', 'mst_edge_q50', 'mst_edge_q75', 'mst_edge_q90',
  'mst_dominance_ratio', 'mst_gap_ratio', 'mst_leaf_ratio', 'mst_degree_mean',
  'mst_degree_std', 'mst_degree_max', 'mst_diameter',
  'mst_diameter_normalized', 'large_edge_count'
];

function predictGart(pts) {
  const n = pts.length;
  if (n < 3) {
    const mst = computeMST(pts);
    const mst_total_length = mst.edges.reduce((sum, v) => sum + v, 0);
    return { alpha: 1.0, estimate: mst_total_length, mst_length: mst_total_length };
  }
  const d = pts[0].length;
  const feats = { n_customers: n, dimension: d };

  // 1. Hypervolume, Node Density, Aspect Ratio
  const rngs = new Array(d).fill(0);
  for (let j = 0; j < d; j++) {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < n; i++) {
      if (pts[i][j] < minVal) minVal = pts[i][j];
      if (pts[i][j] > maxVal) maxVal = pts[i][j];
    }
    let r = maxVal - minVal;
    if (r < 1e-9) r = 1e-9;
    rngs[j] = r;
  }
  let log_hv = 0;
  for (let j = 0; j < d; j++) log_hv += Math.log(rngs[j]);
  feats.log_bounding_hypervolume = log_hv;
  feats.log_node_density = Math.log(n) - log_hv;
  feats.aspect_ratio = Math.max(...rngs) / Math.min(...rngs);

  // 2. Centroid statistics
  const centroid = new Array(d).fill(0);
  for (let j = 0; j < d; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += pts[i][j];
    centroid[j] = sum / n;
  }
  const c_raw = [];
  for (let i = 0; i < n; i++) {
    let sumSq = 0;
    for (let j = 0; j < d; j++) {
      const diff = pts[i][j] - centroid[j];
      sumSq += diff * diff;
    }
    c_raw.push(Math.sqrt(sumSq));
  }
  feats.centroid_dist_mean = mean(c_raw);
  feats.centroid_dist_std = std(c_raw);
  feats.centroid_dist_max = Math.max(...c_raw);
  const sortedCentroidDists = [...c_raw].sort((a, b) => a - b);
  feats.centroid_dist_iqr = getPercentile(sortedCentroidDists, 75) - getPercentile(sortedCentroidDists, 25);

  // 3. MST features
  const mst = computeMST(pts);
  const edges = mst.edges;
  const mst_total_length = edges.reduce((sum, v) => sum + v, 0);
  feats.mst_total_length = mst_total_length;
  feats.mst_edge_mean = mean(edges);
  feats.mst_edge_std = std(edges);
  const skewKurt = getSkewKurtosis(edges);
  feats.mst_edge_skew = skewKurt.skew;
  feats.mst_edge_kurtosis = skewKurt.kurtosis;
  feats.mst_edge_max = Math.max(...edges);

  const sortedEdges = [...edges].sort((a, b) => a - b);
  feats.mst_edge_q10 = getPercentile(sortedEdges, 10);
  feats.mst_edge_q25 = getPercentile(sortedEdges, 25);
  feats.mst_edge_q50 = getPercentile(sortedEdges, 50);
  feats.mst_edge_q75 = getPercentile(sortedEdges, 75);
  feats.mst_edge_q90 = getPercentile(sortedEdges, 90);

  const k_dom = Math.max(1, Math.floor(Math.sqrt(n)));
  const largestKEdges = sortedEdges.slice(-k_dom);
  feats.mst_dominance_ratio = largestKEdges.reduce((sum, v) => sum + v, 0) / (mst_total_length + 1e-9);
  feats.mst_gap_ratio = feats.mst_edge_max / (feats.mst_edge_q50 + 1e-9);

  let leafCount = 0;
  for (let i = 0; i < n; i++) {
    if (mst.degrees[i] === 1) leafCount++;
  }
  feats.mst_leaf_ratio = leafCount / n;
  feats.mst_degree_mean = mean(mst.degrees);
  feats.mst_degree_std = std(mst.degrees);
  feats.mst_degree_max = Math.max(...mst.degrees);

  let largeEdgeCount = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > feats.mst_edge_mean + feats.mst_edge_std) {
      largeEdgeCount++;
    }
  }
  feats.large_edge_count = largeEdgeCount;

  // 4. MST Diameter
  const adj = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i++) {
    const p = mst.parent[i];
    const w = edges[i - 1];
    adj[i].push({ node: p, weight: w });
    adj[p].push({ node: i, weight: w });
  }
  const r1 = farthest(0, n, adj);
  const r2 = farthest(r1.node, n, adj);
  feats.mst_diameter = r2.dist;
  feats.mst_diameter_normalized = r2.dist / (mst_total_length + 1e-9);

  let alpha = 0;
  for (let i = 0; i < FEATURE_NAMES.length; i++) {
    const name = FEATURE_NAMES[i];
    let val = feats[name];
    if (val === undefined || isNaN(val)) {
      val = IMPUTER_MEDIANS[i];
    }
    const scaledVal = (val - SCALER_MEAN[i]) / SCALER_SCALE[i];
    alpha += scaledVal * MODEL_COEF[i];
  }
  alpha += MODEL_INTERCEPT;
  alpha = Math.max(1.0, Math.min(2.0, alpha));

  return {
    alpha,
    estimate: alpha * mst_total_length,
    mst_length: mst_total_length
  };
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

      // Compute Classical MDS for GART Estimation (adaptive dimension up to 100D, variance_threshold = 0.999)
      const mdsResult = classicalMDS(dMatrix, 100, 0.999);
      const mdsCoords = mdsResult.coords;
      const gart = predictGart(mdsCoords);

      const snaps = solve2OptTSP(dMatrix);
      const initLen = networkTourLen(snaps[0], dMatrix);

      clearTsp();
      drawMarkers(pts);

      if (reduce) {
        const last = snaps[snaps.length - 1];
        drawTourOnStreets(stopIndices, last, true);
        const finalLen = networkTourLen(last, dMatrix);
        const gartErr = ((gart.estimate - finalLen) / finalLen) * 100;
        setHud((h) => ({ 
          ...h, size, len: finalLen, saved: (1 - finalLen / initLen) * 100, inst, done: true,
          mstLen: gart.mst_length, gartLen: gart.estimate, gartErr
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
        
        const gartErr = done ? ((gart.estimate - len) / len) * 100 : 0;

        setHud((h) => ({ 
          ...h, size, len, saved: (1 - len / initLen) * 100, inst, done,
          mstLen: gart.mst_length, gartLen: gart.estimate, gartErr
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
