const traits = [
  "comportamiento",
  "colaboracion",
  "empatia",
  "rancio",
  "fiestero",
  "alcohol",
  "extra"
];

const slidersDiv = document.getElementById("sliders");

// Generar sliders automáticamente
traits.forEach(t => {
  slidersDiv.innerHTML += `
    <div style="margin-bottom: 10px; text-align: left;">
        <label style="text-transform: capitalize;">${t}</label>
        <input type="range" min="0" max="10" value="5" id="${t}" style="width: 100%;">
    </div>
  `;
});

// FUNCIÓN CLAVE: Conceder acceso a la cámara
function grantAccess() {
    // Seteamos la señal que el camera.js está escuchando
    localStorage.setItem("adminApproval", "true");
    
    const status = document.getElementById("adminStatus");
    status.innerText = "✅ Acceso concedido. El usuario debería ser redirigido ahora.";
    status.style.color = "#22c55e";

    // Limpiamos la señal después de un momento
    setTimeout(() => {
        status.innerText = "";
    }, 3000);
}

// Guardar puntuaciones (He corregido la URL para que sea dinámica)
async function saveScores() {
  const family = document.getElementById("familySelect").value;
  const status = document.getElementById("adminStatus");

  try {
      for (let t of traits) {
        const value = document.getElementById(t).value;
        // Nota: Asegúrate de que tu servidor 8000 esté corriendo
        await fetch(`http://127.0.0.1:8000/admin/score?family=${family}&field=${t}&value=${value}`, {
          method: "POST"
        });
      }
      alert("Puntuaciones de " + family + " guardadas correctamente.");
  } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("Error de conexión con el servidor de puntuaciones.");
  }
}
