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
const noiseCheckboxContainer = document.getElementById('noiseCheckboxContainer');
const methodInfoBtn = document.getElementById('methodInfoBtn');

function handleOutputFormatChange() {
  const isTLoginFormat = outputFormatSelect.value === 't_login';
  const isBmpFormat = !isTLoginFormat; // BMP is the only other option
  const is8BitChecked = checkbox8Bit.checked;

  // Controlar visibilidad de BitContainer (Shown only for BMP)
  if (isBmpFormat) {
    bitContainer.classList.add('visible');
  } else {
    bitContainer.classList.remove('visible');
  }

  // Controlar visibilidad de Noise Checkbox and Method Info Button (Shown only for BMP)
  if (isBmpFormat) {
    noiseCheckboxContainer.classList.remove('hidden'); // Use remove/add hidden class
    methodInfoBtn.classList.remove('hidden');
  } else {
    noiseCheckboxContainer.classList.add('hidden');
    methodInfoBtn.classList.add('hidden');
    addNoiseCheckbox.checked = false; // Uncheck noise if switching away from BMP
  }

  // Controlar visibilidad y estado de selectPaletteMethod
  // Solo debe ser visible y habilitado si es BMP Y el checkbox 8Bit está marcado
  if (isBmpFormat && is8BitChecked) {
    selectPaletteMethod.classList.add('visible');
    selectPaletteMethod.disabled = false;
  } else {
    selectPaletteMethod.classList.remove('visible');
    selectPaletteMethod.disabled = true; // Deshabilitar si está oculto o no es 8-bit BMP
  }
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
let addNoiseCheckbox = document.getElementById("addNoise");

// Variable global para almacenar el blob/archivo de imagen original
let originalImageBlob = null;
// Variable global para el canvas de las guías personalizadas
let guideCanvas = null;

checkbox8Bit.addEventListener("change", function() {
    // Only control the palette method visibility/state here
    const isBmpFormat = outputFormatSelect.value === 'bmp';

    if (this.checked && isBmpFormat) { // Enable/show palette only if 8bit AND BMP
        selectPaletteMethod.removeAttribute("disabled");
        selectPaletteMethod.classList.add('visible'); // Mostrar con transición
    } else {
        selectPaletteMethod.setAttribute("disabled", "");
        selectPaletteMethod.classList.remove('visible'); // Ocultar con transición
    }

    // Call handleOutputFormatChange to ensure consistent state for all elements
    // handleOutputFormatChange(); // Re-evaluate visibility of everything
    // No, calling handleOutputFormatChange is redundant here as it doesn't depend on checkbox state for noise/info btn
    // The only thing changing based *only* on the checkbox is the palette method selector.
});

const imageInput = document.getElementById('imageInput');
// Get the new image element instead of canvas
const imageToCrop = document.getElementById('imageToCrop');
// Remove canvas and context
// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d', { willReadFrequently: true });
const dropZone = document.getElementById('dropZone');
const container = document.getElementById('container');
const cropButton = document.getElementById('cropButton');

// Eliminar la inicialización inicial del cropper
let cropper = null;
let originalImageWidth = 0;
let originalImageHeight = 0;

// Remove loadImageAndDraw and drawImageOnCanvas as Cropper will handle the image directly
/*
function loadImageAndDraw(src) {
    // Devolver una promesa que se resuelve cuando la imagen está cargada Y dibujada
    return new Promise((resolve, reject) => { // Añadir reject para manejo de errores
        const img = new Image();
        img.onload = () => {
            // Guardar las dimensiones originales
            originalImageWidth = img.naturalWidth;
            originalImageHeight = img.naturalHeight;
            // Dibujar la imagen escalada en el canvas
            drawImageOnCanvas(img);

            // Resolver la promesa una vez dibujada
            resolve(img); // Se puede resolver con la imagen si es necesario después
        };
        img.onerror = (err) => { // Manejar errores de carga de imagen
            reject(new Error("No se pudo cargar la imagen desde la fuente proporcionada."));
        };
        img.src = src;
    });
}

function drawImageOnCanvas(img) {
  // Calcular el espacio disponible basado en el contenedor
  const parentElement = document.querySelector('.flex-1.relative');
  const containerRect = parentElement.getBoundingClientRect();

  // Usar dimensiones del contenedor para calcular el máximo tamaño (100%)
  const maxWidth = containerRect.width; // Eliminado * 0.95
  const maxHeight = containerRect.height; // Eliminado * 0.95

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
*/

async function handleImageLoad(file) {
    if (!file.type.startsWith('image/')) {
        return;
    }

    // Guarda el blob/archivo original
    originalImageBlob = file;
    // --- Iniciar transición visual INMEDIATAMENTE ---
    // 1. Agregar clase para desvanecer el dropZone
    dropZone.classList.add('fade-out');

    // 2. Mostrar el container pero con opacidad 0 (para la transición fade-in)
    container.classList.remove('hidden');
    container.style.display = 'flex'; // Keep as flex for centering
    // container.style.alignItems = 'center'; // Already in CSS for #container
    // container.style.justifyContent = 'center'; // Already in CSS for #container
    // container.style.width = '100%'; // Already in CSS
    // container.style.height = '100%'; // Already in CSS

    // 3. Programar el final de la transición del dropZone y el inicio del fade-in del container
    setTimeout(() => {
      // 4. Ocultar completamente el dropZone
      dropZone.style.visibility = 'hidden';
      dropZone.style.display = 'none';
      dropZone.style.pointerEvents = 'none';

      // 5. Mostrar el container con una transición de opacidad
      container.classList.add('fade-in');
    }, 300); // 300ms es la duración de tu transición CSS (ajusta si es diferente)


    // --- Carga y dibujo de imagen (ASÍNCRONO) ---
    try {
        // Revocar URL de objeto anterior si existe para liberar memoria
        // Destruir cropper anterior ANTES de cargar nueva imagen si existe
        if (cropper) {
            if (cropper.url) {
                URL.revokeObjectURL(cropper.url);
            }
            cropper.destroy();
            cropper = null; // Asegurar que se limpia la referencia
        }

        const imgUrl = URL.createObjectURL(file);

        // Esperar a que la imagen *metadatos* se carguen para obtener dimensiones originales
        await new Promise((resolve, reject) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                originalImageWidth = tempImg.naturalWidth;
                originalImageHeight = tempImg.naturalHeight;
                resolve();
            };
            tempImg.onerror = reject;
            tempImg.src = imgUrl; // Use the same URL, it's cached
        });

        // Set the image source and make it visible
        imageToCrop.src = imgUrl;
        imageToCrop.classList.remove('hidden');


        // --- Inicializar Cropper DESPUÉS de establecer el src del <img> ---
        cropper = new Cropper(imageToCrop, {
            viewMode: 1,
            dragMode: 'move',
            aspectRatio: NaN,
            autoCropArea: 1,
            restore: false,
            guides: false, // Mantenemos las guías por defecto desactivadas
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true,
            ready: function () { // Usar el evento ready oficial de Cropper.js
                // Crear y añadir canvas para guías personalizadas AQUÍ
                // Asegurarse de que solo se cree una vez
                if (!document.getElementById('guideCanvas')) {
                    // Intentar encontrar el contenedor que Cropper crea (ahora padre de imageToCrop)
                    const cropperContainer = imageToCrop.parentElement.querySelector('.cropper-container');
                    if (cropperContainer) {
                        guideCanvas = document.createElement('canvas');
                        guideCanvas.id = 'guideCanvas'; // ID para fácil referencia/eliminación
                        // Estilos para superponer el canvas
                        guideCanvas.style.position = 'absolute';
                        guideCanvas.style.top = '0';
                        guideCanvas.style.left = '0';
                        // z-index alto para estar sobre la imagen, pero puede ajustarse
                        // si interfiere con los manejadores del cropper.
                        guideCanvas.style.zIndex = '10';
                        guideCanvas.style.pointerEvents = 'none'; // Ignorar clics/eventos de ratón
                        cropperContainer.appendChild(guideCanvas);

                        // Dibujar guías iniciales ahora que el cropper está listo
                        drawCustomGuides();

                        // Añadir listener para redibujar en cambios futuros (drag, resize)
                        // Listen on the image element itself for crop events
                        imageToCrop.addEventListener('crop', drawCustomGuides);
                    }
                }
            } // Fin del 'ready' callback
        });

    } catch (error) {
        console.error("Error handling image load:", error); // Added detailed logging
        resetUI();
    }
}

