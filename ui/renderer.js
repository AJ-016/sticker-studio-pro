const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
let currentImg = null;

// Core State
let texts = [];
let eraserPaths = [];
let historyStack = [];
let redoStack = [];

// Interaction State
let dragIdx = -1;
let dragMode = 'text'; 
let imgPanX = 0, imgPanY = 0;
let isDraggingImg = false, isErasing = false, isDraggingText = false;
let lastMouse = { x: 0, y: 0 };
let spacebarActive = false, preSpaceMode = 'text';

// ==========================================
// FLYOUT MENUS & TOOLS (PRO WORKSPACE STYLE)
// ==========================================
const toolBtns = document.querySelectorAll('.tool-btn');
const flyouts = document.querySelectorAll('.flyout-panel');

function closeAllFlyouts() {
  flyouts.forEach(f => f.classList.remove('active'));
}

toolBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // 1. Set the tool mode if it's a main tool
    if (btn.dataset.mode) {
      dragMode = btn.dataset.mode;
      if (dragMode !== 'text') dragIdx = -1; 
      // Update UI active state (only for primary tools, not properties)
      document.querySelectorAll('.tool-btn[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      canvas.style.cursor = dragMode === 'erase' ? 'crosshair' : (dragMode === 'image' ? 'grab' : 'default');
      renderCanvas();
    }

    // 2. Handle Flyout Panel
    closeAllFlyouts();
    if (btn.dataset.flyout) {
      const fly = document.getElementById(btn.dataset.flyout);
      fly.classList.add('active');
      // Position flyout dynamically next to the clicked button
      fly.style.top = btn.offsetTop + 'px';
    }
  });
});

// Remove focus from buttons after clicking so Spacebar/Keys don't trigger them
document.querySelectorAll('button, select').forEach(el => {
  el.addEventListener('click', function() { this.blur(); });
  el.addEventListener('change', function() { this.blur(); });
});

// ==========================================
// SYNC SLIDERS AND INPUTS
// ==========================================
function bindSliderAndInput(sliderId, inputId, isZoom = false) {
  const slider = document.getElementById(sliderId);
  const input = document.getElementById(inputId);
  slider.addEventListener('input', () => {
    input.value = isZoom ? Math.round(slider.value * 100) : slider.value;
    renderCanvas();
  });
  input.addEventListener('input', () => {
    slider.value = isZoom ? (input.value / 100) : input.value;
    renderCanvas();
  });
}

bindSliderAndInput('imgZoom', 'zoomVal', true);
bindSliderAndInput('eraseSize', 'eraseVal');
bindSliderAndInput('outWidth', 'outVal');

// Canvas Background color
document.getElementById('canvasBg').addEventListener('input', (e) => {
  document.getElementById('canvasWrapper').style.background = e.target.value;
});

// ==========================================
// KEYBOARD SHORTCUTS (ESC, DELETE, SPACE)
// ==========================================
window.addEventListener('keydown', (e) => {
  // Ignore shortcuts if typing in a text box
  if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;

  // ESC: Panic clear state
  if (e.key === 'Escape') {
    closeAllFlyouts();
    dragIdx = -1;
    isDraggingImg = false;
    isErasing = false;
    isDraggingText = false;
    canvas.style.cursor = dragMode === 'image' ? 'grab' : 'default';
    document.activeElement.blur(); // Clear any trapped input focus
    renderCanvas();
  }

  // DELETE / BACKSPACE: Remove Text
  if ((e.key === 'Delete' || e.key === 'Backspace') && dragIdx > -1) {
    saveState();
    texts.splice(dragIdx, 1);
    dragIdx = -1;
    renderCanvas();
  }

  // SPACEBAR: Temporary Pan Tool
  if (e.code === 'Space') {
    e.preventDefault(); 
    if(!spacebarActive) {
      spacebarActive = true; 
      preSpaceMode = dragMode; 
      dragMode = 'image';
      canvas.style.cursor = 'grab';
    }
  }

  // UNDO / REDO
  if (e.ctrlKey && e.key === 'z') undo();
  if (e.ctrlKey && e.key === 'y') redo();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    spacebarActive = false; 
    dragMode = preSpaceMode;
    canvas.style.cursor = dragMode === 'erase' ? 'crosshair' : (dragMode === 'image' ? 'grab' : 'default');
  }
});

