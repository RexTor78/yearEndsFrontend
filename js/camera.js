document.addEventListener("DOMContentLoaded", async () => {
    const cameraInput = document.getElementById("cameraInput");
    const preview = document.getElementById("preview");
    const continueBtn = document.getElementById("continueBtn");
    const statusMessage = document.getElementById("statusMessage");
    const familyModal = document.getElementById("familyModal");
    const modalText = document.getElementById("modalText");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    let shuffledFamilies = [];
    let currentIndex = 0;
    let capturedImage = null;

    // 1. CARGA DEL JSON (Ruta correcta si el JS está en /js y JSON en raíz)
    try {
        const response = await fetch("./families.json");
        const data = await response.json();
        // Mezclamos las familias para que la identificación sea aleatoria
        shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
    } catch (e) {
        console.error("Error al cargar familias.json");
        statusMessage.innerText = "Error cargando base de datos.";
    }

    // 2. PREVISUALIZACIÓN DE FOTO (Arreglado para móvil)
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block"; // Asegura que se vea
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. BOTÓN CONTINUAR
    continueBtn.onclick = () => {
        statusMessage.innerText = "🧠 Analizando rasgos faciales...";
        setTimeout(showPrediction, 1200);
    };

    // 4. LÓGICA DE PREDICCIÓN Y ORDEN DE LLEGADA
    function showPrediction() {
        const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
        
        // RECUPERAMOS EL ORDEN DE LLEGADA REAL DESDE LOCALSTORAGE
        // Importante: Este contador marca cuántas familias han confirmado ya (dado al SÍ)
        let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

        // CASO ESPECIAL: Si es la 3ª familia que llega a la casa
        if (ordenLlegada === 3) {
            modalText.innerHTML = `
                <div id="adminBanner" style="background: #b91c1c; color: white; padding: 12px; margin-bottom: 10px; border-radius: 8px; font-weight: bold; text-align: center;">
                    ⚠️ ACCESO RESTRINGIDO
                </div>
                Identificados como: <b>${family.display_name}</b>.<br><br>
                Protocolo: Son la <b>3ª familia</b> del día. Esperen aprobación del administrador.
            `;
            confirmNo.style.display = "none"; // Bloqueado, no pueden decir que no
            confirmYes.innerText = "Solicitar Permiso";

            confirmYes.onclick = () => {
                familyModal.classList.add("hidden");
                statusMessage.innerHTML = `
                    <div style="background: #b91c1c; color: white; padding: 15px; border-radius: 8px; animation: pulse 2s infinite; font-weight: bold;">
                        ⏳ Esperando confirmación remota del administrador...
                    </div>`;
                
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                escucharAdmin(family);
            };
        } else {
            // FLUJO NORMAL PARA EL RESTO (1, 2, 4, 5...)
            confirmNo.style.display = "inline-block";
            confirmYes.innerText = "✅ Sí, somos nosotros";
            confirmNo.innerText = "❌ No";
            modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;

            confirmYes.onclick = () => {
                // AL CONFIRMAR QUE SÍ ES SU FAMILIA, SUBIMOS EL CONTADOR DE LLEGADA
                localStorage.setItem("contadorLlegada", (ordenLlegada + 1).toString());
                
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                // Redirigimos a la carpeta pages
                window.location.href = "pages/trivia.html";
            };

            confirmNo.onclick = () => {
                familyModal.classList.add("hidden");
                currentIndex++; // El usuario dice que no es esa familia, mostramos otra al azar
                setTimeout(showPrediction, 500);
            };
        }
        familyModal.classList.remove("hidden");
    }

    // 5. ESCUCHA AL ADMINISTRADOR
    function escucharAdmin(family) {
        const interval = setInterval(() => {
            if (localStorage.getItem("adminApproval") === "true") {
                clearInterval(interval);
                localStorage.removeItem("adminApproval");
                
                // También aumentamos el contador de llegada al ser aprobados
                let ordenActual = parseInt(localStorage.getItem("contadorLlegada") || "3");
                localStorage.setItem("contadorLlegada", (ordenActual + 1).toString());

                statusMessage.innerHTML = `
                    <div style="background: #15803d; color: white; padding: 15px; border-radius: 8px; font-weight: bold;">
                        ✅ ACCESO CONCEDIDO POR ADMINISTRADOR
                    </div>`;
                
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                
                setTimeout(() => { 
                    window.location.href = "pages/trivia.html"; 
                }, 2000);
            }
        }, 2000);
    }
});