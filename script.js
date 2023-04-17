const darkModeBtn = document.getElementById('dark-mode-btn');
const body = document.body;

darkModeBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
});



let checkbox8Bit = document.getElementById("8Bit");
let selectPaletteMethod = document.getElementById("paletteMethod");

checkbox8Bit.addEventListener("change", function() {
    if (this.checked) {
        selectPaletteMethod.removeAttribute("disabled");
    } else {
        selectPaletteMethod.setAttribute("disabled", "");
    }
});

const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const cropButton = document.getElementById('cropButton');
// Create a new Cropper instance
var cropper = new Cropper(canvas, {
	viewMode: 2,
	dragMode: "move",
	toggleDragModeOnDblclick: true,
	movable: true,
	responsive: true,
	autoCropArea: 1,
	aspectRatio: 16 / 9,
	minCropBoxWidth: 200,
	minCropBoxHeight: 200,

});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const img = await loadImage(URL.createObjectURL(file));
    cropper.replace(URL.createObjectURL(file));
});

cropButton.addEventListener('click', () => {
    cropper.getCroppedCanvas().toBlob((blob) => {
        const zip = new JSZip();
        const numRows = 3;
        const numCols = 4;
        const maxWidth = cropper.getCroppedCanvas().width;
        const maxHeight = cropper.getCroppedCanvas().height;
        const sectionWidth = Math.min(Math.ceil(maxWidth / numCols), maxWidth);
        const sectionHeight = Math.min(Math.ceil(maxHeight / numRows), maxHeight);
        const totalWidth = sectionWidth * numCols;
        const totalHeight = sectionHeight * numRows;
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        ctx.drawImage(cropper.getCroppedCanvas(), 0, 0, totalWidth, totalHeight);
        addImageToZip(zip, numRows, numCols, sectionWidth, sectionHeight);
        zip.generateAsync({type: 'blob'}).then((content) => {
            saveAs(content, 'squares.zip');
        });
    });
});

function drawImageOnCanvas(img) {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
}

function addImageToZip(zip, numRows, numCols, sectionWidth, sectionHeight) {
  for (let j = 0; j < numRows; j++) {
      for (let i = 0; i < numCols; i++) {
          const imageData = ctx.getImageData(i * sectionWidth,
              j * sectionHeight,
              sectionWidth,
              sectionHeight);
          const bmpData = imageDataToBMP(imageData);
          zip.file(`t_¹è°æ${j+1}-${i+1}.bmp`, bmpData);
      }
  }
}
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      drawImageOnCanvas(img);
      resolve(img);
    };
    img.src = src;
  });
}