// ==========================================
// UNDO / REDO SYSTEM
// ==========================================
function saveState() {
  historyStack.push({ texts: JSON.parse(JSON.stringify(texts)), eraserPaths: JSON.parse(JSON.stringify(eraserPaths)) });
  redoStack = []; 
  if (historyStack.length > 25) historyStack.shift(); 
}

function undo() {
  if (historyStack.length > 0) {
    redoStack.push({ texts: JSON.parse(JSON.stringify(texts)), eraserPaths: JSON.parse(JSON.stringify(eraserPaths)) });
    const state = historyStack.pop();
    texts = state.texts; eraserPaths = state.eraserPaths;
    dragIdx = -1; renderCanvas();
  }
}

function redo() {
  if (redoStack.length > 0) {
    historyStack.push({ texts: JSON.parse(JSON.stringify(texts)), eraserPaths: JSON.parse(JSON.stringify(eraserPaths)) });
    const state = redoStack.pop();
    texts = state.texts; eraserPaths = state.eraserPaths;
    dragIdx = -1; renderCanvas();
  }
}

document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

// ==========================================
// ALIGNMENT
// ==========================================
document.querySelectorAll('.align-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (!currentImg) return;
    const align = e.currentTarget.dataset.align;
    const baseScale = Math.min(432 / currentImg.width, 432 / currentImg.height);
    const zoom = parseFloat(document.getElementById('imgZoom').value);
    const w = currentImg.width * baseScale * zoom;
    const h = currentImg.height * baseScale * zoom;

    if (align === 'center') { imgPanX = 0; imgPanY = 0; }
    else if (align === 'left') { imgPanX = w/2 - 256; }
    else if (align === 'right') { imgPanX = 256 - w/2; }
    else if (align === 'top') { imgPanY = h/2 - 256; }
    else if (align === 'bottom') { imgPanY = 256 - h/2; }
    renderCanvas();
  });
});

// ==========================================
// FILE OPERATIONS
// ==========================================
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('uploadBtn');
  const path = await window.api.selectImage();
  if (!path) return;
  
  const originalHtml = btn.innerHTML;
  btn.innerHTML = "Processing...";
  
  try {
    const res = await fetch('http://127.0.0.1:8000/process', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const blob = await res.blob();
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => { 
      currentImg = img; 
      document.getElementById('imgZoom').value = 1;
      document.getElementById('zoomVal').value = 100;
      imgPanX = 0; imgPanY = 0; texts = []; eraserPaths = []; historyStack = []; redoStack = [];
      closeAllFlyouts();
      btn.innerHTML = originalHtml; 
      renderCanvas();
    };
  } catch (err) { alert("Backend error!"); btn.innerHTML = originalHtml; }
});

// ==========================================
// MOUSE & CANVAS INTERACTIONS
// ==========================================
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomInput = document.getElementById('imgZoom');
  const oldZoom = parseFloat(zoomInput.value);
  let newZoom = oldZoom + (e.deltaY * -0.005);
  newZoom = Math.min(Math.max(0.5, newZoom), 50); 
  
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) - 256; 
  const my = (e.clientY - rect.top) - 256;  
  
  const ix = (mx - imgPanX) / oldZoom;
  const iy = (my - imgPanY) / oldZoom;
  
  imgPanX = mx - (ix * newZoom);
  imgPanY = my - (iy * newZoom);
  
  zoomInput.value = newZoom;
  document.getElementById('zoomVal').value = Math.round(newZoom * 100);
  renderCanvas();
});