// Make the event listener async to handle image loading for the full selection case
cropButton.addEventListener('click', async () => {
    const outputFormat = outputFormatSelect.value;

    if (!cropper) {
        return;
    }

    // Obtener los datos actuales del recorte y la imagen
    const imageData = cropper.getImageData();
    const preciseCropData = cropper.getData();
    const tolerance = 2;

    const coversDisplayedWidth = Math.abs(preciseCropData.width - imageData.naturalWidth) < tolerance;
    const coversDisplayedHeight = Math.abs(preciseCropData.height - imageData.naturalHeight) < tolerance;
    const startsNearOrigin = Math.abs(preciseCropData.x) < tolerance && Math.abs(preciseCropData.y) < tolerance;
    const isFullSelection = coversDisplayedWidth && coversDisplayedHeight && startsNearOrigin;

    // --- Lógica de Salida ---

    if (outputFormat === 't_login') {
        // --- Salida T_LOGIN (JPEG) ---
        if (isFullSelection && originalImageBlob) {
            // Selección completa Y tenemos el blob original: Guardar el original directamente
            try {
                saveAs(originalImageBlob, 't_login.jpg');
            } catch (error) {
                // Fallback a método de canvas si saveAs falla con el blob original
                generateJpegFromCanvas(imageData, preciseCropData, isFullSelection);
            }
        } else {
            // Recorte parcial O no tenemos blob original: Generar desde canvas
            generateJpegFromCanvas(imageData, preciseCropData, isFullSelection);
        }

    } else {
        // --- Salida BMP --- (Siempre se genera desde canvas)
        generateBmpFromCanvas(imageData, preciseCropData, isFullSelection);
    }
});

