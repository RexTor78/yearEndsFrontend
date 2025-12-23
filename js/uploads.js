continueBtn.onclick = async () => {
  const formData = new FormData();
  formData.append("file", capturedFile);
  formData.append("family", "unknown");
  formData.append("photo_type", "selfies");

  const res = await fetch("http://127.0.0.1:8000/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
document.getElementById("status").innerText = data.message;

// Guardamos estado mínimo
localStorage.setItem("familyCandidate", "Alexandra");

// Pasar a confirmación
setTimeout(() => {
  window.location.href = "confirm.html";
}, 800);

};