function getImgCoords(mx, my, baseScale, zoom) {
  const cx = 256 + imgPanX; const cy = 256 + imgPanY;
  return { x: (mx - cx) / (baseScale * zoom), y: (my - cy) / (baseScale * zoom) };
}

canvas.addEventListener('mousedown', (e) => {
  e.preventDefault(); 
  document.activeElement.blur(); // BUG FIX: Forces sliders/inputs to drop focus so state doesn't stick
  
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  lastMouse = { x: mx, y: my };

  if (dragMode === 'text') {
    dragIdx = texts.findIndex(t => Math.hypot(t.x - mx, t.y - my) < 50);
    if (dragIdx === -1) renderCanvas(); else isDraggingText = true;
  } else if (dragMode === 'image' && currentImg) {
    isDraggingImg = true;
    canvas.style.cursor = 'grabbing';
  } else if (dragMode === 'erase' && currentImg) {
    saveState();
    isErasing = true;
    const baseScale = Math.min(432 / currentImg.width, 432 / currentImg.height);
    const zoom = parseFloat(document.getElementById('imgZoom').value);
    
    eraserPaths.push({
      size: parseInt(document.getElementById('eraseSize').value) / (baseScale * zoom),
      points: [getImgCoords(mx, my, baseScale, zoom)]
    });
  }
  renderCanvas(); 
});

window.addEventListener('mousemove', (e) => {
  if (!isDraggingText && !isDraggingImg && !isErasing) return; 
  
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;

  if (dragMode === 'text' && isDraggingText && dragIdx > -1) {
    texts[dragIdx].x = mx; texts[dragIdx].y = my;
    renderCanvas();
  } else if (dragMode === 'image' && isDraggingImg) {
    imgPanX += (mx - lastMouse.x); imgPanY += (my - lastMouse.y);
    lastMouse = { x: mx, y: my };
    renderCanvas();
  } else if (dragMode === 'erase' && isErasing) {
    const baseScale = Math.min(432 / currentImg.width, 432 / currentImg.height);
    const zoom = parseFloat(document.getElementById('imgZoom').value);
    eraserPaths[eraserPaths.length - 1].points.push(getImgCoords(mx, my, baseScale, zoom));
    renderCanvas();
  }
});

window.addEventListener('mouseup', () => {
  if (isDraggingImg) canvas.style.cursor = dragMode === 'image' ? 'grab' : 'default';
  isDraggingImg = false;
  isErasing = false;
  isDraggingText = false; 
});

['outType', 'outColor', 'fontStyle'].forEach(id => {
  const el = document.getElementById(id);
  if(el) el.addEventListener('change', renderCanvas); 
});

// ==========================================
// TEXT ADDITION
// ==========================================
document.getElementById('addTextBtn').addEventListener('click', () => {
  const val = document.getElementById('textInput').value;
  if (val) {
    saveState();
    texts.push({ text: val, x: 256, y: 256 });
    document.getElementById('textInput').value = "";
    renderCanvas();
  }
});