// --- Funciones auxiliares para generar salida ---

async function generateJpegFromCanvas(imageData, preciseCropData, isFullSelection) {
    let finalCanvas;

    if (isFullSelection) {
        // Recrea el canvas con dimensiones originales si es selección completa (fallback)
        finalCanvas = await createFullCanvasFromCropperSource(); // Usamos función auxiliar
        if (!finalCanvas) return; // Salir si falla la creación
    } else {
        // Calcula dimensiones para recorte parcial
        const scaleX = originalImageWidth / imageData.naturalWidth;
        const scaleY = originalImageHeight / imageData.naturalHeight;
        const finalWidth = Math.round(preciseCropData.width * scaleX);
        const finalHeight = Math.round(preciseCropData.height * scaleY);

        const cropOptions = { width: finalWidth, height: finalHeight, imageSmoothingEnabled: false };
        finalCanvas = cropper.getCroppedCanvas(cropOptions);
        if (Math.abs(finalCanvas.width - finalWidth) > 1 || Math.abs(finalCanvas.height - finalHeight) > 1) {
             console.warn(`Dimensiones del canvas recortado difieren ligeramente de las calculadas.`);
        }
    }

    if (!finalCanvas) {
        return;
    }

    finalCanvas.toBlob((blob) => {
        if (blob) {
            saveAs(blob, 't_login.jpg');
        }
    }, 'image/jpeg', 1.0);
}

