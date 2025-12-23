const photoBtn = document.getElementById('photoBtn');
const cameraInput = document.getElementById('cameraInput');
const preview = document.getElementById('preview');
const continueBtn = document.getElementById('continueBtn');
const loader = document.getElementById('loader');
const photoInstruction = document.getElementById('photoInstruction');

let currentStage = 0; // 0 = uvas, 1 = celebracion
let capturedFile = null;

const stages = [
  {text:"Por favor, hagan una foto comiéndose las uvas.", type:"uvas"},
  {text:"¡Fantástico! Ahora celebren y hagan otra foto de celebración.", type:"celebracion"}
];

const family = "Alexandra"; // Reemplazar dinámicamente con la familia actual

photoBtn.addEventListener('click', () => cameraInput.click());

cameraInput.addEventListener('change', () => {
  const file = cameraInput.files[0];
  if (!file) return;
  capturedFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = 'block';
    continueBtn.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

continueBtn.addEventListener('click', async () => {
  if (!capturedFile) return;
  continueBtn.disabled = true;
  loader.style.display = 'block';

  const formData = new FormData();
  formData.append('file', capturedFile);
  formData.append('family', family);
  formData.append('photo_type', stages[currentStage].type);

  try {
    const response = await fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    loader.innerText = data.message || '📤 Foto subida correctamente';

    currentStage++;
    if (currentStage < stages.length) {
      photoInstruction.innerText = stages[currentStage].text;
      preview.style.display = 'none';
      continueBtn.style.display = 'none';
      capturedFile = null;
      continueBtn.disabled = false;
      loader.style.display = 'none';
    } else {
      loader.innerText = '🎉 ¡Todas las fotos capturadas!';
      photoBtn.style.display = 'none';
      continueBtn.style.display = 'none';
    }
  } catch (error) {
    loader.innerText = '❌ Error al subir la foto';
    continueBtn.disabled = false;
  }
});

