// Importar Firebase (vía CDN para no instalar nada)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://villaaccess-73af4-default-rtdb.europe-west1.firebasedatabase.app/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Modificamos tu función grantAccess
window.grantAccess = function() {
    console.log("Enviando aprobación a la nube...");
    
    // Escribimos en la nube en lugar del localStorage
    set(ref(db, 'accessControl/adminApproval'), {
        status: "true",
        time: Date.now()
    }).then(() => {
        const status = document.getElementById("adminStatus");
        status.innerText = "✅ ACCESO ENVIADO A LA NUBE";
        status.style.color = "#22c55e";
    });
};

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