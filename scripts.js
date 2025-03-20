const canvas = document.getElementById("doodleCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let brushSize = 3;
let brushColor = "black";
let erasing = false;
let fillMode = false;

// Colour swatches
const colors = [
  "black",
  "darkgrey",
  "yellowgreen",
  "gold",
  "mediumorchid",
  "orange",
  "pink",
  "sienna",
  "crimson",
  "dodgerblue",
  "lightblue",
  "darkolivegreen",
];
const colorSwatches = document.getElementById("colorSwatches");

// Create colour swatches
colors.forEach((color) => {
  let swatch = document.createElement("div");
  swatch.classList.add("color-swatch");
  swatch.style.backgroundColor = color;
  swatch.addEventListener("click", () => {
    document
      .querySelectorAll(".color-swatch")
      .forEach((s) => s.classList.remove("selected"));
    swatch.classList.add("selected");
    brushColor = color;
    erasing = false;
    // Only set fillMode to false if the fill tool is not selected
    if (!document.getElementById("fillTool").classList.contains("selected")) {
      fillMode = false;
    }
  });
  colorSwatches.appendChild(swatch);
});

// Select default colour
colorSwatches.children[0].classList.add("selected");

// Select brush size
document.querySelectorAll(".brush-option").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".brush-option")
      .forEach((b) => b.classList.remove("selected"));
    button.classList.add("selected");

    if (button.dataset.size) {
      brushSize = parseInt(button.dataset.size);
      erasing = false;
      fillMode = false; // Ensure fillMode is set to false when selecting a brush size
    }
  });
});

// Eraser
document.getElementById("eraser").addEventListener("click", () => {
  erasing = true;
  fillMode = false;
  brushSize = 15;
  document
    .querySelectorAll(".brush-option")
    .forEach((b) => b.classList.remove("selected"));
  document.getElementById("eraser").classList.add("selected");
});

// Fill Tool
document.getElementById("fillTool").addEventListener("click", () => {
  fillMode = true;
  erasing = false;
  document
    .querySelectorAll(".brush-option")
    .forEach((b) => b.classList.remove("selected"));
  document.getElementById("fillTool").classList.add("selected");
});

// Drawing logic
canvas.addEventListener("mousedown", (e) => {
  if (fillMode) {
    let x = e.offsetX;
    let y = e.offsetY;
    let currentColor = hexToRgb(brushColor); // Always get the latest selected colour
    floodFill(x, y, [currentColor.r, currentColor.g, currentColor.b, 255]);
    return;
  }

  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.strokeStyle = erasing ? "white" : brushColor;
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mouseleave", () => (drawing = false));

// Clear canvas
document.getElementById("clearCanvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Function to get pixel data
function getPixel(imageData, x, y) {
  let index = (y * imageData.width + x) * 4;
  return [
    imageData.data[index], // Red
    imageData.data[index + 1], // Green
    imageData.data[index + 2], // Blue
    imageData.data[index + 3], // Alpha
  ];
}

// Function to set pixel data
function setPixel(imageData, x, y, color) {
  let index = (y * imageData.width + x) * 4;
  imageData.data[index] = color[0]; // Red
  imageData.data[index + 1] = color[1]; // Green
  imageData.data[index + 2] = color[2]; // Blue
  imageData.data[index + 3] = 255; // Alpha
}

// Function to compare colours
function colorsMatch(c1, c2) {
  return (
    c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3]
  );
}

// Flood-fill algorithm
function floodFill(x, y, newColor) {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let targetColor = getPixel(imageData, x, y);

  if (colorsMatch(targetColor, newColor)) return;

  let stack = [[x, y]];

  while (stack.length > 0) {
    let [px, py] = stack.pop();

    if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;
    if (!colorsMatch(getPixel(imageData, px, py), targetColor)) continue;

    setPixel(imageData, px, py, newColor);
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

// Convert hex colour to RGB
function hexToRgb(hex) {
  let temp = document.createElement("div");
  temp.style.color = hex;
  document.body.appendChild(temp);
  let computedColor = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);
  let match = computedColor.match(/\d+/g);
  return {
    r: parseInt(match[0]),
    g: parseInt(match[1]),
    b: parseInt(match[2]),
  };
}

// THE WHOLE UNDO THING
let history = [];
let historyStep = -1;

function saveState() {
  historyStep++;
  if (historyStep < history.length) history.length = historyStep; // Truncate future history
  history.push(canvas.toDataURL());
}

function undo() {
  if (historyStep > 0) {
    historyStep--;
    let canvasPic = new Image();
    canvasPic.src = history[historyStep];
    canvasPic.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvasPic, 0, 0);
    };
  }
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    undo();
  }
});

// Save the initial state
saveState();

// Save state on mouse up and when fill tool is used
canvas.addEventListener("mouseup", saveState);
canvas.removeEventListener("mouseleave", saveState);
document.getElementById("fillTool").addEventListener("click", saveState);
