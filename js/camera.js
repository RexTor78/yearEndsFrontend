document.addEventListener("DOMContentLoaded", async () => {
    const cameraInput = document.getElementById("cameraInput");
    const preview = document.getElementById("preview");
    const continueBtn = document.getElementById("continueBtn");
    const statusMessage = document.getElementById("statusMessage");
    const familyModal = document.getElementById("familyModal");
    const modalText = document.getElementById("modalText");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    const suspiciousModal = document.getElementById("suspiciousModal");
    const suspiciousImage = document.getElementById("suspiciousImage");
    const suspiciousText = document.getElementById("suspiciousText");
    
    let shuffledFamilies = [];
    let currentIndex = 0;
    let capturedImage = null;

 
    try {
        const response = await fetch("./families.json");
        const data = await response.json();
        shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
    } catch (e) { console.error("Error al cargar JSON"); }

  
    cameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = "block";
                continueBtn.classList.remove("hidden");
                capturedImage = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    continueBtn.onclick = () => {
        statusMessage.innerText = "🧠 Analizando rasgos faciales...";
        setTimeout(showPrediction, 1200);
    };

    function showPrediction() {
        const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
        let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

      
        if (ordenLlegada === 3) {
            confirmNo.style.display = "none";
            confirmYes.innerText = "Solicitar Permiso";
            modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Son la 3ª familia. Esperen aprobación del administrador.`;
            confirmYes.onclick = () => {
                familyModal.classList.add("hidden");
                statusMessage.innerHTML = "<div class='banner-wait'>⏳ Esperando al administrador...</div>";
                escucharAdmin(family);
            };
        } else {
         
            confirmNo.style.display = "inline-block";
            confirmYes.innerText = "✅ Sí";
            modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;

            confirmYes.onclick = () => {
                procesarConfirmacion(family);
            };

            confirmNo.onclick = () => {
                familyModal.classList.add("hidden");
                currentIndex++;
                setTimeout(showPrediction, 500);
            };
        }
        familyModal.classList.remove("hidden");
    }

    function procesarConfirmacion(family) {
        familyModal.classList.add("hidden");

        if (family.id === "CanTallaAtalaya") {
            suspiciousImage.style.display = "none"; // No necesitamos foto aquí
            suspiciousText.innerHTML = `
                <div style="text-align:left; border-left: 4px solid gold; padding-left: 10px;">
                Se les ha concedido acceso a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>.<br><br>
                Para su seguridad y la de todos, tengan en cuenta que <b>serán vigilados</b>.
                </div>
            `;
            const retryBtn = document.getElementById("retryBtn");
            const excludeBtn = document.getElementById("excludeBtn");
            
            retryBtn.innerText = "Entendido";
            excludeBtn.classList.add("hidden"); // Ocultamos el botón de excluir para Atalaya

            suspiciousModal.classList.remove("hidden");
            retryBtn.onclick = () => finalizarTodo(family);
            return;
        }

        const sospechoso = family.members.find(m => m.sospechoso === true);
        if (sospechoso) {
            suspiciousImage.src = sospechoso.photo;
            suspiciousImage.style.display = "block";
            suspiciousText.innerHTML = `⚠️ Detectado integrante no reconocido: <b>${sospechoso.name}</b>.`;
            
            document.getElementById("retryBtn").innerText = "📸 Reintentar";
            document.getElementById("excludeBtn").classList.remove("hidden");
            
            suspiciousModal.classList.remove("hidden");

            document.getElementById("retryBtn").onclick = () => {
                suspiciousModal.classList.add("hidden");
                statusMessage.innerText = "Reintentando análisis...";
                setTimeout(() => finalizarTodo(family), 1500);
            };
            document.getElementById("excludeBtn").onclick = () => finalizarTodo(family);
        } else {
            
            finalizarTodo(family);
        }
    }

    function finalizarTodo(family) {
        let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
        localStorage.setItem("contadorLlegada", (orden + 1).toString());
        sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
        window.location.href = "pages/trivia.html";
    }

    function escucharAdmin(family) {
        const interval = setInterval(() => {
            if (localStorage.getItem("adminApproval") === "true") {
                clearInterval(interval);
                localStorage.removeItem("adminApproval");
                procesarConfirmacion(family); // Al aprobar admin, pasamos por los filtros de Atalaya/Sospechoso
            }
        }, 2000);
    }
});