async function generateBmpFromCanvas(imageData, preciseCropData, isFullSelection) {
    let finalCanvas;

    if (isFullSelection) {
        // Recrea el canvas con dimensiones originales si es selección completa
        finalCanvas = await createFullCanvasFromCropperSource();
        if (!finalCanvas) return;
    } else {
        // Calcula dimensiones para recorte parcial
        const scaleX = originalImageWidth / imageData.naturalWidth;
        const scaleY = originalImageHeight / imageData.naturalHeight;
        const finalWidth = Math.round(preciseCropData.width * scaleX);
        const finalHeight = Math.round(preciseCropData.height * scaleY);

        const cropOptions = { width: finalWidth, height: finalHeight, imageSmoothingEnabled: true };
        finalCanvas = cropper.getCroppedCanvas(cropOptions);
         if (Math.abs(finalCanvas.width - finalWidth) > 1 || Math.abs(finalCanvas.height - finalHeight) > 1) {
             console.warn(`Dimensiones del canvas recortado difieren ligeramente de las calculadas.`);
        }
    }

     if (!finalCanvas) {
        return;
    }

    // Lógica existente para procesar BMP desde finalCanvas
    finalCanvas.toBlob((blob) => { // No especificar tipo aquí, imageDataToBMP lo hace
         if (!blob) {
             return;
         }
         const zip = new JSZip();
         const numRows = 3;
         const numCols = 4;
         const maxWidth = finalCanvas.width;
         const maxHeight = finalCanvas.height;

         if (maxWidth < numCols || maxHeight < numRows) {
              return;
         }

         const sectionWidth = Math.floor(maxWidth / numCols);
         const sectionHeight = Math.floor(maxHeight / numRows);

         if (sectionWidth <= 0 || sectionHeight <= 0) {
              return;
         }

         const totalWidth = sectionWidth * numCols;
         const totalHeight = sectionHeight * numRows;

         const tempCanvasForBMP = document.createElement('canvas');
         tempCanvasForBMP.width = totalWidth;
         tempCanvasForBMP.height = totalHeight;
         const tempCtxForBMP = tempCanvasForBMP.getContext('2d', { willReadFrequently: true });
         tempCtxForBMP.imageSmoothingEnabled = true;
         tempCtxForBMP.imageSmoothingQuality = 'high';
         tempCtxForBMP.drawImage(finalCanvas, 0, 0, totalWidth, totalHeight, 0, 0, totalWidth, totalHeight);

         addImageToZip(zip, numRows, numCols, sectionWidth, sectionHeight, tempCtxForBMP);

         zip.generateAsync({ type: 'blob' }).then((content) => {
             saveAs(content, 'squares.zip');
         }).catch(err => {
         });
     });
}

// Función auxiliar para crear el canvas de tamaño completo (usada en fallbacks y BMP)
async function createFullCanvasFromCropperSource() {
    if (!cropper || !cropper.url) {
         return null;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = originalImageWidth;
    finalCanvas.height = originalImageHeight;
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';

    const img = new Image();
    img.crossOrigin = 'anonymous';

    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = (err) => reject(new Error(`Error cargando imagen desde ${cropper.url}: ${err.type || 'desconocido'}`));
            img.src = cropper.url;
        });
        finalCtx.drawImage(img, 0, 0, originalImageWidth, originalImageHeight);
        return finalCanvas;
    } catch (error) {
        return null;
    }
}


