const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
let currentImg = null;

// Multi-text and Dragging State
let texts = [];
let dragIdx = -1;
let dragMode = 'text'; // 'text' or 'image'
let imgPanX = 0;
let imgPanY = 0;
let isDraggingImg = false;
let lastMouse = { x: 0, y: 0 };

// 1. Upload & Process
document.getElementById('uploadBtn').addEventListener('click', async (e) => {
  const path = await window.api.selectImage();
  if (!path) return;
  
  e.target.textContent = "Processing AI...";
  
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
      // Reset pan/zoom when new image loads
      document.getElementById('imgZoom').value = 1;
      imgPanX = 0;
      imgPanY = 0;
      renderCanvas(); 
      e.target.textContent = "Choose Image"; 
    };
  } catch (err) {
    alert("Backend error! Make sure Python is running.");
    e.target.textContent = "Choose Image";
  }
});

// 2. Tool Modes & Text Management
document.querySelectorAll('input[name="toolMode"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    dragMode = e.target.value;
    dragIdx = -1; // Deselect text when switching modes
    renderCanvas();
  });
});

document.getElementById('addTextBtn').addEventListener('click', () => {
  const val = document.getElementById('textInput').value;
  if (val) {
    texts.push({ text: val, x: 256, y: 256 });
    document.getElementById('textInput').value = "";
    document.getElementById('modeText').checked = true; // Auto-switch to text mode
    dragMode = 'text';
    renderCanvas();
  }
});

document.getElementById('deleteTextBtn').addEventListener('click', () => {
  if (dragIdx > -1) { 
    texts.splice(dragIdx, 1); 
    dragIdx = -1; 
    renderCanvas(); 
  }
});

// 3. Mouse Interaction (Dragging Text & Panning Image)
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  lastMouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };

  if (dragMode === 'text') {
    dragIdx = texts.findIndex(t => Math.hypot(t.x - lastMouse.x, t.y - lastMouse.y) < 50);
  } else if (dragMode === 'image' && currentImg) {
    isDraggingImg = true;
  }
  renderCanvas(); 
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  if (dragMode === 'text' && dragIdx > -1) {
    texts[dragIdx].x = currentX;
    texts[dragIdx].y = currentY;
    renderCanvas();
  } else if (dragMode === 'image' && isDraggingImg) {
    imgPanX += (currentX - lastMouse.x);
    imgPanY += (currentY - lastMouse.y);
    lastMouse = { x: currentX, y: currentY };
    renderCanvas();
  }
});

const releaseDrag = () => { 
  isDraggingImg = false; 
  // Do not deselect text on mouseup, only on mode switch or export
};
window.addEventListener('mouseup', releaseDrag);
canvas.addEventListener('mouseleave', releaseDrag);

// 4. UI Update Triggers
['imgZoom', 'outType', 'outColor', 'outWidth', 'fontStyle'].forEach(id => 
  document.getElementById(id).addEventListener('input', renderCanvas)
);

// 5. Core Render Engine
function drawScene(targetCtx, sizeScale = 1) {
  if (!currentImg) return;
  const cw = 512 * sizeScale;
  const ch = 512 * sizeScale;
  targetCtx.clearRect(0, 0, cw, ch);
  
  const margin = 40 * sizeScale;
  const baseScale = Math.min((cw - margin*2) / currentImg.width, (ch - margin*2) / currentImg.height);
  
  const zoom = parseFloat(document.getElementById('imgZoom').value);
  
  // Apply visual pan and zoom
  const w = currentImg.width * baseScale * zoom;
  const h = currentImg.height * baseScale * zoom;
  const x = ((cw - w) / 2) + (imgPanX * sizeScale);
  const y = ((ch - h) / 2) + (imgPanY * sizeScale);

  const outWidth = parseInt(document.getElementById('outWidth').value) * sizeScale;
  const outColor = document.getElementById('outColor').value;
  const isSolid = document.getElementById('outType').value === 'solid';

  // Draw Outline
  if (outWidth > 0) {
    if (isSolid) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        targetCtx.drawImage(currentImg, x + Math.cos(a) * outWidth, y + Math.sin(a) * outWidth, w, h);
      }
      targetCtx.globalCompositeOperation = 'source-in'; 
      targetCtx.fillStyle = outColor; 
      targetCtx.fillRect(0, 0, cw, ch); 
      targetCtx.globalCompositeOperation = 'source-over';
    } else {
      targetCtx.shadowColor = outColor; 
      targetCtx.shadowBlur = outWidth;
      for (let i = 0; i < 6; i++) targetCtx.drawImage(currentImg, x, y, w, h);
      targetCtx.shadowBlur = 0;
    }
  }

  // Draw Image
  targetCtx.drawImage(currentImg, x, y, w, h);

  // Draw Text
  const fontFam = document.getElementById('fontStyle').value;
  targetCtx.font = `bold ${36 * sizeScale}px "${fontFam}"`;
  targetCtx.textAlign = 'center'; 
  targetCtx.textBaseline = 'middle'; 
  targetCtx.lineWidth = 6 * sizeScale;

  texts.forEach((t, i) => {
    const tx = t.x * sizeScale;
    const ty = t.y * sizeScale;
    
    targetCtx.strokeStyle = 'black'; 
    targetCtx.fillStyle = 'white';
    targetCtx.strokeText(t.text, tx, ty); 
    targetCtx.fillText(t.text, tx, ty);
    
    // Draw green selection box if rendering main canvas and text is selected
    if (sizeScale === 1 && i === dragIdx && dragMode === 'text') {
      const m = targetCtx.measureText(t.text);
      targetCtx.strokeStyle = '#00ff00'; 
      targetCtx.lineWidth = 2; 
      targetCtx.strokeRect(tx - m.width/2 - 10, ty - 25, m.width + 20, 50);
    }
  });
}

function renderCanvas() {
  drawScene(ctx, 1);
}

// 6. Exports
function getFileName(ext) {
  const name = document.getElementById('fileName').value.replace(/[^a-z0-9_-]/gi, '_');
  return (name || 'sticker') + ext;
}

// Export WhatsApp Standard (512x512 WebP)
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!currentImg) return;
  const tempDrag = dragIdx; dragIdx = -1; renderCanvas(); // Hide selection box
  
  const link = document.createElement('a');
  link.download = getFileName('.webp');
  link.href = canvas.toDataURL('image/webp', 0.8);
  link.click();
  
  dragIdx = tempDrag; renderCanvas(); // Restore selection
});

// Export High Res (1024x1024 PNG)
document.getElementById('exportHDBtn').addEventListener('click', () => {
  if (!currentImg) return;
  const hdCanvas = document.createElement('canvas');
  hdCanvas.width = 1024;
  hdCanvas.height = 1024;
  const hdCtx = hdCanvas.getContext('2d');
  
  const tempDrag = dragIdx; dragIdx = -1; // Hide selection box
  drawScene(hdCtx, 2);
  
  const link = document.createElement('a');
  link.download = getFileName('_HD.png');
  link.href = hdCanvas.toDataURL('image/png');
  link.click();
  
  dragIdx = tempDrag; renderCanvas(); // Restore selection
});
