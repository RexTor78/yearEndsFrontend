const traits = [
  "comportamiento",
  "colaboracion",
  "empatia",
  "rancio",
  "fiestero",
  "alcohol",
  "extra"
];

const slidersDiv = document.getElementById("sliders");

traits.forEach(t => {
  slidersDiv.innerHTML += `
    <label>${t}</label>
    <input type="range" min="0" max="10" value="5" id="${t}">
    <br>
  `;
});

async function saveScores() {
  const family = document.getElementById("familySelect").value;

  for (let t of traits) {
    const value = document.getElementById(t).value;
    await fetch(`http://127.0.0.1:8000/admin/score?family=${family}&field=${t}&value=${value}`, {
      method: "POST"
    });
  }

  alert("Puntuaciones guardadas");
}