// Modify addImageToZip to accept the source context
function addImageToZip(zip, numRows, numCols, sectionWidth, sectionHeight, sourceCtx) {
    for (let j = 0; j < numRows; j++) {
        for (let i = 0; i < numCols; i++) {
            try {
                // Create temporary canvas for section processing to maintain quality
                const sectionCanvas = document.createElement('canvas');
                sectionCanvas.width = sectionWidth;
                sectionCanvas.height = sectionHeight;
                const sectionCtx = sectionCanvas.getContext('2d', { willReadFrequently: true });
                
                // Enable image smoothing for better quality
                sectionCtx.imageSmoothingEnabled = true;
                sectionCtx.imageSmoothingQuality = 'high';
                
                // Extract the section from the source context
                const sx = i * sectionWidth;
                const sy = j * sectionHeight;
                
                // Draw this section to the section canvas
                sectionCtx.drawImage(
                    sourceCtx.canvas,
                    sx, sy, sectionWidth, sectionHeight,
                    0, 0, sectionWidth, sectionHeight
                );
                
                // Get image data from the section canvas
                const imageData = sectionCtx.getImageData(0, 0, sectionWidth, sectionHeight);
                
                // Convert to BMP
                const bmpData = imageDataToBMP(imageData);
                zip.file(`t_¹è°æ${j+1}-${i+1}.bmp`, bmpData);
            } catch (error) {
                console.error(`Error processing section [${j+1}-${i+1}]:`, error);
            }
        }
    }
}

// Corregir las importaciones para usar la sintaxis correcta
import medianCut from './medianCut.js';
import kmeans from './kmeans.js';
import popularityQuantization from './popularityQuantization.js';
import neuQuant from './neuquant.js';
import errorDiffusionDithering from './errorDiffusionDithering.js';
import { nearestColorIndex } from './utils.js';

function imageDataToBMP(imageData) {
    let is8Bit = document.getElementById("8Bit").checked;
    const addNoise = document.getElementById("addNoise").checked;
    
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

        // Aplicar cuantificación para obtener la paleta
        let colorTable;
        if (paletteMethod === "kmeans") {
          colorTable = kmeans(imageData, colorTableSize);
        } else if (paletteMethod === "medianCut") {
          colorTable = medianCut(imageData, colorTableSize);
        } else if (paletteMethod === "popularityQuantization") {
          colorTable = popularityQuantization(imageData, colorTableSize);
        } else if (paletteMethod === "neuquant") {
          colorTable = neuQuant(imageData, colorTableSize);
        } else if (paletteMethod === "errorDiffusion") {
          colorTable = errorDiffusionDithering(imageData, colorTableSize);
        }

        // Escribir la tabla de colores en el buffer
        for (let i = 0; i < colorTable.length; i++) {
            dataView.setUint8(offset++, colorTable[i][2]);
            dataView.setUint8(offset++, colorTable[i][1]);
            dataView.setUint8(offset++, colorTable[i][0]);
            dataView.setUint8(offset++, 0);
        }

        // Crear una copia de los datos de la imagen para trabajar con ella
        const imageDataCopy = new Uint8ClampedArray(imageData.data);
        
        // Si se seleccionó la opción de ruido, aplicarlo antes de cuantificar
        if (addNoise) {
            applyNoise(imageDataCopy, width, height, 20); // 20% de intensidad de ruido
        }

        // Procesar los píxeles y escribirlos en el buffer
        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                let index = (y * width + x) * 4;
                let r = imageDataCopy[index];
                let g = imageDataCopy[index + 1];
                let b = imageDataCopy[index + 2];
                let colorIndex = nearestColorIndex(colorTable, r, g, b);
                dataView.setUint8(offset++, colorIndex);
            }
            offset += rowBytes - width;
        }
    
        return buffer;
    } else {
        // Apply noise if checked, even for 24-bit BMP
        const addNoise = document.getElementById("addNoise").checked;
        const width = imageData.width;
        const height = imageData.height;

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
        // Completar correctamente el encabezado de BMP - AÑADIENDO CAMPOS FALTANTES
        dataView.setUint32(offset, 0, true); // Compresión - debe ser 0 para RGB sin comprimir
        offset += 4;
        dataView.setUint32(offset, rowBytes * height, true); // Tamaño de la imagen en bytes
        offset += 4;
        dataView.setInt32(offset, 2835, true); // Resolución horizontal (píxeles por metro) - ~72 DPI
        offset += 4;
        dataView.setInt32(offset, 2835, true); // Resolución vertical (píxeles por metro) - ~72 DPI
        offset += 4;
        dataView.setUint32(offset, 0, true); // Número de colores en la paleta (0 para todos)
        offset += 4;
        dataView.setUint32(offset, 0, true); // Número de colores importantes (0 para todos)
        offset += 4;

        // Crear copia para trabajar con los datos
        const imageDataCopy = new Uint8ClampedArray(imageData.data);
        
        // Apply noise if the checkbox is checked, before writing pixels
        if (addNoise) {
            applyNoise(imageDataCopy, width, height, 20); // Apply 20% noise
        }
        
        // Escribir los datos de los píxeles con el relleno correcto
        const padding = rowBytes - (width * 3);
        
        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                let index = (y * width + x) * 4;
                let r = imageDataCopy[index];
                let g = imageDataCopy[index + 1];
                let b = imageDataCopy[index + 2];
                dataView.setUint8(offset++, b);
                dataView.setUint8(offset++, g);
                dataView.setUint8(offset++, r);
            }
            
            // Agregar bytes de relleno al final de cada fila para cumplir con la alineación de 4 bytes
            for (let p = 0; p < padding; p++) {
                dataView.setUint8(offset++, 0);
            }
        }
        
        return buffer;
    }
}