function imageDataToBMP(imageData) {
		let is8Bit = document.getElementById("8Bit").checked;
    
    const width = imageData.width;
    const height = imageData.height;
    if (is8Bit) {
    		let paletteMethod = document.getElementById("paletteMethod").value;
        const rowBytes = width + (width % 4 ? 4 - width % 4 : 0);
        const fileSize = 54 + rowBytes * height + 1024;
        const colorTableSize = 256;

        let offset = 0;
        let buffer = new ArrayBuffer(fileSize);
        let dataView = new DataView(buffer);

        dataView.setUint8(offset++, 0x42);
        dataView.setUint8(offset++, 0x4D);
        dataView.setUint32(offset, fileSize, true); offset += 4;
        offset += 4; // reserved
        dataView.setUint32(offset, 54 + 1024, true); offset += 4;
        dataView.setUint32(offset, 40, true); offset += 4;
        dataView.setInt32(offset, width, true); offset += 4;
        dataView.setInt32(offset, height, true); offset += 4;
        dataView.setUint16(offset, 1, true); offset += 2;
        dataView.setUint16(offset, 8, true); offset += 2;
        offset += 24;

        let colorTable;
        if (paletteMethod === "kmeans") {
          colorTable = kmeans(imageData, colorTableSize);
        } else if (paletteMethod === "medianCut") {
          colorTable = medianCut(imageData, colorTableSize);
        } else if (paletteMethod === "popularityQuantization") {
          colorTable = popularityQuantization(imageData, colorTableSize);
        }

        for (let i = 0; i < colorTable.length; i++) {
            dataView.setUint8(offset++, colorTable[i][2]);
            dataView.setUint8(offset++, colorTable[i][1]);
            dataView.setUint8(offset++, colorTable[i][0]);
            dataView.setUint8(offset++, 0);
        }

        for (let y = height -1; y >=0 ; y--) {
            for (let x = 0; x < width; x++) {
                let index = (y * width + x) * 4;
                let r = imageData.data[index];
                let g = imageData.data[index +1];
                let b = imageData.data[index +2];
                let colorIndex = nearestColorIndex(colorTable, r, g, b);
                dataView.setUint8(offset++, colorIndex);
            }
            offset += rowBytes - width;
    }
    
    return buffer;
    } else {
    const rowBytes = width * 3 + (width * 3 % 4 ? 4 - width * 3 % 4 : 0);
    const fileSize = 54 + rowBytes * height;
    let offset = 0;
    let buffer = new ArrayBuffer(fileSize);
    let dataView = new DataView(buffer);
    dataView.setUint8(offset++, 0x42);
    dataView.setUint8(offset++, 0x4D);
    dataView.setUint32(offset, fileSize, true);
    offset += 4;
    offset += 4; // reserved
    dataView.setUint32(offset, 54, true);
    offset += 4;
    dataView.setUint32(offset, 40, true);
    offset += 4;
    dataView.setInt32(offset, width, true);
    offset += 4;
    dataView.setInt32(offset, height, true);
    offset += 4;
    dataView.setUint16(offset, 1, true);
    offset += 2;
    dataView.setUint16(offset, 24, true);
    offset += 2;
    offset += 24;

    for (let y = height -1; y >=0 ; y--) {
        for (let x = 0; x < width; x++) {
            let index = (y * width + x) * 4;
            let r = imageData.data[index];
            let g = imageData.data[index +1];
            let b = imageData.data[index +2];
            dataView.setUint8(offset++, b);
            dataView.setUint8(offset++, g);
            dataView.setUint8(offset++, r);
        }
        offset += rowBytes - width * 3;
    }
    
    return buffer;
}
}

function medianCut(imageData, colorCount) {
    function ColorBox(pixels) {
        this.pixels = pixels;
        this.dimension = 0;
        this.min = [255, 255, 255];
        this.max = [0, 0, 0];
        for (let i = 0; i < pixels.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                if (pixels[i + j] < this.min[j]) {
                    this.min[j] = pixels[i + j];
                }
                if (pixels[i + j] > this.max[j]) {
                    this.max[j] = pixels[i + j];
                }
            }
        }
        let maxRange = 0;
        for (let i = 0; i < 3; i++) {
            if (this.max[i] - this.min[i] > maxRange) {
                maxRange = this.max[i] - this.min[i];
                this.dimension = i;
            }
        }
    }

    ColorBox.prototype.split = function() {
        let pivot = Math.round((this.min[this.dimension] + this.max[this.dimension]) / 2);
        let leftPixels = [];
        let rightPixels = [];
        for (let i = 0; i < this.pixels.length; i += 4) {
            if (this.pixels[i + this.dimension] <= pivot) {
                leftPixels.push(this.pixels[i], this.pixels[i +1], this.pixels[i +2], this.pixels[i +3]);
            } else {
                rightPixels.push(this.pixels[i], this.pixels[i +1], this.pixels[i +2], this.pixels[i +3]);
            }
        }
        return [new ColorBox(leftPixels), new ColorBox(rightPixels)];
    }

    ColorBox.prototype.averageColor = function() {
        let sum = [0, 0, 0];
        for (let i = 0; i < this.pixels.length; i += 4) {
            sum[0] += this.pixels[i];
            sum[1] += this.pixels[i +1];
            sum[2] += this.pixels[i +2];
        }
        let count = this.pixels.length / 4;
        return [Math.round(sum[0] / count), Math.round(sum[1] / count), Math.round(sum[2] / count)];
    }

    let colorBoxes = [new ColorBox(imageData.data)];
    while (colorBoxes.length < colorCount) {
        colorBoxes.sort((a, b) => b.max[b.dimension] - b.min[b.dimension] - a.max[a.dimension] + a.min[a.dimension]);
        let colorBox = colorBoxes.shift();
        let splitBoxes = colorBox.split();
        colorBoxes.push(splitBoxes[0], splitBoxes[1]);
    }
    return colorBoxes.map(colorBox => colorBox.averageColor());
}
    
