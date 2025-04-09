const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const isDarkMode = darkModeMediaQuery.matches;

const darkModeBtn = document.getElementById('dark-mode-btn');
const body = document.body;

if (isDarkMode) {
  body.classList.add('dark-mode');
  darkModeBtn.textContent = 'White Mode';
} else {
  body.classList.remove('dark-mode');
  darkModeBtn.textContent = 'Dark Mode';
}

const outputFormatSelect = document.getElementById('outputFormat');
const bitContainer = document.getElementById('BitContainer');

function handleOutputFormatChange() {
  const isTLoginFormat = outputFormatSelect.value === 't_login';

  // Ocultar o mostrar el contenedor del checkbox8Bit y selectPaletteMethod
  if (isTLoginFormat) {
    bitContainer.style.display = 'none';
    selectPaletteMethod.style.display = 'none';
  } else {
    bitContainer.style.display = 'flex';
    selectPaletteMethod.style.display = checkbox8Bit.checked ? 'block' : 'none';
  }

  // Deshabilitar o habilitar el selectPaletteMethod según el estado del checkbox8Bit
  selectPaletteMethod.disabled = isTLoginFormat || !checkbox8Bit.checked;
}

outputFormatSelect.addEventListener('change', handleOutputFormatChange);

// Ejecutar al cargar la página para establecer el estado inicial
document.addEventListener('DOMContentLoaded', handleOutputFormatChange);

const handleDarkModeChange = (e) => {
  const isDarkMode = e.matches;
  if (isDarkMode) {
    body.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode');
  }
};

darkModeMediaQuery.addEventListener('change', handleDarkModeChange);

darkModeBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  if (body.classList.contains('dark-mode')) {
    darkModeBtn.textContent = 'White Mode';
  } else {
    darkModeBtn.textContent = 'Dark Mode';
  }
});

let checkbox8Bit = document.getElementById("8Bit");
let selectPaletteMethod = document.getElementById("paletteMethod");

checkbox8Bit.addEventListener("change", function() {
    if (this.checked) {
        selectPaletteMethod.removeAttribute("disabled");
        selectPaletteMethod.style.display = "block";
    } else {
        selectPaletteMethod.setAttribute("disabled", "");
        selectPaletteMethod.style.display = "none";
    }
});

const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dropZone = document.getElementById('dropZone');
const container = document.getElementById('container');
const cropButton = document.getElementById('cropButton');

// Eliminar la inicialización inicial del cropper
let cropper = null;
let originalImageWidth = 0;
let originalImageHeight = 0;

function drawImageOnCanvas(img) {
  // Calcular el espacio disponible basado en el contenedor
  const parentElement = document.querySelector('.flex-1.relative');
  const containerRect = parentElement.getBoundingClientRect();
  
  // Usar dimensiones del contenedor para calcular el máximo tamaño
  const maxWidth = containerRect.width * 0.95; // 95% del ancho del contenedor
  const maxHeight = containerRect.height * 0.95; // 95% del alto del contenedor
  
  // Calcular las proporciones
  let width = img.width;
  let height = img.height;
  
  // Redimensionar manteniendo la proporción
  const ratioW = maxWidth / width;
  const ratioH = maxHeight / height;
  const ratio = Math.min(ratioW, ratioH);
  
  // Aplicar el ratio para mantener la proporción
  width = Math.floor(width * ratio);
  height = Math.floor(height * ratio);
  
  // Establecer el tamaño del canvas
  canvas.width = width;
  canvas.height = height;
  
  // Dibujar la imagen
  ctx.drawImage(img, 0, 0, width, height);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Guardar las dimensiones originales
      originalImageWidth = img.naturalWidth;
      originalImageHeight = img.naturalHeight;
      console.log(`Cargando imagen con dimensiones: ${originalImageWidth}x${originalImageHeight}`);
      
      drawImageOnCanvas(img);
      
      // Si ya existe un cropper, destruirlo
      if (cropper) {
        cropper.destroy();
      }
      
      // Crear nuevo cropper con opciones simplificadas
      cropper = new Cropper(canvas, {
        viewMode: 1,
        dragMode: 'move',
        aspectRatio: NaN, // Sin relación de aspecto fija
        autoCropArea: 1, // Cubrir toda la imagen inicialmente
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: true,
        ready: function() {
          // Este evento ocurre cuando el cropper está completamente inicializado
          // No hacemos nada especial aquí, solo dejamos que cropper maneje el estado inicial
          console.log("Cropper inicializado correctamente");
        }
      });
      
      resolve(img);
    };
    img.src = src;
  });
}

async function handleImageLoad(file) {
  if (!file.type.startsWith('image/')) {
    alert("Por favor, selecciona un archivo de imagen.");
    return;
  }

  try {
    const imgUrl = URL.createObjectURL(file);
    
    // Transición suave del dropZone al container
    // 1. Agregar clase para desvanecer el dropZone
    dropZone.classList.add('fade-out');
    
    // 2. Mostrar el container pero con opacidad 0
    container.classList.remove('hidden');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.width = '100%';
    container.style.height = '100%';
    
    // 3. Esperar un momento para la transición
    setTimeout(() => {
      // 4. Ocultar completamente el dropZone
      dropZone.style.visibility = 'hidden';
      dropZone.style.display = 'none';
      dropZone.style.pointerEvents = 'none';
      
      // 5. Mostrar el container con una transición de opacidad
      container.classList.add('fade-in');
    }, 300);
    
    // Cargar la imagen
    await loadImage(imgUrl);
    
  } catch (error) {
    console.error("Error al cargar la imagen:", error);
    alert("Hubo un error al cargar la imagen. Por favor, inténtalo de nuevo.");
  }
}

