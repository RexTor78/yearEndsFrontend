const traits = ["comportamiento", "colaboracion", "empatia", "rancio", "fiestero", "alcohol", "extra"];
const slidersDiv = document.getElementById("sliders");

traits.forEach(t => {
  slidersDiv.innerHTML += `
    <div style="margin-bottom: 10px; text-align: left;">
        <label style="text-transform: capitalize;">${t}</label>
        <input type="range" min="0" max="10" value="5" id="${t}" style="width: 100%;">
    </div>`;
});

// FUNCIÓN CORREGIDA: Ahora coincide con el HTML
function grantAccess() {
    console.log("Enviando aprobación de administrador...");
    
    // Al añadir Date.now(), el valor siempre es distinto y el navegador FORZA la actualización
    localStorage.setItem("adminApproval", "true_" + Date.now());
    
    const status = document.getElementById("adminStatus");
    status.innerText = "✅ ACCESO ENVIADO CORRECTAMENTE";
    status.style.color = "#22c55e";

    setTimeout(() => {
        status.innerText = "";
    }, 3000);
}

function resetContador() {
    localStorage.setItem("contadorLlegada", "1");
    localStorage.removeItem("adminApproval");
    alert("Sistema reseteado: Contador a 1 y permisos limpios.");
}

// ... resto de tu función saveScores igual ...