function nearestColorIndex(colorTable, r, g, b) {
    let minDistance = Infinity;
    let minIndex = -1;
    for (let i = 0; i < colorTable.length; i++) {
        let dr = r - colorTable[i][0];
        let dg = g - colorTable[i][1];
        let db = b - colorTable[i][2];
        let distance = dr * dr + dg * dg + db * db;
        if (distance < minDistance) {
            minDistance = distance;
            minIndex = i;
        }
    }
    return minIndex;
}

function kmeans(imageData, k) {
    // Obtener los datos de color de la imagen
    let pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        pixels.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
    }

    // Inicializar los centroides de manera aleatoria
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }

    let assignments = new Array(pixels.length);
    let oldAssignments = new Array(pixels.length);

    // Iterar hasta que las asignaciones no cambien
    while (!arraysEqual(assignments, oldAssignments)) {
        // Asignar cada pixel al centroide más cercano
        for (let i = 0; i < pixels.length; i++) {
            let minDistance = Infinity;
            for (let j = 0; j < centroids.length; j++) {
                let distance = euclideanDistance(pixels[i], centroids[j]);
                if (distance < minDistance) {
                    minDistance = distance;
                    assignments[i] = j;
                }
            }
        }

        // Recalcular los centroides como el promedio de los píxeles asignados a ellos
        let sums = new Array(k).fill(0).map(() => [0, 0, 0]);
        let counts = new Array(k).fill(0);
        for (let i = 0; i < pixels.length; i++) {
            let centroidIndex = assignments[i];
            sums[centroidIndex][0] += pixels[i][0];
            sums[centroidIndex][1] += pixels[i][1];
            sums[centroidIndex][2] += pixels[i][2];
            counts[centroidIndex]++;
        }
        for (let i = 0; i < centroids.length; i++) {
            if (counts[i] > 0) {
                centroids[i] = [
                    Math.round(sums[i][0] / counts[i]),
                    Math.round(sums[i][1] / counts[i]),
                    Math.round(sums[i][2] / counts[i])
                ];
            }
        }

        // Guardar las asignaciones antiguas
        oldAssignments = assignments.slice();
    }

    return centroids;
}

function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function popularityQuantization(imageData, k) {
    // Obtener los datos de color de la imagen
    let pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        pixels.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
    }

    // Contar la frecuencia de cada color
    let colorCounts = {};
    for (let i = 0; i < pixels.length; i++) {
        let color = pixels[i].join(",");
        if (colorCounts[color]) {
            colorCounts[color]++;
        } else {
            colorCounts[color] = 1;
        }
    }

    // Ordenar los colores por frecuencia
    let sortedColors = Object.keys(colorCounts).sort(function(a, b) {
        return colorCounts[b] - colorCounts[a];
    });

    // Seleccionar los k colores más frecuentes
    let colorTable = [];
    for (let i = 0; i < k; i++) {
        if (sortedColors[i]) {
            colorTable.push(sortedColors[i].split(",").map(function(x) { return parseInt(x); }));
        }
    }

    return colorTable;
}


document.getElementById('aspectRatio169').addEventListener('click', () => {
    cropper.setAspectRatio(16 / 9);
});

document.getElementById('aspectRatio43').addEventListener('click', () => {
    cropper.setAspectRatio(4 / 3);
});

document.getElementById('aspectRatio11').addEventListener('click', () => {
    cropper.setAspectRatio(1);
});

document.getElementById('aspectRatioFree').addEventListener('click', () => {
    cropper.setAspectRatio(NaN);
});

document.getElementById('reset').addEventListener('click', () => {
    cropper.reset();
});

