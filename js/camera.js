document.addEventListener("DOMContentLoaded", async () => {
    // Selectores
    const cameraInput = document.getElementById("cameraInput");
    const preview = document.getElementById("preview");
    const continueBtn = document.getElementById("continueBtn");
    const statusMessage = document.getElementById("statusMessage");
    const familyModal = document.getElementById("familyModal");
    const modalText = document.getElementById("modalText");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    let families = [];
    let shuffledFamilies = [];
    let currentIndex = 0;
    let capturedImage = null;

    // 1. Cargar familias y mezclarlas
    try {
        const response = await fetch("families.json");
        const data = await response.json();
        families = data.families;
        // Mezclamos para que el orden sea aleatorio cada vez
        shuffledFamilies = families.sort(() => Math.random() - 0.5);
    } catch (error) {
        console.error("Error al cargar familias:", error);
    }

    // 2. Evento Cámara (Previsualización)
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block";
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
                statusMessage.innerText = "Foto lista para análisis.";
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Botón Continuar (Análisis inicial)
    const handleContinue = (e) => {
        if (e) e.preventDefault();
        if (!capturedImage) return;

        sessionStorage.setItem("selfie", capturedImage);
        statusMessage.innerText = "🧠 Analizando rasgos faciales...";
        
        setTimeout(() => {
            showPrediction();
        }, 1500);
    };

    continueBtn.addEventListener("click", handleContinue);

    // 4. Lógica de Predicción y Bucle
    function showPrediction() {
        // Si superamos el array, volvemos al principio o manejamos fin de lista
        if (currentIndex >= shuffledFamilies.length) {
            currentIndex = 0; // Reinicia el bucle si quieres que sea infinito por las 6
        }

        const family = shuffledFamilies[currentIndex];
        
        // CASO ESPECIAL: La familia en 3ª posición (índice 2)
        if (currentIndex === 2) {
            modalText.innerHTML = `
                <span style="color: #ff6b6b; font-weight: bold;">⚠️ ACCESO RESTRINGIDO</span><br><br>
                El sistema identifica que sois la <b>${family.display_name}</b>.<br><br>
                Debido a vuestro historial, se ha enviado una notificación al administrador. 
                Por favor, esperad a que se os conceda acceso remoto.
            `;
            // Cambiamos el comportamiento de los botones para este caso
            confirmYes.innerText = "Esperar aprobación";
            confirmNo.style.display = "none"; // No pueden decir que no, están bloqueados
            
            confirmYes.onclick = () => {
                statusMessage.innerText = "⏳ Avisando al administrador... Esperando señal.";
                familyModal.classList.add("hidden");
                checkAdminApproval(); // Función para conectar con tu admin.html
            };
        } else {
            // Caso Normal (Familias 1, 2, 4, 5 y 6)
            confirmYes.innerText = "✅ Sí";
            confirmNo.innerText = "❌ No";
            confirmNo.style.display = "inline-block";
            
            modalText.innerHTML = `
                Análisis completado.<br><br>
                Predicción: <b>${family.display_name}</b><br><br>
                ¿Es correcto?
            `;

            confirmYes.onclick = () => {
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                window.location.href = "trivia.html";
            };

            confirmNo.onclick = () => {
                familyModal.classList.add("hidden");
                currentIndex++; // Siguiente familia
                statusMessage.innerText = "Re-escaneando base de datos...";
                setTimeout(showPrediction, 1000);
            };
        }

        familyModal.classList.remove("hidden");
    }

    // 5. Función de espera (Conexión con admin)
    function checkAdminApproval() {
        // Aquí podrías hacer un fetch cada 3 segundos a una base de datos 
        // o usar LocalStorage para pruebas locales
        const interval = setInterval(() => {
            const approval = localStorage.getItem("adminApproval");
            if (approval === "true") {
                clearInterval(interval);
                localStorage.removeItem("adminApproval");
                window.location.href = "trivia.html";
            }
        }, 3000);
    }
});