cropButton.addEventListener('click', () => {
    const outputFormat = outputFormatSelect.value;
    
    // Obtener los datos actuales del recorte y la imagen
    const cropData = cropper.getData(true); // Usar true para obtener valores enteros
    const imageData = cropper.getImageData();
    const canvasData = cropper.getCanvasData();
    
    // Calcular la proporción entre la imagen mostrada y la original
    const scaleX = originalImageWidth / imageData.naturalWidth;
    const scaleY = originalImageHeight / imageData.naturalHeight;
    
    // Verificar si el área seleccionada es aproximadamente toda la imagen
    const isFullSelection = 
      Math.abs(cropData.width - imageData.naturalWidth) < 10 && 
      Math.abs(cropData.height - imageData.naturalHeight) < 10;
    
    // Mostrar información de debug
    console.log(`Dimensiones originales: ${originalImageWidth}x${originalImageHeight}`);
    console.log(`Dimensiones naturales de la imagen: ${imageData.naturalWidth}x${imageData.naturalHeight}`);
    console.log(`Área seleccionada: ${cropData.width}x${cropData.height}`);
    
    // Determinar las dimensiones finales
    let finalWidth, finalHeight;
    
    if (isFullSelection) {
      // Si se seleccionó toda la imagen, usar las dimensiones originales exactas
      console.log("Se detectó selección de imagen completa - usando dimensiones originales");
      finalWidth = originalImageWidth;
      finalHeight = originalImageHeight;
    } else {
      // Si se seleccionó un área específica, escalar proporcionalmente
      finalWidth = Math.round(cropData.width * scaleX);
      finalHeight = Math.round(cropData.height * scaleY);
      console.log(`Dimensiones calculadas del recorte: ${finalWidth}x${finalHeight}`);
    }
    
    // Opciones para generar el canvas final
    const cropOptions = {
      width: finalWidth,
      height: finalHeight,
      imageSmoothingEnabled: false // Evitar suavizado para mantener nitidez
    };
    
    if (outputFormat === 't_login') {
      // Generar la imagen y guardarla en formato JPEG
      const croppedCanvas = cropper.getCroppedCanvas(cropOptions);
      console.log(`Dimensiones finales del canvas: ${croppedCanvas.width}x${croppedCanvas.height}`);
      
      croppedCanvas.toBlob((blob) => {
        saveAs(blob, 't_login.jpg');
      }, 'image/jpeg', 1.0);
    } else {
      // Para BMP, generar la imagen y dividirla en secciones
      const croppedCanvas = cropper.getCroppedCanvas(cropOptions);
      console.log(`Dimensiones finales del canvas para BMP: ${croppedCanvas.width}x${croppedCanvas.height}`);
      
      croppedCanvas.toBlob((blob) => {
        const zip = new JSZip();
        const numRows = 3;
        const numCols = 4;
        const maxWidth = croppedCanvas.width;
        const maxHeight = croppedCanvas.height;
        const sectionWidth = Math.floor(maxWidth / numCols);
        const sectionHeight = Math.floor(maxHeight / numRows);
        const totalWidth = sectionWidth * numCols;
        const totalHeight = sectionHeight * numRows;
        
        // Usar el canvas global para crear secciones
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        ctx.drawImage(croppedCanvas, 0, 0, totalWidth, totalHeight);
        addImageToZip(zip, numRows, numCols, sectionWidth, sectionHeight);
        zip.generateAsync({type: 'blob'}).then((content) => {
          saveAs(content, 'squares.zip');
        });
      });
    }
  });

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
    // Eliminar cualquier relación de aspecto fija
    cropper.setAspectRatio(NaN);
});

// Drag and Drop Functionality
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('highlight');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('highlight');
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('highlight');

  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('image/')) {
      await handleImageLoad(file);
    }
  }
});

dropZone.addEventListener('click', () => {
  imageInput.click();
});


imageInput.addEventListener('change', async (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    await handleImageLoad(file);
  }
});

document.addEventListener('paste', async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      event.preventDefault();
      const blob = item.getAsFile();
      await handleImageLoad(blob);
      break;
    }
  }
});

// Añadir la función resetUI después de la función handleImageLoad
function resetUI() {
  // Si hay un cropper activo, destruirlo
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  
  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Ocultar el container con transición
  container.classList.remove('fade-in');
  
  setTimeout(() => {
    // Ocultar completamente el container
    container.classList.add('hidden');
    container.style.display = 'none';
    
    // Mostrar el dropZone con transición
    dropZone.style.visibility = 'visible';
    dropZone.style.display = 'flex';
    dropZone.style.pointerEvents = 'auto';
    
    // Eliminar la clase fade-out después de mostrar
    setTimeout(() => {
      dropZone.classList.remove('fade-out');
    }, 50);
  }, 300);
}

// Reemplazar el event listener existente para el botón reset
document.getElementById('reset').addEventListener('click', () => {
  if (cropper && container.style.display !== 'none' && !container.classList.contains('hidden')) {
    // Si el cropper está activo y visible, simplemente lo reseteamos
    cropper.reset();
    
    // También aseguramos que no haya relación de aspecto forzada
    cropper.setAspectRatio(NaN);
  } else {
    // Si no hay cropper activo o está oculto, resetear toda la UI
    resetUI();
  }
});