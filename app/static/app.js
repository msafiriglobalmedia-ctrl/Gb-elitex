const $ = (id) => document.getElementById(id);
const splash = $('splash');
const shell = $('app-shell');
const runButton = $('run-test');
let testInProgress = false;

function revealApp() {
  splash.classList.add('is-hidden');
  shell.classList.add('is-ready');
  shell.setAttribute('aria-hidden', 'false');
}

window.addEventListener('load', () => {
  window.setTimeout(revealApp, 2200);
  $('skip-splash').addEventListener('click', revealApp);
  checkService();
  showBrowserNetwork();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('/static/service-worker.js', { scope: '/' }).catch(() => {});
  }
});

function toast(message) {
  const item = $('toast');
  item.textContent = message;
  item.classList.add('show');
  window.setTimeout(() => item.classList.remove('show'), 3200);
}

async function checkService() {
  const dot = document.querySelector('.service-state');
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) throw new Error('Service response was not OK');
    const data = await response.json();
    dot.classList.remove('offline');
    dot.classList.add('online');
    $('service-state-text').textContent = 'Service online';
    $('api-network').textContent = `Online · v${data.version}`;
  } catch (error) {
    dot.classList.remove('online');
    dot.classList.add('offline');
    $('service-state-text').textContent = 'Service unavailable';
    $('api-network').textContent = 'Unavailable';
  }
}

function showBrowserNetwork() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    $('browser-network').textContent = 'Not exposed by this browser';
    return;
  }
  const parts = [];
  if (connection.effectiveType) parts.push(connection.effectiveType.toUpperCase());
  if (Number.isFinite(connection.downlink)) parts.push(`${connection.downlink} Mbps est.`);
  if (Number.isFinite(connection.rtt)) parts.push(`${connection.rtt} ms est. RTT`);
  $('browser-network').textContent = parts.join(' · ') || 'No estimate available';
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function jitterEstimate(values) {
  if (values.length < 2) return 0;
  const deltas = [];
  for (let i = 1; i < values.length; i += 1) deltas.push(Math.abs(values[i] - values[i - 1]));
  return mean(deltas);
}

async function measurePing() {
  const samples = [];
  for (let i = 0; i < 6; i += 1) {
    const start = performance.now();
    const response = await fetch(`/api/ping?sample=${i}&nonce=${Math.random().toString(36).slice(2)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Ping sample failed');
    await response.json();
    samples.push(performance.now() - start);
  }
  return samples;
}

async function measureDownload() {
  const bytes = 256 * 1024;
  const start = performance.now();
  const response = await fetch(`/api/download?size_kb=256&nonce=${Math.random().toString(36).slice(2)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Download sample failed');
  const payload = await response.arrayBuffer();
  const elapsed = Math.max((performance.now() - start) / 1000, 0.001);
  return (payload.byteLength * 8) / elapsed / 1_000_000;
}

async function measureUpload() {
  const payload = new Uint8Array(64 * 1024);
  window.crypto.getRandomValues(payload);
  const start = performance.now();
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: payload,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Upload sample failed');
  const result = await response.json();
  const elapsed = Math.max((performance.now() - start) / 1000, 0.001);
  return { mbps: (result.received_bytes * 8) / elapsed / 1_000_000, bytes: result.received_bytes };
}

function setMetric(id, value, unit) {
  $(id).innerHTML = `${value}<small> ${unit}</small>`;
}

async function runDiagnostics() {
  if (testInProgress) return;
  testInProgress = true;
  runButton.disabled = true;
  runButton.innerHTML = '<span class="button-icon">◌</span> Measuring…';
  document.body.classList.add('is-testing');
  $('diagnostic-state').innerHTML = '<div class="state-symbol">◌</div><div><strong>Measurement in progress</strong><p>Testing this browser-to-service path. Please keep this page open.</p></div>';
  $('last-updated').textContent = 'Running measurements…';
  try {
    const pingSamples = await measurePing();
    const average = mean(pingSamples);
    const minimum = Math.min(...pingSamples);
    const jitter = jitterEstimate(pingSamples);
    const download = await measureDownload();
    const upload = await measureUpload();

    setMetric('metric-rtt', average.toFixed(1), 'ms');
    setMetric('metric-jitter', jitter.toFixed(1), 'ms');
    setMetric('metric-download', download.toFixed(2), 'Mbps');
    setMetric('metric-upload', upload.mbps.toFixed(2), 'Mbps');
    $('metric-rtt-note').textContent = `Minimum sample ${minimum.toFixed(1)} ms · 6 samples`;
    $('metric-jitter-note').textContent = 'Mean change between consecutive RTT samples';
    $('diagnostic-state').innerHTML = '<div class="state-symbol">✓</div><div><strong>Service-path test completed</strong><p>All requested samples were returned. These values describe this route to GB ELITEX only.</p></div>';
    $('api-network').textContent = 'Online · measurements completed';
    $('last-updated').textContent = `Completed ${new Date().toLocaleTimeString()}`;
    toast('GB ELITEX service-path measurements completed.');
  } catch (error) {
    $('diagnostic-state').innerHTML = `<div class="state-symbol">!</div><div><strong>Test could not complete</strong><p>${String(error.message || error).replace(/[<>]/g, '')}</p></div>`;
    $('last-updated').textContent = 'Test failed';
    toast('A measurement failed. Check your connection and retry.');
  } finally {
    testInProgress = false;
    runButton.disabled = false;
    runButton.innerHTML = '<span class="button-icon">⌁</span> Run connection check <span class="button-arrow">↗</span>';
    document.body.classList.remove('is-testing');
    showBrowserNetwork();
    checkService();
  }
}

runButton.addEventListener('click', runDiagnostics);
