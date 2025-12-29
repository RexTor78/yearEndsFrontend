document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("resultsCanvas");
  const ctx = canvas.getContext("2d");

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // =========================
  // CARGA DE DATOS
  // =========================

  const centralPhoto = sessionStorage.getItem("finalPhoto");
  const confirmedFamilies = JSON.parse(
    sessionStorage.getItem("confirmedFamilies")
  ) || [];

  if (!centralPhoto || confirmedFamilies.length === 0) {
    console.warn("No hay datos suficientes para mostrar resultados");
    return;
  }

  const familiesData = await fetch("/families.json").then(res => res.json());

  const families = confirmedFamilies
    .map(id => familiesData.find(f => f.id === id))
    .filter(Boolean);

  // =========================
  // UTILIDADES
  // =========================

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  function drawFramedImage(img, x, y, w, h) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#fff";
    ctx.fillRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12);

    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  function drawArrow(fromX, fromY, toX, toY) {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 80;

    ctx.save();
    ctx.strokeStyle = "#7CFF4E";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(midX, midY, toX, toY);
    ctx.stroke();

    // Punta de flecha
    const angle = Math.atan2(toY - midY, toX - midX);
    const size = 12;

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - size * Math.cos(angle - Math.PI / 6),
      toY - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - size * Math.cos(angle + Math.PI / 6),
      toY - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = "#7CFF4E";
    ctx.fill();

    ctx.restore();
  }

  // =========================
  // DIBUJO
  // =========================

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Foto central ---
  const centerImg = await loadImage(centralPhoto);
  drawFramedImage(centerImg, centerX, centerY, 420, 300);

  // --- Posiciones alrededor (layout fijo tipo imagen ejemplo) ---
  const positions = [
    { x: 300, y: 220 },
    { x: canvas.width - 300, y: 220 },
    { x: 300, y: canvas.height - 220 },
    { x: canvas.width - 300, y: canvas.height - 220 }
  ];

  for (let i = 0; i < families.length && i < positions.length; i++) {
    const family = families[i];
    const pos = positions[i];

    // Foto representativa (primera del JSON)
    const refPhotoSrc = family.members[0].photo;
    const refImg = await loadImage(refPhotoSrc);

    // Mini collage simple (una imagen por ahora)
    drawFramedImage(refImg, pos.x, pos.y, 220, 150);

    // Flecha hacia el centro
    drawArrow(pos.x, pos.y, centerX, centerY);

    // Nombre de familia
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(family.display_name, pos.x, pos.y - 95);
    ctx.restore();
  }
});