// ==========================================
// RENDER ENGINE
// ==========================================
function drawScene(targetCtx, sizeScale = 1) {
  if (!currentImg) return;
  const cw = 512 * sizeScale, ch = 512 * sizeScale;
  targetCtx.clearRect(0, 0, cw, ch);
  
  const margin = 40 * sizeScale;
  const baseScale = Math.min((cw - margin*2) / currentImg.width, (ch - margin*2) / currentImg.height);
  const zoom = parseFloat(document.getElementById('imgZoom').value);

  const bakeCv = document.createElement('canvas');
  bakeCv.width = currentImg.width; bakeCv.height = currentImg.height;
  const bCtx = bakeCv.getContext('2d');
  
  bCtx.drawImage(currentImg, 0, 0);
  bCtx.globalCompositeOperation = 'destination-out';
  bCtx.lineCap = 'round'; bCtx.lineJoin = 'round';
  
  eraserPaths.forEach(path => {
    if(path.points.length < 2) return;
    bCtx.lineWidth = path.size;
    bCtx.beginPath();
    bCtx.moveTo(path.points[0].x + currentImg.width/2, path.points[0].y + currentImg.height/2);
    for(let i=1; i<path.points.length; i++) {
      bCtx.lineTo(path.points[i].x + currentImg.width/2, path.points[i].y + currentImg.height/2);
    }
    bCtx.stroke();
  });
  
  const w = bakeCv.width * baseScale * zoom;
  const h = bakeCv.height * baseScale * zoom;
  const cx = (cw / 2) + (imgPanX * sizeScale);
  const cy = (ch / 2) + (imgPanY * sizeScale);

  const outWidth = parseInt(document.getElementById('outVal').value) * sizeScale;
  const outColor = document.getElementById('outColor').value;
  const isSolid = document.getElementById('outType').value === 'solid';

  targetCtx.save();
  targetCtx.translate(cx, cy);

  if (outWidth > 0) {
    if (isSolid) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        targetCtx.drawImage(bakeCv, (-w/2) + Math.cos(a)*outWidth, (-h/2) + Math.sin(a)*outWidth, w, h);
      }
      targetCtx.globalCompositeOperation = 'source-in'; 
      targetCtx.fillStyle = outColor; 
      targetCtx.fillRect(-cx, -cy, cw, ch); 
      targetCtx.globalCompositeOperation = 'source-over';
    } else {
      targetCtx.shadowColor = outColor; targetCtx.shadowBlur = outWidth;
      for (let i = 0; i < 6; i++) targetCtx.drawImage(bakeCv, -w/2, -h/2, w, h);
      targetCtx.shadowBlur = 0;
    }
  }

  targetCtx.drawImage(bakeCv, -w/2, -h/2, w, h);
  targetCtx.restore();

  targetCtx.font = `bold ${36 * sizeScale}px "${document.getElementById('fontStyle').value}"`;
  targetCtx.textAlign = 'center'; targetCtx.textBaseline = 'middle'; 
  targetCtx.lineWidth = 6 * sizeScale;

  texts.forEach((t, i) => {
    const tx = t.x * sizeScale, ty = t.y * sizeScale;
    targetCtx.strokeStyle = 'black'; targetCtx.fillStyle = 'white';
    targetCtx.strokeText(t.text, tx, ty); targetCtx.fillText(t.text, tx, ty);
    
    if (sizeScale === 1 && i === dragIdx && dragMode === 'text') {
      const m = targetCtx.measureText(t.text);
      targetCtx.strokeStyle = '#00ff00'; targetCtx.lineWidth = 2; 
      targetCtx.strokeRect(tx - m.width/2 - 10, ty - 25, m.width + 20, 50);
    }
  });
}

function renderCanvas() { drawScene(ctx, 1); }

function getFileName(ext) { return (document.getElementById('fileName').value.replace(/[^a-z0-9_-]/gi, '_') || 'sticker') + ext; }

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!currentImg) return;
  const tempDrag = dragIdx; dragIdx = -1; renderCanvas(); 
  const link = document.createElement('a');
  link.download = getFileName('.webp'); link.href = canvas.toDataURL('image/webp', 0.8); link.click();
  dragIdx = tempDrag; renderCanvas(); 
});

document.getElementById('exportHDBtn').addEventListener('click', () => {
  if (!currentImg) return;
  const hdCanvas = document.createElement('canvas'); hdCanvas.width = 1024; hdCanvas.height = 1024;
  const hdCtx = hdCanvas.getContext('2d');
  const tempDrag = dragIdx; dragIdx = -1; 
  drawScene(hdCtx, 2);
  const link = document.createElement('a');
  link.download = getFileName('_HD.png'); link.href = hdCanvas.toDataURL('image/png'); link.click();
  dragIdx = tempDrag; renderCanvas(); 
});
