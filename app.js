const svg = document.getElementById('drawing');
const status = document.getElementById('status');

const svgNS = 'http://www.w3.org/2000/svg';
const dataUrl = 'openjscad-project.json';

function makeSvgNode(tag, attrs = {}) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function projectPoint(point) {
  const x = point.x + 90;
  const y = -point.y + 65;
  return { x, y };
}

function buildPath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function drawShape(shape) {
  const group = makeSvgNode('g');

  if (!shape || !Array.isArray(shape.pts) || shape.pts.length === 0) {
    return group;
  }

  const pts = shape.pts.map(projectPoint);

  if (shape.type === 'text') {
    const anchor = pts[0] || { x: 0, y: 0 };
    const text = makeSvgNode('text', {
      x: anchor.x,
      y: anchor.y,
      fill: shape.color || '#edf6ff',
      'font-size': `${Math.max(10, (shape.size || 1) * 18)}px`,
      'text-anchor': 'start',
      'dominant-baseline': 'middle',
    });
    text.textContent = shape.text || '';
    group.appendChild(text);
    return group;
  }

  if (shape.type === 'line' || shape.type === 'dim' || shape.type === 'polyline') {
    const d = buildPath(pts);
    const path = makeSvgNode('path', {
      d,
      stroke: shape.color || '#7ee7ff',
      'stroke-width': `${shape.width || 1.5}`,
      class: shape.type === 'dim' ? 'shape-dim' : shape.type === 'polyline' ? 'shape-polyline' : 'shape-line',
      opacity: shape.type === 'dim' ? '0.9' : '1',
    });
    group.appendChild(path);
    return group;
  }

  return group;
}

function addBackgroundGrid(svgNode) {
  const gridGroup = makeSvgNode('g', { opacity: '0.2' });

  for (let x = -80; x <= 70; x += 10) {
    const line = makeSvgNode('line', {
      x1: x,
      y1: -30,
      x2: x,
      y2: 70,
      stroke: '#8aa8c6',
      'stroke-width': '0.45',
    });
    gridGroup.appendChild(line);
  }

  for (let y = -30; y <= 70; y += 10) {
    const line = makeSvgNode('line', {
      x1: -80,
      y1: y,
      x2: 70,
      y2: y,
      stroke: '#8aa8c6',
      'stroke-width': '0.45',
    });
    gridGroup.appendChild(line);
  }

  svgNode.appendChild(gridGroup);
}

async function loadDrawing() {
  try {
    status.textContent = 'Loading drawing…';
    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const project = await response.json();
    const map = project.maps && project.maps[0];
    const shapes = map && Array.isArray(map.shapes) ? map.shapes : [];

    svg.innerHTML = '';
    addBackgroundGrid(svg);

    const root = makeSvgNode('g', {
      transform: 'translate(25 0)',
    });

    shapes.forEach((shape) => {
      root.appendChild(drawShape(shape));
    });

    svg.appendChild(root);
    status.textContent = `${shapes.length} shapes rendered`;
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

loadDrawing();