/**
 * Aplica ruido aleatorio a los datos de imagen
 * @param {Uint8ClampedArray} imageData - Array de datos de imagen
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @param {number} intensity - Intensidad del ruido (0-100)
 */
function applyNoise(imageData, width, height, intensity) {
    // Normalizar intensidad a un valor entre 0 y 1
    const noiseLevel = Math.min(100, Math.max(0, intensity)) / 100;
    
    // Maximum variation in Lightness (L) based on noiseLevel
    // Noise will range from -maxLightnessNoise to +maxLightnessNoise
    const maxLightnessNoise = noiseLevel * 0.5; // e.g., 20% intensity -> noiseLevel 0.2 -> max +/- 0.1 variation in L
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Apply noise to every pixel, but vary the amount
            const index = (y * width + x) * 4;
            
            // Get original RGB
            let r = imageData[index];
            let g = imageData[index + 1];
            let b = imageData[index + 2];
            
            // Convert to HSL
            let [h, s, l] = rgbToHsl(r, g, b);
            
            // Calculate noise amount for this pixel (-max to +max)
            // Using Math.random() * 2 - 1 gives a range from -1 to 1
            const lightnessNoise = (Math.random() * 2 - 1) * maxLightnessNoise;
            
            // Apply noise to Lightness, clamping between 0 and 1
            let noisyL = Math.max(0, Math.min(1, l + lightnessNoise));
            
            // Convert back to RGB (keeping original H and S)
            let [newR, newG, newB] = hslToRgb(h, s, noisyL);
            
            // Update image data
            imageData[index] = newR;
            imageData[index + 1] = newG;
            imageData[index + 2] = newB;
            // No modificar el canal alfa (index + 3)
        }
    }
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

