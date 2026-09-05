const svg = document.getElementById('drawing');
const status = document.getElementById('status');

const svgNS = 'http://www.w3.org/2000/svg';
const dataUrl = 'openjscad-project%20(2).json';

function makeSvgNode(tag, attrs = {}) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function projectPoint(point) {
  const scale = 8;
  return {
    x: point.x * scale,
    y: -point.y * scale,
  };
}

function drawShape(shape) {
  const group = makeSvgNode('g');

  if (shape.type === 'text') {
    const p = projectPoint(shape.pts[0]);
    const text = makeSvgNode('text', {
      x: p.x,
      y: p.y,
      fill: shape.color || '#ffffff',
      'font-size': `${shape.size || 1}rem`,
      'text-anchor': 'start',
    });
    text.textContent = shape.text || '';
    group.appendChild(text);
    return group;
  }

  if (!shape.pts || shape.pts.length === 0) {
    return group;
  }

  const pts = shape.pts.map(projectPoint);

  if (shape.type === 'line' || shape.type === 'dim') {
    const d = [
      `M ${pts[0].x} ${pts[0].y}`,
      `L ${pts[1].x} ${pts[1].y}`,
    ].join(' ');
    const path = makeSvgNode('path', {
      d,
      stroke: shape.color || '#4fc3f7',
      'stroke-width': `${shape.width || 1.5}`,
      class: shape.type === 'dim' ? 'shape-dim' : 'shape-line',
    });
    group.appendChild(path);
    return group;
  }

  if (shape.type === 'polyline') {
    const d = pts
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    const path = makeSvgNode('path', {
      d,
      stroke: shape.color || '#4fc3f7',
      'stroke-width': `${shape.width || 1.5}`,
      class: 'shape-line',
    });
    group.appendChild(path);
    return group;
  }

  return group;
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
    const shapes = map && map.shapes ? map.shapes : [];

    svg.innerHTML = '';

    const root = makeSvgNode('g', {
      transform: 'translate(60 30)',
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
