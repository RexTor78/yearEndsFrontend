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

    // 1. CARGA INMEDIATA
    async function loadFamilies() {
        try {
            // Intentamos cargar desde la raíz
            const response = await fetch("families.json"); 
            const data = await response.json();
            if (data.families && data.families.length > 0) {
                shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
                console.log("Familias cargadas:", shuffledFamilies.length);
            } else {
                throw new Error("El JSON está vacío");
            }
        } catch (error) {
            console.error("Error crítico:", error);
            statusMessage.innerText = "⚠️ Error de conexión con la base de datos.";
        }
    }
    loadFamilies();

    // 2. CAPTURA DE FOTO
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block";
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
                statusMessage.innerText = "✅ Foto lista.";
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. BOTÓN CONTINUAR (Manejador único para evitar fallos en móvil)
    continueBtn.onclick = (e) => {
        e.preventDefault();
        
        // Verificación de seguridad
        if (shuffledFamilies.length === 0) {
            statusMessage.innerText = "⏳ Cargando base de datos, espere un segundo...";
            loadFamilies(); // Reintento de carga
            return;
        }

        statusMessage.innerText = "🧠 Analizando rasgos faciales...";
        sessionStorage.setItem("selfie", capturedImage);

        setTimeout(() => {
            showPrediction();
        }, 1200);
    };

    // 4. LÓGICA DE LAS FAMILIAS Y EL TERCERO BLOQUEADO
    function showPrediction() {
        const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
        
        // CASO ESPECIAL: 3ª posición (índice 2)
        if (currentIndex === 2) {
            modalText.innerHTML = `
                <b style="color:red">ACCESO RESTRINGIDO</b><br><br>
                Identificados como: <b>${family.display_name}</b>.<br><br>
                Su acceso requiere aprobación manual del administrador.
            `;
            confirmYes.innerText = "Solicitar Acceso";
            confirmNo.style.display = "none";

            confirmYes.onclick = () => {
                familyModal.classList.add("hidden");
                statusMessage.innerHTML = "⏳ <span style='color:orange'>Esperando respuesta del administrador...</span>";
                
                // Guardamos la familia para la trivia
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                
                // Bucle de escucha al admin
                const checkAdmin = setInterval(() => {
                    if (localStorage.getItem("adminApproval") === "true") {
                        clearInterval(checkAdmin);
                        localStorage.removeItem("adminApproval");
                        window.location.href = "trivia.html";
                    }
                }, 2000);
            };
        } else {
            // Caso Normal
            confirmNo.style.display = "inline-block";
            confirmYes.innerText = "✅ Sí";
            confirmNo.innerText = "❌ No";
            modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;

            confirmYes.onclick = () => {
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                window.location.href = "trivia.html";
            };

            confirmNo.onclick = () => {
                familyModal.classList.add("hidden");
                currentIndex++;
                statusMessage.innerText = "Buscando otra coincidencia...";
                setTimeout(showPrediction, 600);
            };
        }
        familyModal.classList.remove("hidden");
    }
});