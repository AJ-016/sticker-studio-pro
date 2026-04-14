const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
let currentImg = null;
let texts = [];
let dragIdx = -1;

document.getElementById('uploadBtn').addEventListener('click', async (e) => {
  const path = await window.api.selectImage();
  if (!path) return;
  e.target.textContent = "Processing locally...";
  
  const res = await fetch('http://127.0.0.1:8000/process', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  
  const blob = await res.blob();
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  img.onload = () => { currentImg = img; renderCanvas(); e.target.textContent = "Choose Image"; };
});

document.getElementById('addTextBtn').addEventListener('click', () => {
  const val = document.getElementById('textInput').value;
  if (val) {
    texts.push({ text: val, x: 256, y: 256 });
    document.getElementById('textInput').value = "";
    renderCanvas();
  }
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  dragIdx = texts.findIndex(t => Math.hypot(t.x - mx, t.y - my) < 40);
});

canvas.addEventListener('mousemove', (e) => {
  if (dragIdx > -1) {
    const rect = canvas.getBoundingClientRect();
    texts[dragIdx].x = e.clientX - rect.left;
    texts[dragIdx].y = e.clientY - rect.top;
    renderCanvas();
  }
});

window.addEventListener('mouseup', () => dragIdx = -1);

['imgFeather', 'outType', 'outColor', 'outWidth'].forEach(id => 
  document.getElementById(id).addEventListener('input', renderCanvas)
);

function renderCanvas() {
  if (!currentImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const margin = 40;
  const scale = Math.min((canvas.width - margin*2) / currentImg.width, (canvas.width - margin*2) / currentImg.height);
  const w = currentImg.width * scale, h = currentImg.height * scale;
  const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;

  const outWidth = parseInt(document.getElementById('outWidth').value);
  const outColor = document.getElementById('outColor').value;
  const isSolid = document.getElementById('outType').value === 'solid';
  const imgFeather = document.getElementById('imgFeather').value;

  if (outWidth > 0) {
    if (isSolid) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.drawImage(currentImg, x + Math.cos(a) * outWidth, y + Math.sin(a) * outWidth, w, h);
      }
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = outColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.shadowColor = outColor;
      ctx.shadowBlur = outWidth;
      for (let i = 0; i < 6; i++) ctx.drawImage(currentImg, x, y, w, h);
      ctx.shadowBlur = 0;
    }
  }

  ctx.filter = imgFeather > 0 ? `blur(${imgFeather}px)` : 'none';
  ctx.drawImage(currentImg, x, y, w, h);
  ctx.filter = 'none';

  ctx.font = 'bold 36px system-ui';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  texts.forEach(t => {
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
  });
}

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!currentImg) return;
  const link = document.createElement('a');
  link.download = 'sticker.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
