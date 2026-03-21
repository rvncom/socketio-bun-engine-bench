import type { BenchmarkResult } from "./types";

const NODEJS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="16" height="16" style="vertical-align: middle; margin-right: 10px;"><path fill="#5FA04E" d="M126.793 42.617c.567-2.316.326-4.665-.722-6.732-1.048-2.068-2.656-3.766-4.808-5.084L66.755 2.112c-1.583-.967-3.418-1.474-5.32-1.474-1.902 0-3.737.507-5.32 1.474L11.595 30.801c-2.148 1.314-3.754 3.011-4.802 5.084-1.047 2.073-1.288 4.422-.72 6.745.312 1.282.858 2.474 1.58 3.535l.086.113c2.723 3.528 7.374 5.378 12.016 4.786 1.492-.19 2.923-.687 4.22-1.482l22.753-13.882c3.08-1.879 6.84-1.879 9.92 0l14.498 8.846c1.54 .939 2.484 2.585 2.484 4.385v18.064c0 1.8-.944 3.446-2.484 4.385L47.018 78.435c-3.08 1.879-6.84 1.879-9.92 0l-14.5-8.847c-1.54-.939-2.483-2.584-2.483-4.385V47.14c0-2.427-1.58-4.577-3.896-5.303-2.315-.726-4.84.14-6.223 2.135-.615.886-.967 1.942-.967 3.064l-.004 22.133c0 4.146 2.185 7.95 5.753 10.126l40.407 24.654c1.804 1.101 3.883 1.68 6.024 1.68 2.14 0 4.22-.579 6.024-1.68l40.406-24.654c3.568-2.177 5.753-5.98 5.753-10.126V45.228c.001-.9-.234-1.78-.698-2.611z"/><path fill="#333" d="M126.793 42.617c.567-2.316.326-4.665-.722-6.732-1.048-2.068-2.656-3.766-4.808-5.084L66.755 2.112c-1.583-.967-3.418-1.474-5.32-1.474-1.902 0-3.737.507-5.32 1.474L11.595 30.801c-2.148 1.314-3.754 3.011-4.802 5.084-1.047 2.073-1.288 4.422-.72 6.745.312 1.282.858 2.474 1.58 3.535l.086.113c2.723 3.528 7.374 5.378 12.016 4.786 1.492-.19 2.923-.687 4.22-1.482l22.753-13.882c3.08-1.879 6.84-1.879 9.92 0l14.498 8.846c1.54 .939 2.484 2.585 2.484 4.385v18.064c0 1.8-.944 3.446-2.484 4.385L47.018 78.435c-3.08 1.879-6.84 1.879-9.92 0l-14.5-8.847c-1.54-.939-2.483-2.584-2.483-4.385V47.14c0-2.427-1.58-4.577-3.896-5.303-2.315-.726-4.84.14-6.223 2.135-.615.886-.967 1.942-.967 3.064l-.004 22.133c0 4.146 2.185 7.95 5.753 10.126l40.407 24.654c1.804 1.101 3.883 1.68 6.024 1.68 2.14 0 4.22-.579 6.024-1.68l40.406-24.654c3.568-2.177 5.753-5.98 5.753-10.126V45.228c.001-.9-.234-1.78-.698-2.611z" opacity=".1"/><path fill="#5FA04E" d="M110.198 46.216l-37.16-22.673c-2.31-1.41-5.13-1.41-7.44 0L28.438 46.216c-2.31 1.41-3.725 3.87-3.725 6.538v45.347c0 2.668 1.415 5.128 3.725 6.538l37.16 22.673c2.31 1.41 5.13 1.41 7.44 0l37.16-22.673c2.31-1.41 3.725-3.87 3.725-6.538V52.754c0-2.668-1.415-5.128-3.725-6.538zM42.164 94.618c-3.13 0-5.666-2.536-5.666-5.666V46.685c0-3.13 2.536-5.666 5.666-5.666s5.666 2.536 5.666 5.666v42.267c0 3.13-2.536 5.666-5.666 5.666zm35.207.24c-12.01 0-18.728-6.195-20.25-14.88-.236-1.344.66-2.628 2.023-2.9l6.326-1.26c1.3-.258 2.528.536 2.872 1.815 1.05 3.904 3.784 6.643 8.705 6.643 4.144 0 6.68-1.895 6.68-5.32 0-3.418-2.548-4.71-8.58-6.05-9.423-2.1-15.11-5.59-15.11-14.77 0-9.252 7.02-15.352 17.51-15.352 10.373 0 16.596 5.166 18.358 13.04.28 1.258-.466 2.53-1.71 2.923l-6.155 1.944c-1.28.404-2.63-.23-3.09-1.455-1.02-2.73-3.23-5.833-7.53-5.833-3.666 0-5.845 1.832-5.845 4.693 0 3.167 2.378 4.414 8.528 5.794 9.614 2.164 15.162 5.922 15.162 14.872 0 10.21-7.53 16.105-17.884 16.105z"/></svg>`;
const BUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="16" height="16" style="vertical-align: middle; margin-right: 10px;"><path fill="#FBF0DF" d="M64 121.2c-29.6 0-54.8-19.1-61.4-45.6-.9-3.7 1.5-7.4 5.2-8.3 3.7-.9 7.4 1.5 8.3 5.2 5.1 20.3 24.3 35.1 47.9 35.1 27.2 0 49.3-22.1 49.3-49.3S91.2 9 64 9C40.4 9 21.2 23.8 16.1 44.1c-.9 3.7-4.6 6.1-8.3 5.2-3.7-.9-6.1-4.6-5.2-8.3C9.2 14.5 34.4-4.6 64-4.6c34.7 0 62.9 28.2 62.9 62.9S98.7 121.2 64 121.2z"/><path fill="#F4D3A6" d="M64 104.3c-20.1 0-36.5-16.4-36.5-36.5S43.9 31.3 64 31.3s36.5 16.4 36.5 36.5-16.4 36.5-36.5 36.5zm0-59.4c-12.6 0-22.9 10.3-22.9 22.9S51.4 90.7 64 90.7s22.9-10.3 22.9-22.9S76.6 44.9 64 44.9z"/><path fill="#E8A85D" d="M84.3 59.4H43.7c-3.7 0-6.8-3-6.8-6.8s3-6.8 6.8-6.8h40.6c3.7 0 6.8 3 6.8 6.8s-3 6.8-6.8 6.8zM84.3 82.2H43.7c-3.7 0-6.8-3-6.8-6.8s3-6.8 6.8-6.8h40.6c3.7 0 6.8 3 6.8 6.8s-3 6.8-6.8 6.8z"/></svg>`;