// NUEVA FUNCIÓN para dibujar las guías personalizadas 4x3
function drawCustomGuides() {
    // Usa el ID para obtener el elemento canvas de las guías
    const guideCanvasElement = document.getElementById('guideCanvas');
    // Salir si el cropper o el canvas de guías no están listos
    if (!cropper || !guideCanvasElement || !imageToCrop || !cropper.ready) {
        return;
    }

    const ctx = guideCanvasElement.getContext('2d', { willReadFrequently: true });
    const containerData = cropper.getContainerData(); // Dimensiones del contenedor del cropper
    const cropBoxData = cropper.getCropBoxData(); // Posición y tamaño del área de recorte

    // Ajustar tamaño del canvas de guías al contenedor del cropper
    // Esto asegura que el sistema de coordenadas sea el correcto
    guideCanvasElement.width = containerData.width;
    guideCanvasElement.height = containerData.height;

    // Limpiar el canvas antes de redibujar
    ctx.clearRect(0, 0, guideCanvasElement.width, guideCanvasElement.height);

    // Configuración de las guías (ajusta el estilo como prefieras)
    const numRows = 3; // Número de filas deseadas
    const numCols = 4; // Número de columnas deseadas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // Blanco semi-transparente
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]); // Estilo línea discontinua (ej: 4px linea, 3px espacio)

    // Coordenadas y dimensiones del crop box relativo al contenedor
    const cropX = cropBoxData.left;
    const cropY = cropBoxData.top;
    const cropWidth = cropBoxData.width;
    const cropHeight = cropBoxData.height;

    // Dibujar líneas verticales (numCols - 1 líneas)
    if (cropWidth > 0 && numCols > 1) {
        const colWidth = cropWidth / numCols;
        for (let i = 1; i < numCols; i++) {
            const x = cropX + i * colWidth;
            ctx.beginPath();
            ctx.moveTo(Math.round(x), Math.round(cropY)); // Usar Math.round para líneas más nítidas
            ctx.lineTo(Math.round(x), Math.round(cropY + cropHeight));
            ctx.stroke();
        }
    }

    // Dibujar líneas horizontales (numRows - 1 líneas)
    if (cropHeight > 0 && numRows > 1) {
        const rowHeight = cropHeight / numRows;
        for (let j = 1; j < numRows; j++) {
            const y = cropY + j * rowHeight;
            ctx.beginPath();
            ctx.moveTo(Math.round(cropX), Math.round(y));
            ctx.lineTo(Math.round(cropX + cropWidth), Math.round(y));
            ctx.stroke();
        }
    }

    // Restaurar estilo de línea por defecto
    ctx.setLineDash([]);
}

// Añadir la función resetUI después de la función handleImageLoad
function resetUI() {
  // Si hay un cropper activo, destruirlo
  if (cropper) {
    // Remover listener de guías ANTES de destruir el cropper
    // Listen on imageToCrop now
    if (imageToCrop) {
      imageToCrop.removeEventListener('crop', drawCustomGuides);
    }

    // Revocar URL de objeto antes de destruir
    if (cropper.url) {
        URL.revokeObjectURL(cropper.url);
    }
    cropper.destroy();
    cropper = null;
  }

  // Remover el canvas de guías si existe
  const existingGuideCanvas = document.getElementById('guideCanvas');
  if (existingGuideCanvas) {
    existingGuideCanvas.remove();
    guideCanvas = null; // Resetear la variable global
  }

  // Limpiar el blob almacenado
  originalImageBlob = null;

  // Limpiar y ocultar la imagen
  if (imageToCrop) {
    imageToCrop.src = '';
    imageToCrop.classList.add('hidden');
  }

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

// Inicialización del popup informativo - solo definir variables que aún no existen
const methodInfoPopup = document.getElementById('methodInfoPopup');
const closeInfoPopup = document.getElementById('closeInfoPopup');

// Mostrar popup al hacer clic en el botón de información
methodInfoBtn.addEventListener('click', () => {
  methodInfoPopup.classList.remove('hidden');
});

// Cerrar popup al hacer clic en el botón de cerrar
closeInfoPopup.addEventListener('click', () => {
  methodInfoPopup.classList.add('hidden');
});

// Cerrar popup al hacer clic fuera del contenido
methodInfoPopup.addEventListener('click', (e) => {
  if (e.target === methodInfoPopup) {
    methodInfoPopup.classList.add('hidden');
  }
});

// Cerrar popup con la tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !methodInfoPopup.classList.contains('hidden')) {
    methodInfoPopup.classList.add('hidden');
  }
});

// --- HSL Conversion Helper Functions ---

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}