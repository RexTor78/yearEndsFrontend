document.addEventListener("DOMContentLoaded", async () => {
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

    // Limpiar señales de admin previas
    localStorage.removeItem("adminApproval");

    // 1. Cargar familias (con manejo de errores para que no se cuelgue)
    try {
        const response = await fetch("families.json");
        if (!response.ok) throw new Error("No se pudo cargar el JSON");
        const data = await response.json();
        families = data.families;
        shuffledFamilies = [...families].sort(() => Math.random() - 0.5);
    } catch (error) {
        console.error("Error:", error);
        statusMessage.innerText = "Error cargando base de datos.";
    }

    // 2. Evento Cámara
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block";
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
                statusMessage.innerText = "Foto capturada correctamente.";
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Función de análisis (La que se colgaba)
    function startAnalysis() {
        if (!capturedImage) return;
        
        statusMessage.innerText = "🧠 Analizando rasgos faciales...";
        
        // Usamos un tiempo corto para asegurar que el DOM se actualice
        setTimeout(() => {
            showPrediction();
        }, 1200);
    }

    // Soporte para Click y Touch (Móvil)
    continueBtn.addEventListener("click", (e) => {
        e.preventDefault();
        startAnalysis();
    });

    // 4. Lógica de Predicción
    function showPrediction() {
        if (shuffledFamilies.length === 0) {
            statusMessage.innerText = "Error: No hay familias cargadas.";
            return;
        }

        const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
        
        // CASO ESPECIAL: 3ª posición (índice 2)
        if (currentIndex === 2) {
            modalText.innerHTML = `
                <div style="color: #ff4444; font-weight: bold; margin-bottom:10px;">⚠️ ACCESO RESTRINGIDO</div>
                Identificado como: <b>${family.display_name}</b>.<br><br>
                Su historial requiere aprobación manual. Se ha notificado al administrador.
            `;
            confirmYes.innerText = "Esperar Aprobación";
            confirmNo.style.display = "none"; // Bloqueamos el "No"

            confirmYes.onclick = () => {
                familyModal.classList.add("hidden");
                statusMessage.innerHTML = "⏳ <span style='color:orange'>Esperando respuesta del administrador...</span>";
                checkAdminApproval(family);
            };
        } else {
            // Caso normal
            confirmNo.style.display = "inline-block";
            confirmYes.innerText = "✅ Sí";
            confirmNo.innerText = "❌ No";

            modalText.innerHTML = `
                Análisis completado.<br><br>
                ¿Sois la <b>${family.display_name}</b>?
            `;

            confirmYes.onclick = () => {
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                window.location.href = "trivia.html";
            };

            confirmNo.onclick = () => {
                familyModal.classList.add("hidden");
                currentIndex++;
                statusMessage.innerText = "Buscando nueva coincidencia...";
                setTimeout(showPrediction, 800);
            };
        }
        familyModal.classList.remove("hidden");
    }

    function checkAdminApproval(family) {
        // Guardamos la familia para cuando el admin apruebe
        sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
        
        const interval = setInterval(() => {
            if (localStorage.getItem("adminApproval") === "true") {
                clearInterval(interval);
                localStorage.removeItem("adminApproval");
                window.location.href = "trivia.html";
            }
        }, 2000);
    }
});