export function generateHtmlReport(
  results: Record<string, BenchmarkResult>,
  workers: number,
  serverWorkers: number,
): string {
  const shorten = (label: string) => {
    if (label.includes("uWebSockets.js")) return "uWS*";
    if (label.includes("Node.js") && label.includes("(ws)")) return "node-ws";
    if (label.includes("Bun") && label.includes("(ws)")) return "bun-ws";

    return label
      .replace("Node.js ", "")
      .replace("Bun ", "")
      .replace("(@rvncom/socket-bun-engine)", "rvn-native")
      .replace("(@socket.io/bun-engine)", "bun-engine")
      .replace("(ws)", "ws")
      .trim();
  };

  const labels = Object.values(results).map((r) => shorten(r.meta.label));
  const fullLabels = Object.values(results).map((r) => r.meta.label);
  const colors = Object.values(results).map((r) => r.meta.color);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benchmark Intelligence Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --bg-color: #0d0d0f;
            --container-bg: #14141a;
            --text-color: #f0f0f5;
            --text-muted: #9ba0ad;
            --border-color: #2a2a35;
            --table-header-bg: #1d1d26;
            --hover-bg: #23232d;
            --accent-color: #00ffcc;
        }
        body { font-family: 'Inter', -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 30px; background: var(--bg-color); color: var(--text-color); line-height: 1.6; display: flex; flex-direction: column; min-height: 100vh; }
        .container { background: var(--container-bg); padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); margin-bottom: 30px; border: 1px solid var(--border-color); flex-grow: 1; }
        h1 { text-align: center; color: var(--text-color); margin-bottom: 8px; font-weight: 800; letter-spacing: -1.5px; font-size: 2.5rem; }
        .meta { text-align: center; color: var(--text-muted); margin-bottom: 50px; font-size: 0.9rem; font-weight: 500; }
        
        .tabs { display: flex; gap: 12px; margin-bottom: 35px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
        .tab-btn { background: none; border: 1px solid var(--border-color); color: var(--text-muted); padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.25s; font-weight: 600; font-size: 0.95rem; }
        .tab-btn:hover { background: var(--hover-bg); color: var(--text-color); }
        .tab-btn.active { background: var(--accent-color); color: #000; border-color: var(--accent-color); }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .chart-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
        @media (min-width: 992px) { .chart-grid { grid-template-columns: 1fr 1fr; } }
        .chart-container { position: relative; height: 400px; padding: 25px; border: 1px solid var(--border-color); border-radius: 16px; background: #0f0f14; }
        .chart-full { grid-column: 1 / -1; height: 500px; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 40px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
        th, td { padding: 18px 20px; text-align: left; border-bottom: 1px solid var(--border-color); }
        th { background-color: var(--table-header-bg); color: var(--text-muted); font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1.2px; }
        tr:hover { background-color: var(--hover-bg); }
        tr:last-child td { border-bottom: none; }
        
        .controls { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; background: #181820; padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); }
        .control-group { display: flex; align-items: center; gap: 15px; }
        select { background: #22222d; color: white; border: 1px solid #3a3a4a; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; padding-right: 40px; }
        select:focus { outline: none; border-color: var(--accent-color); }

        .sortable { cursor: pointer; user-select: none; }
        .sortable:hover { color: var(--accent-color); }
        .sort-arrow { font-size: 10px; margin-left: 4px; }
        .sort-arrow::after { content: '\\2195'; }
        .sortable.asc .sort-arrow::after { content: '\\2191'; color: var(--accent-color); }
        .sortable.desc .sort-arrow::after { content: '\\2193'; color: var(--accent-color); }
        .rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; font-size: 12px; font-weight: 800; }
        .rank-1 { background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; }
        .rank-2 { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #000; }
        .rank-3 { background: linear-gradient(135deg, #cd7f32, #a0622e); color: #fff; }
        .rank-other { background: var(--hover-bg); color: var(--text-muted); }

        footer { text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem; }
        footer a { color: var(--accent-color); text-decoration: none; font-weight: 600; }
        footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Report Intelligence</h1>
        <div class="meta">
            ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} &nbsp;•&nbsp; ${process.platform.toUpperCase()} ${process.arch} &nbsp;•&nbsp; CLUSTER: ${workers}×${serverWorkers}
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="showTab('overview')">Aggregated Metrics</button>
            <button class="tab-btn" onclick="showTab('comparison')">Runtime Analytics</button>
        </div>

        <div id="overview" class="tab-content active">
            <div class="chart-grid">
                <div class="chart-container">
                    <canvas id="connChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="tpChart"></canvas>
                </div>
                <div class="chart-container chart-full">
                    <canvas id="latChart"></canvas>
                </div>
            </div>

            <table id="metricsTable">
                <thead>
                    <tr>
                        <th style="cursor:default">#</th>
                        <th>Platform Engine</th>
                        <th class="sortable" data-sort="conn" onclick="sortTable('conn')">Conn Rate <span class="sort-arrow"></span></th>
                        <th class="sortable" data-sort="tp" onclick="sortTable('tp')">Throughput <span class="sort-arrow"></span></th>
                        <th class="sortable" data-sort="p95" onclick="sortTable('p95')">p95 Latency <span class="sort-arrow"></span></th>
                        <th class="sortable" data-sort="p50" onclick="sortTable('p50')">p50 Latency <span class="sort-arrow"></span></th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(results)
                      .map((r) => {
                        let displayLabel = r.meta.label;
                        let icon = displayLabel.includes("Node.js")
                          ? NODEJS_SVG
                          : displayLabel.includes("Bun")
                            ? BUN_SVG
                            : "";
                        let isRvn = displayLabel.includes(
                          "@rvncom/socket-bun-engine",
                        );
                        let labelStyle = isRvn
                          ? `style="color: ${r.meta.color};"`
                          : "";

                        return `
                    <tr data-conn="${r.connections?.rate || 0}" data-tp="${r.throughput?.throughput || 0}" data-p95="${r.latency?.p95Ms || 0}" data-p50="${r.latency?.p50Ms || 0}">
                        <td class="rank-cell" style="font-weight:700; color:var(--text-muted); width:30px"></td>
                        <td>${icon}<strong ${labelStyle}>${displayLabel}</strong></td>
                        <td>${r.connections?.rate?.toLocaleString() || "-"} <span style="color:var(--text-muted); font-size: 0.8rem">c/s</span></td>
                        <td>${r.throughput?.throughput?.toLocaleString() || "-"} <span style="color:var(--text-muted); font-size: 0.8rem">m/s</span></td>
                        <td>${r.latency?.p95Ms?.toFixed(2) || "-"} <span style="color:var(--text-muted); font-size: 0.8rem">ms</span></td>
                        <td>${r.latency?.p50Ms?.toFixed(2) || "-"} <span style="color:var(--text-muted); font-size: 0.8rem">ms</span></td>
                    </tr>
                    `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>

        <div id="comparison" class="tab-content">
            <div class="controls">
                <div class="control-group">
                    <label style="font-weight: 600; color: var(--text-muted)">ANALYTICS DIMENSION:</label>
                    <select id="metricSelector" onchange="updateComparisonChart()">
                        <option value="connections">Connection Establishment</option>
                        <option value="throughput">Message Throughput</option>
                        <option value="latency">Round-Trip Latency (Jitter)</option>
                    </select>
                </div>
            </div>
            <div class="chart-container chart-full" style="height: 550px;">
                <canvas id="compChart"></canvas>
            </div>
        </div>
    </div>

    <footer>
        &copy; ${new Date().getFullYear()} <a href="https://github.com/rvncom" target="_blank">raventeam</a>. Built for high-performance benchmarking.
    </footer>

    <script>
        const rawResults = ${JSON.stringify(Object.values(results))};
        const labels = ${JSON.stringify(labels)};
        const fullLabels = ${JSON.stringify(fullLabels)};
        const colors = ${JSON.stringify(colors)};

        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
            if (tabId === 'comparison') setTimeout(updateComparisonChart, 50);
        }

        Chart.defaults.color = '#7a7a8a';
        Chart.defaults.borderColor = '#20202a';
        Chart.defaults.font.family = "'Inter', sans-serif";

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1c1c24',
                    padding: 15,
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: '#30303a',
                    borderWidth: 1,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: { title: (items) => fullLabels[items[0].dataIndex] }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#181822' }, ticks: { padding: 10 } },
                x: { grid: { display: false }, ticks: { padding: 10 } }
            }
        };

        // Aggregated Bar Charts
        ['connChart', 'tpChart', 'latChart'].forEach((id, i) => {
            const metrics = [
                { data: rawResults.map(r => r.connections?.rate || 0), title: 'ESTABLISHMENT RATE' },
                { data: rawResults.map(r => r.throughput?.throughput || 0), title: 'THROUGHPUT (MSG/S)' },
                { data: rawResults.map(r => r.latency?.p95Ms || 0), title: 'P95 LATENCY (MS)' }
            ];
            new Chart(document.getElementById(id), {
                type: 'bar',
                data: { labels, datasets: [{ data: metrics[i].data, backgroundColor: colors, borderRadius: 8 }] },
                options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: metrics[i].title, color: '#f0f0f5', font: { size: 12, weight: 800 }, padding: { bottom: 20 } } } }
            });
        });

        // --- Table sorting + ranking ---
        let currentSort = { key: null, dir: 'desc' };

        function sortTable(key) {
            const isLatency = key === 'p95' || key === 'p50';
            if (currentSort.key === key) {
                currentSort.dir = currentSort.dir === 'desc' ? 'asc' : 'desc';
            } else {
                // For latency: lower is better, so default asc; for others: higher is better, default desc
                currentSort = { key, dir: isLatency ? 'asc' : 'desc' };
            }

            const tbody = document.querySelector('#metricsTable tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            rows.sort((a, b) => {
                const va = parseFloat(a.dataset[key]) || 0;
                const vb = parseFloat(b.dataset[key]) || 0;
                return currentSort.dir === 'desc' ? vb - va : va - vb;
            });

            rows.forEach((row, i) => {
                tbody.appendChild(row);
                const cell = row.querySelector('.rank-cell');
                const rank = i + 1;
                const cls = rank <= 3 ? 'rank-' + rank : 'rank-other';
                cell.innerHTML = '<span class="rank-badge ' + cls + '">' + rank + '</span>';
            });

            document.querySelectorAll('.sortable').forEach(th => {
                th.classList.remove('asc', 'desc');
                if (th.dataset.sort === key) th.classList.add(currentSort.dir);
            });
        }

        // Default sort by throughput
        sortTable('tp');

        // --- Runtime Analytics (time-series line charts) ---

        // Moving average smoothing — preserves decimal precision
        function smooth(points, windowSize) {
            if (points.length <= windowSize) return points;
            const half = Math.floor(windowSize / 2);
            return points.map((p, i) => {
                const lo = Math.max(0, i - half);
                const hi = Math.min(points.length - 1, i + half);
                let sum = 0;
                for (let j = lo; j <= hi; j++) sum += points[j].y;
                return { x: p.x, y: sum / (hi - lo + 1) };
            });
        }

        // Downsample a series to ~maxPoints using LTTB-like bucket averaging
        function downsample(points, maxPoints) {
            if (points.length <= maxPoints) return points;
            const bucketSize = points.length / maxPoints;
            const result = [points[0]];
            for (let i = 1; i < maxPoints - 1; i++) {
                const start = Math.floor(i * bucketSize);
                const end = Math.min(Math.floor((i + 1) * bucketSize), points.length);
                let sumX = 0, sumY = 0, count = 0;
                for (let j = start; j < end; j++) {
                    sumX += points[j].x;
                    sumY += points[j].y;
                    count++;
                }
                result.push({ x: sumX / count, y: sumY / count });
            }
            result.push(points[points.length - 1]);
            return result;
        }

        let compChartInstance = null;
        function updateComparisonChart() {
            const metric = document.getElementById('metricSelector').value;
            const yLabels = { connections: 'TOTAL CONNECTIONS', throughput: 'MESSAGES / SEC', latency: 'LATENCY (MS)' };

            const datasets = rawResults.map((r, idx) => {
                const section = r[metric];
                const ts = (section && section.timeSeries) || [];
                if (ts.length === 0) return null;

                // Extract points — use the metric key from each timeSeries point
                let points = ts.map(p => ({ x: p.timestamp / 1000, y: p[metric] ?? 0 }));

                // Skip datasets where all values are zero (no real data)
                if (points.every(p => p.y === 0)) return null;

                // Downsample if too many points (latency can have thousands of per-sample points)
                points = downsample(points, 300);

                // Smooth: latency per-sample data is noisy, use wider window
                // Connections/throughput are already bucketed, use lighter smoothing
                const win = metric === 'latency' ? 15 : 3;
                if (points.length > win * 2) points = smooth(points, win);

                // Show point markers when there are very few data points
                const sparse = points.length <= 5;

                const isRvn = labels[idx] === 'rvn-native';
                return {
                    label: labels[idx],
                    data: points,
                    borderColor: colors[idx],
                    backgroundColor: colors[idx].replace('0.7', '0.06'),
                    borderWidth: isRvn ? 3 : 1.8,
                    pointRadius: sparse ? 4 : 0,
                    pointHoverRadius: 4,
                    tension: 0.35,
                    fill: isRvn,
                    cubicInterpolationMode: 'monotone',
                    order: isRvn ? 0 : 1
                };
            }).filter(Boolean);

            if (compChartInstance) compChartInstance.destroy();
            compChartInstance = new Chart(document.getElementById('compChart'), {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 400 },
                    interaction: { mode: 'nearest', axis: 'x', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { weight: 600, size: 12 } } },
                        title: { display: true, text: yLabels[metric] || metric.toUpperCase(), color: '#f0f0f5', font: { size: 13, weight: 800 }, padding: { bottom: 20 } },
                        tooltip: {
                            backgroundColor: '#1c1c24',
                            padding: 12,
                            cornerRadius: 10,
                            borderColor: '#30303a',
                            borderWidth: 1,
                            callbacks: {
                                label: (ctx) => {
                                    const v = ctx.parsed.y;
                                    if (metric === 'latency') return ctx.dataset.label + ': ' + v.toFixed(2) + ' ms';
                                    if (metric === 'throughput') return ctx.dataset.label + ': ' + Math.round(v).toLocaleString() + ' msg/s';
                                    return ctx.dataset.label + ': ' + Math.round(v).toLocaleString() + ' connections';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: { display: true, text: 'TIME (SECONDS)', color: '#666', font: { size: 10, weight: 700 } },
                            grid: { color: '#181822' },
                            ticks: { callback: v => v.toFixed(1) + 's', maxTicksLimit: 15 }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: yLabels[metric] || metric.toUpperCase(), color: '#666', font: { size: 10, weight: 700 } },
                            grid: { color: '#181822' },
                            ticks: { callback: v => metric === 'latency' ? v.toFixed(2) : v.toLocaleString() }
                        }
                    }
                }
            });
        }
    </script>
</body>
</html>`;
  return html;
}
