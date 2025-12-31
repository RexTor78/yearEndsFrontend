import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://villaaccess-73af4-default-rtdb.europe-west1.firebasedatabase.app/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Escuchamos el click directamente desde el JS (Más seguro para GitHub)
document.getElementById("btnGrant").addEventListener("click", () => {
    console.log("Enviando señal a Firebase...");
    
    set(ref(db, 'accessControl/adminApproval'), {
        status: "true",
        time: Date.now() // Forzamos actualización siempre
    }).then(() => {
        const status = document.getElementById("adminStatus");
        status.innerText = "✅ SEÑAL ENVIADA A LA NUBE";
        status.style.color = "#22c55e";
    }).catch(err => {
        console.error("Error Firebase:", err);
    });
});
function resetContador() {
    localStorage.setItem("contadorLlegada", "1");
    localStorage.removeItem("familiasEnCasa"); // Limpiamos la lista de familias dentro
    localStorage.removeItem("adminApproval");
    alert("Sistema reseteado: Contador a 1 y Villa vacía de familias.");
}