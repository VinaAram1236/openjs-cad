const svg = document.getElementById('drawing');
const status = document.getElementById('status');
const modeButtons = document.querySelectorAll('.mode-btn');
const prevMapBtn = document.getElementById('prev-map');
const nextMapBtn = document.getElementById('next-map');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const mapNameEl = document.getElementById('map-name');

const svgNS = 'http://www.w3.org/2000/svg';
const dataUrl = 'openjscad-project.json';
let projectData = null;
let activeView = '2d';
let activeMapIndex = 0;

function makeSvgNode(tag, attrs = {}) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function projectPoint2D(point) {
  const x = point.x * 6.4 + 350;
  const y = -point.y * 6.4 + 520;
  return { x, y };
}

function projectPoint3D(point, z = 0) {
  const x = (point.x - point.y) * 5 + 720;
  const y = (point.x + point.y) * 2.8 - z * 18 + 260;
  return { x, y };
}

function buildPath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function drawShape(shape, view) {
  const group = makeSvgNode('g');

  if (!shape || !Array.isArray(shape.pts) || shape.pts.length === 0) {
    return group;
  }

  const points = view === '3d'
    ? shape.pts.map((pt) => projectPoint3D(pt, Number(shape.z || 0)))
    : shape.pts.map(projectPoint2D);

  if (shape.type === 'text') {
    const anchor = points[0] || { x: 0, y: 0 };
    const text = makeSvgNode('text', {
      x: anchor.x,
      y: anchor.y,
      fill: shape.color || '#edf6ff',
      'font-size': `${Math.max(16, (shape.size || 1) * 26)}px`,
      'text-anchor': 'start',
      'dominant-baseline': 'middle',
      opacity: view === '3d' ? '0.9' : '1',
    });
    text.textContent = shape.text || '';
    group.appendChild(text);
    return group;
  }

  if (shape.type === 'line' || shape.type === 'dim' || shape.type === 'polyline') {
    const d = buildPath(points);
    const path = makeSvgNode('path', {
      d,
      stroke: shape.color || '#7ee7ff',
      'stroke-width': `${shape.width || 1.5}`,
      class: shape.type === 'dim' ? 'shape-dim' : shape.type === 'polyline' ? 'shape-polyline' : 'shape-line',
      opacity: shape.type === 'dim' ? '0.9' : '1',
      fill: 'none',
    });
    group.appendChild(path);
    return group;
  }

  return group;
}

function addBackgroundGrid(svgNode, view) {
  const gridGroup = makeSvgNode('g', { opacity: view === '3d' ? '0.12' : '0.22' });

  for (let x = 0; x <= 1400; x += 25) {
    const line = makeSvgNode('line', {
      x1: x,
      y1: 0,
      x2: x,
      y2: 840,
      stroke: '#8aa8c6',
      'stroke-width': '0.6',
    });
    gridGroup.appendChild(line);
  }

  for (let y = 0; y <= 840; y += 25) {
    const line = makeSvgNode('line', {
      x1: 0,
      y1: y,
      x2: 1400,
      y2: y,
      stroke: '#8aa8c6',
      'stroke-width': '0.6',
    });
    gridGroup.appendChild(line);
  }

  svgNode.appendChild(gridGroup);
}

function renderDrawing() {
  if (!projectData || !projectData.maps || projectData.maps.length === 0) return;

  const map = projectData.maps[activeMapIndex];
  const shapes = map && Array.isArray(map.shapes) ? map.shapes : [];

  if (mapNameEl) {
    mapNameEl.textContent = map && map.name ? map.name : 'Floor';
  }

  svg.innerHTML = '';
  addBackgroundGrid(svg, activeView);

  const root = makeSvgNode('g');
  shapes.forEach((shape) => {
    root.appendChild(drawShape(shape, activeView));
  });

  svg.appendChild(root);
  status.textContent = `${activeMapIndex + 1} / ${projectData.maps.length} • ${map && map.name ? map.name : 'Floor'} • ${shapes.length} shapes`;
}

function changeMap(delta) {
  if (!projectData || !projectData.maps || projectData.maps.length === 0) return;
  activeMapIndex = (activeMapIndex + delta + projectData.maps.length) % projectData.maps.length;
  renderDrawing();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

async function loadDrawing() {
  try {
    status.textContent = 'Loading drawing…';
    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    projectData = await response.json();
    renderDrawing();
  } catch (error) {
    console.error(error);
    status.textContent = 'Unable to load drawing';
    svg.innerHTML = '';

    const fallback = makeSvgNode('text', {
      x: '50%',
      y: '50%',
      fill: '#fca5a5',
      'font-size': '22',
      'text-anchor': 'middle',
    });
    fallback.textContent = 'Drawing could not be loaded';
    svg.appendChild(fallback);
  }
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeView = button.dataset.view;
    modeButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    renderDrawing();
  });
});

prevMapBtn?.addEventListener('click', () => changeMap(-1));
nextMapBtn?.addEventListener('click', () => changeMap(1));
fullscreenBtn?.addEventListener('click', toggleFullscreen);

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    changeMap(-1);
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    changeMap(1);
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault();
    toggleFullscreen();
  }
});

loadDrawing();
