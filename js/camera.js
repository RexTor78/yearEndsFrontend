document.addEventListener("DOMContentLoaded", async () => {
    const cameraInput = document.getElementById("cameraInput");
    const preview = document.getElementById("preview");
    const continueBtn = document.getElementById("continueBtn");
    const statusMessage = document.getElementById("statusMessage");
    const familyModal = document.getElementById("familyModal");
    const modalText = document.getElementById("modalText");

    let shuffledFamilies = [];
    let currentIndex = 0;
    let capturedImage = null;

    // 1. Cargar JSON desde la raíz (el JS está en /js/)
    try {
        const response = await fetch("./families.json");
        const data = await response.json();
        shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
    } catch (e) { console.error("Error cargando familias"); }

    // 2. Previsualización (CORREGIDO)
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block"; // Esto hace que se vea
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Botón Continuar
    continueBtn.onclick = () => {
        statusMessage.innerText = "🧠 Analizando rasgos...";
        setTimeout(showPrediction, 1200);
    };

    function showPrediction() {
        const family = shuffledFamilies[currentIndex % shuffledFamilies.length];

        // BLOQUEO SOLO EN LA 3ª FAMILIA (Índice 2)
        if (currentIndex === 2) {
            modalText.innerHTML = `
                <div id="adminBanner" style="background: #b91c1c; color: white; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                    ⚠️ ACCESO BLOQUEADO
                </div>
                Identificados como: <b>${family.display_name}</b>.<br><br>
                Requiere permiso del administrador para continuar.
            `;
            document.getElementById("confirmNo").style.display = "none";
            document.getElementById("confirmYes").innerText = "Solicitar Permiso";

            document.getElementById("confirmYes").onclick = () => {
                statusMessage.innerHTML = "<span style='color:orange; font-weight:bold;'>⏳ Esperando al administrador...</span>";
                familyModal.classList.add("hidden");
                escucharAdmin();
            };
        } else {
            // Familias normales
            document.getElementById("confirmNo").style.display = "inline-block";
            document.getElementById("confirmYes").innerText = "✅ Sí";
            modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;

            document.getElementById("confirmYes").onclick = () => {
                sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
                window.location.href = "pages/trivia.html"; // Ruta a la carpeta pages
            };

            document.getElementById("confirmNo").onclick = () => {
                familyModal.classList.add("hidden");
                currentIndex++;
                setTimeout(showPrediction, 500);
            };
        }
        familyModal.classList.remove("hidden");
    }

    function escucharAdmin() {
        const interval = setInterval(() => {
            if (localStorage.getItem("adminApproval") === "true") {
                clearInterval(interval);
                localStorage.removeItem("adminApproval");
                statusMessage.innerHTML = "<span style='color:green; font-weight:bold;'>✅ PERMISO CONCEDIDO</span>";
                setTimeout(() => { window.location.href = "pages/trivia.html"; }, 1500);
            }
        }, 2000);
    }
});