const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
let currentImg = null;

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
  img.onload = () => {
    currentImg = img;
    renderCanvas();
    e.target.textContent = "Choose Image";
  };
});

document.getElementById('textInput').addEventListener('input', renderCanvas);

function renderCanvas() {
  if (!currentImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const margin = 30;
  const size = canvas.width - (margin * 2);
  const scale = Math.min(size / currentImg.width, size / currentImg.height);
  const w = currentImg.width * scale;
  const h = currentImg.height * scale;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;

  ctx.shadowColor = 'white';
  ctx.shadowBlur = 15;
  for(let i=0; i<6; i++) ctx.drawImage(currentImg, x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.drawImage(currentImg, x, y, w, h);

  const text = document.getElementById('textInput').value;
  if (text) {
    ctx.font = 'bold 36px system-ui';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    ctx.strokeText(text, canvas.width / 2, canvas.height - 25);
    ctx.fillText(text, canvas.width / 2, canvas.height - 25);
  }
}

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!currentImg) return;
  const link = document.createElement('a');
  link.download = 'sticker.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
