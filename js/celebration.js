document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("resultsCanvas");
  const ctx = canvas.getContext("2d");

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // =========================
  // DATOS
  // =========================
  const selfieSrc = sessionStorage.getItem("selfie");

  const response = await fetch("families.json");
  const data = await response.json();
  const families = data.families;

  if (!selfieSrc) {
    ctx.fillStyle = "#fff";
    ctx.font = "24px sans-serif";
    ctx.fillText("No se encontró la foto inicial", centerX - 150, centerY);
    return;
  }

  // =========================
  // CARGA DE IMÁGENES
  // =========================
  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

  const selfieImg = await loadImage(selfieSrc);

  const familyImages = await Promise.all(
    families.map((f) => loadImage(f.members[0].photo))
  );

  // =========================
  // DIBUJO
  // =========================

  // Fondo suave
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Selfie central
  const centerSize = 260;
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    selfieImg,
    centerX - centerSize / 2,
    centerY - centerSize / 2,
    centerSize,
    centerSize
  );
  ctx.restore();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Familias alrededor
  const radius = 330;
  const imgSize = 140;

  familyImages.forEach((img, index) => {
    const angle = (index / familyImages.length) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Flecha
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Imagen familia
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, imgSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize);
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, imgSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  });
});
