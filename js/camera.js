document.addEventListener("DOMContentLoaded", () => {
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

    // 1. CARGA SEGURA PARA MÓVIL
    function loadData() {
        fetch("families.json")
            .then(response => response.json())
            .then(data => {
                shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
                console.log("Datos cargados listos");
            })
            .catch(err => {
                console.error("Error cargando JSON:", err);
                statusMessage.innerText = "Error de conexión. Recarga la página.";
            });
    }
    loadData();

    // 2. CAPTURA (Optimizado para memoria móvil)
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block";
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
                statusMessage.innerText = "Foto lista.";
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. CONTINUAR (Evitamos el cuelgue con un flujo síncrono controlado)
    continueBtn.onclick = (e) => {
        e.preventDefault();
        
        if (shuffledFamilies.length === 0) {
            statusMessage.innerText = "Cargando base de datos... intenta de nuevo en 2 segundos.";
            loadData();
            return;
        }

        statusMessage.innerText = "🧠 Analizando rasgos faciales...";
        sessionStorage.setItem("selfie", capturedImage);

        // Forzamos un pequeño delay para que el navegador pinte el mensaje antes de abrir el modal
        window.setTimeout(() => {
            ejecutarPrediccion();
        }, 1500);
    };

    function ejecutarPrediccion() {
        // Si el modal no se abre, el error está aquí
        try {
            const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
            
            // Lógica de la 3ª familia (índice 2)
            if (currentIndex === 2) {
                modalText.innerHTML = `
                    <b style="color:#ff4444">ACCESO RESTRINGIDO</b><br><br>
                    Identificados como: <b>${family.display_name}</b>.<br><br>
                    Su historial requiere aprobación del administrador.
                `;
                confirmYes.innerText = "Solicitar Acceso";
                confirmNo.style.display = "none";

                confirmYes.onclick = () => {
                    familyModal.classList.add("hidden");
                    statusMessage.innerHTML = "⏳ <span style='color:orange'>Esperando aprobación remota...</span>";
                    
                    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                    
                    // Escucha al administrador
                    const interval = setInterval(() => {
                        if (localStorage.getItem("adminApproval") === "true") {
                            clearInterval(interval);
                            localStorage.removeItem("adminApproval");
                            window.location.href = "pages/trivia.html";
                        }
                    }, 2000);
                };
            } else {
                // Caso Normal
                confirmNo.style.display = "inline-block";
                confirmYes.innerText = "✅ Sí";
                confirmNo.innerText = "❌ No";
                modalText.innerHTML = `Análisis de rasgos completado.<br><br>¿Sois la <b>${family.display_name}</b>?`;

                confirmYes.onclick = () => {
                    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                    window.location.href = "trivia.html";
                };

                confirmNo.onclick = () => {
                    familyModal.classList.add("hidden");
                    currentIndex++;
                    statusMessage.innerText = "Buscando nueva coincidencia...";
                    window.setTimeout(ejecutarPrediccion, 500);
                };
            }
            familyModal.classList.remove("hidden");
        } catch (err) {
            statusMessage.innerText = "Error en el análisis. Intente de nuevo.";
        }
    }
});