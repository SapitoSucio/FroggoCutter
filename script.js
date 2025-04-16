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
const methodInfoBtn = document.getElementById('methodInfoBtn');

// Get the new noise select dropdown and its container
const noiseControlContainer = document.getElementById('noiseControlContainer');
const noiseLevelSelect = document.getElementById('noiseLevelSelect');

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

  // Controlar visibilidad de Noise Dropdown and Method Info Button (Shown only for BMP)
  if (isBmpFormat) {
    noiseControlContainer.classList.add('visible'); // Use visible class for transition
    methodInfoBtn.classList.remove('hidden'); // Keep using hidden for button
  } else {
    noiseControlContainer.classList.remove('visible'); // Use visible class for transition
    methodInfoBtn.classList.add('hidden'); // Keep using hidden for button
    // Reset noise dropdown when hiding
    noiseLevelSelect.value = '0'; 
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

  // Actualizar visibilidad del aviso de imagen grande
  showLargeImageNoticeIfNeeded();
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

// Variable global para almacenar el blob/archivo de imagen original
let originalImageBlob = null;
// Variable global para el canvas de las guías personalizadas
let guideCanvas = null;
// Variable global para el temporizador del aviso de imagen grande
let noticeHideTimer = null;

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

    // Actualizar visibilidad del aviso de imagen grande
    showLargeImageNoticeIfNeeded();
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

        // Mostrar aviso si la imagen es grande y se cumplen condiciones
        // (Lo hacemos ahora en una función separada para reusabilidad)
        showLargeImageNoticeIfNeeded();

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
                // Habilitar el botón de recorte ahora que el cropper está listo
                cropButton.disabled = false;

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
                
                // Inicializar módulos cuando el cropper está listo
                if (window.initImageAdjustments) {
                    window.initImageAdjustments(cropper);
                }
                
                if (window.initLogoOverlay) {
                    window.initLogoOverlay(cropper);
                }
                
                // Actualizar estado de las guías
                if (window.gridGuides) {
                    const guideCanvas = document.getElementById('guideCanvas');
                    if (guideCanvas) {
                        window.gridGuides.setGuideCanvas(guideCanvas);
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
    // Get text elements
    const cropText = document.getElementById('cropText');
    const loadingText = document.getElementById('loadingText');
    const outputFormat = outputFormatSelect.value;

    // Only apply processing state for BMP format
    if (outputFormat === 'bmp') {
        // --- Start Animation & Disable Button ---
        cropButton.disabled = true; // Disable button immediately
        cropButton.classList.remove('bg-gray-800', 'hover:bg-green-600'); // Remove base colors
        cropButton.classList.add('bg-green-700', 'animate-pulse', 'loading'); // Add loading styles and class
        
        // Show loading text for BMP format
        cropText.classList.add('-translate-y-full', 'opacity-0');
        loadingText.classList.remove('translate-y-full', 'opacity-0');
        loadingText.classList.add('translate-y-0', 'opacity-100');
    }

    // --- Existing Logic ---
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
        // SIEMPRE generar desde canvas para asegurar que es un JPEG real.
        // Eliminamos la condición: if (isFullSelection && originalImageBlob)
        generateJpegFromCanvas(imageData, preciseCropData, isFullSelection);

    } else {
        // --- Salida BMP --- (Siempre se genera desde canvas)
        generateBmpFromCanvas(imageData, preciseCropData, isFullSelection);
    }
});

// --- Funciones auxiliares para generar salida ---

async function generateJpegFromCanvas(imageData, preciseCropData, isFullSelection) {
    let finalCanvas;
    try {
        if (isFullSelection) {
            finalCanvas = await createFullCanvasFromCropperSource();
        } else {
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
            throw new Error("Failed to create final canvas for JPEG.");
        }

        // --- Apply Image Adjustments ---
        const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
        if (!imageAdjuster.isNeutral()) {
            console.log("Applying adjustments to JPEG...");
            try {
                let imageData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
                let modifiedImageData = imageAdjuster.applyAdjustmentsToImageData(imageData, imageAdjuster.settings);
                finalCtx.putImageData(modifiedImageData, 0, 0);
                console.log("Adjustments applied successfully to JPEG.");
            } catch (error) {
                console.error("Error applying adjustments to JPEG:", error);
                // Continue without adjustments if error occurs
            }
        }
        // --- End Apply Image Adjustments ---

        finalCanvas.toBlob((blob) => {
            try {
                if (blob) {
                    saveAs(blob, 't_login.jpg');
                }
            } finally {
                // No need to reset button state for JPEG as it wasn't changed
            }
        }, 'image/jpeg', 0.99);

    } catch (error) {
        console.error("Error in generateJpegFromCanvas:", error);
    }
}

async function generateBmpFromCanvas(imageData, preciseCropData, isFullSelection) {
    let finalCanvas;
    try {
        if (isFullSelection) {
            finalCanvas = await createFullCanvasFromCropperSource();
        } else {
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
            throw new Error("Failed to create final canvas for BMP.");
        }

        // --- Apply Image Adjustments ---
        const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
        if (!imageAdjuster.isNeutral()) {
            console.log("Applying adjustments to BMP canvas before splitting...");
            try {
                let imageData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
                let modifiedImageData = imageAdjuster.applyAdjustmentsToImageData(imageData, imageAdjuster.settings);
                finalCtx.putImageData(modifiedImageData, 0, 0);
                console.log("Adjustments applied successfully to BMP canvas.");
            } catch (error) {
                console.error("Error applying adjustments to BMP canvas:", error);
                // Continue without adjustments if error occurs
            }
        }
        // --- End Apply Image Adjustments ---

        // Lógica existente para procesar BMP desde finalCanvas
        finalCanvas.toBlob(async (blob) => { // Callback is already async
            try {
                if (!blob) {
                    throw new Error("BMP blob creation failed.");
                }
                const zip = new JSZip();
                const numRows = 3;
                const numCols = 4;
                const maxWidth = finalCanvas.width;
                const maxHeight = finalCanvas.height;

                if (maxWidth < numCols || maxHeight < numRows) {
                     throw new Error("Canvas too small for 4x3 grid.");
                }

                const sectionWidth = Math.floor(maxWidth / numCols);
                const sectionHeight = Math.floor(maxHeight / numRows);

                if (sectionWidth <= 0 || sectionHeight <= 0) {
                     throw new Error("Invalid section dimensions for BMP grid.");
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

                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, 'squares.zip');
            } catch (err) {
                console.error("Error during BMP processing/zipping/saving:", err);
            } finally {
                // Reset button state and animation
                cropButton.disabled = false;
                cropButton.classList.remove('bg-green-700', 'animate-pulse', 'loading');
                cropButton.classList.add('bg-gray-800', 'hover:bg-green-600');
                // Reset animation for BMP format
                const cropText = document.getElementById('cropText');
                const loadingText = document.getElementById('loadingText');
                if (cropText && loadingText) {
                    cropText.classList.remove('-translate-y-full', 'opacity-0');
                    loadingText.classList.remove('translate-y-0', 'opacity-100');
                    loadingText.classList.add('translate-y-full', 'opacity-0');
                }
            }
        }); // End of toBlob callback

    } catch (error) {
        console.error("Error in generateBmpFromCanvas:", error);
        // Reset button state and animation on error during canvas creation
        cropButton.disabled = false;
        cropButton.classList.remove('bg-green-700', 'animate-pulse', 'loading'); // Remove loading styles and class
        cropButton.classList.add('bg-gray-800', 'hover:bg-green-600'); // Add base colors back
        // Reset animation
        const cropText = document.getElementById('cropText');
        const loadingText = document.getElementById('loadingText');
        if (cropText && loadingText) {
            cropText.classList.remove('-translate-y-full', 'opacity-0');
            loadingText.classList.remove('translate-y-0', 'opacity-100');
            loadingText.classList.add('translate-y-full', 'opacity-0');
        }
        // cropButton.classList.remove('processing'); // Remove if not used
    }
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
    const totalWidth = sourceCtx.canvas.width;
    const totalHeight = sourceCtx.canvas.height;
    let fullImageData = null;
    let is8Bit = document.getElementById("8Bit").checked;
    const noiseIntensity = parseInt(document.getElementById("noiseLevelSelect").value, 10) || 0;

    try {
        // Get image data ONCE for the entire area if needed (8bit or 24bit with noise)
        // For 24bit without noise, we might optimize further later, but this is a good step.
        // Update: Getting it always simplifies the logic for now. Optimization target: direct context reading.
        // Let's stick to getting it once as the primary optimization vs per-section.
        fullImageData = sourceCtx.getImageData(0, 0, totalWidth, totalHeight);
    } catch (error) {
        console.error("Error getting full image data:", error);
        // Handle error appropriately, maybe stop processing
        throw new Error("Could not read image data for BMP generation.");
    }


    for (let j = 0; j < numRows; j++) {
        for (let i = 0; i < numCols; i++) {
            try {
                const sx = i * sectionWidth;
                const sy = j * sectionHeight;

                // Pass the relevant info to imageDataToBMP
                const bmpData = imageDataToBMP(
                    fullImageData, // Source data
                    totalWidth,    // Source width
                    sx, sy,        // Top-left corner of section in source
                    sectionWidth,  // Section dimensions
                    sectionHeight
                );
                zip.file(`t_¹è°æ${j+1}-${i+1}.bmp`, bmpData);

            } catch (error) {
                console.error(`Error processing section [${j+1}-${i+1}]:`, error);
                // Optionally skip this section or re-throw
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
// Import the image adjuster instance
import imageAdjuster from './imageAdjustments.js';

// Modify imageDataToBMP to work with a sub-rectangle of a larger ImageData
function imageDataToBMP(sourceImageData, sourceTotalWidth, sx, sy, width, height) {
    let is8Bit = document.getElementById("8Bit").checked;
    const noiseIntensity = parseInt(document.getElementById("noiseLevelSelect").value, 10) || 0;

    if (is8Bit) {
        // --- 8-Bit BMP Path ---
        // Still need to extract section data for quantization/noise
        const sectionPixelCount = width * height;
        const sectionDataArray = new Uint8ClampedArray(sectionPixelCount * 4);
        let sourceIndex, destIndex;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                sourceIndex = ((sy + y) * sourceTotalWidth + (sx + x)) * 4;
                destIndex = (y * width + x) * 4;
                sectionDataArray[destIndex] = sourceImageData.data[sourceIndex];
                sectionDataArray[destIndex + 1] = sourceImageData.data[sourceIndex + 1];
                sectionDataArray[destIndex + 2] = sourceImageData.data[sourceIndex + 2];
                sectionDataArray[destIndex + 3] = sourceImageData.data[sourceIndex + 3]; // Copy alpha too
            }
        }
        // Create an ImageData object for this section
        const sectionImageData = new ImageData(sectionDataArray, width, height);

        // Apply noise if selected (modifies sectionImageData.data in place)
        if (noiseIntensity > 0) {
            applyNoise(sectionImageData.data, width, height, noiseIntensity);
        }

        // Apply quantization to get the palette (uses the potentially noised sectionImageData)
        let paletteMethod = document.getElementById("paletteMethod").value;
        const colorTableSize = 256;
        let colorTable;
        // Quantization algorithms expect ImageData
        if (paletteMethod === "kmeans") {
          colorTable = kmeans(sectionImageData, colorTableSize);
        } else if (paletteMethod === "medianCut") {
          colorTable = medianCut(sectionImageData, colorTableSize);
        } else if (paletteMethod === "popularityQuantization") {
          colorTable = popularityQuantization(sectionImageData, colorTableSize);
        } else if (paletteMethod === "neuquant") {
          colorTable = neuQuant(sectionImageData, colorTableSize);
        } else if (paletteMethod === "errorDiffusion") {
          colorTable = errorDiffusionDithering(sectionImageData, colorTableSize); // Needs sectionImageData
        } else {
          // Default or fallback if method is invalid
          console.warn("Invalid palette method selected, defaulting to medianCut.");
          colorTable = medianCut(sectionImageData, colorTableSize);
        }


        // --- BMP Header and Data for 8-bit ---
        const rowBytes = width + (width % 4 ? 4 - width % 4 : 0);
        const fileSize = 54 + 1024 + rowBytes * height; // 54 header, 1024 palette, pixel data

        let offset = 0;
        let buffer = new ArrayBuffer(fileSize);
        let dataView = new DataView(buffer);

        // Standard BMP Header
        dataView.setUint8(offset++, 0x42); // B
        dataView.setUint8(offset++, 0x4D); // M
        dataView.setUint32(offset, fileSize, true); offset += 4;
        offset += 4; // reserved
        dataView.setUint32(offset, 54 + 1024, true); offset += 4; // Offset to pixel data

        // DIB Header (BITMAPINFOHEADER)
        dataView.setUint32(offset, 40, true); offset += 4; // Header size
        dataView.setInt32(offset, width, true); offset += 4;
        dataView.setInt32(offset, height, true); offset += 4;
        dataView.setUint16(offset, 1, true); offset += 2; // Planes
        dataView.setUint16(offset, 8, true); offset += 2; // Bits per pixel
        dataView.setUint32(offset, 0, true); offset += 4; // Compression (0 = BI_RGB)
        dataView.setUint32(offset, rowBytes * height, true); offset += 4; // Image size (can be 0 for BI_RGB)
        dataView.setInt32(offset, 2835, true); offset += 4; // X pixels per meter (~72 DPI)
        dataView.setInt32(offset, 2835, true); offset += 4; // Y pixels per meter (~72 DPI)
        dataView.setUint32(offset, colorTableSize, true); offset += 4; // Colors in palette (use 256)
        dataView.setUint32(offset, colorTableSize, true); offset += 4; // Important colors (use 256)


        // Write the color table
        for (let i = 0; i < colorTable.length; i++) {
            dataView.setUint8(offset++, colorTable[i][2]); // Blue
            dataView.setUint8(offset++, colorTable[i][1]); // Green
            dataView.setUint8(offset++, colorTable[i][0]); // Red
            dataView.setUint8(offset++, 0); // Reserved (alpha)
        }
        // Fill remaining palette entries if colorTable is smaller than 256
         for (let i = colorTable.length; i < colorTableSize; i++) {
            dataView.setUint8(offset++, 0);
            dataView.setUint8(offset++, 0);
            dataView.setUint8(offset++, 0);
            dataView.setUint8(offset++, 0);
        }


        // Write pixel data (indices into the color table)
        const padding = rowBytes - width;
        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                // Read from the (potentially noised) section data
                let index = (y * width + x) * 4;
                let r = sectionImageData.data[index];
                let g = sectionImageData.data[index + 1];
                let b = sectionImageData.data[index + 2];
                let colorIndex = nearestColorIndex(colorTable, r, g, b);
                dataView.setUint8(offset++, colorIndex);
            }
            // Add padding bytes
            for (let p = 0; p < padding; p++) {
                dataView.setUint8(offset++, 0);
            }
        }

        return buffer;

    } else {
        // --- 24-Bit BMP Path ---
        const rowBytes = width * 3 + (width * 3 % 4 ? 4 - width * 3 % 4 : 0);
        const fileSize = 54 + rowBytes * height;
        let offset = 0;
        let buffer = new ArrayBuffer(fileSize);
        let dataView = new DataView(buffer);

        // Standard BMP Header
        dataView.setUint8(offset++, 0x42); // B
        dataView.setUint8(offset++, 0x4D); // M
        dataView.setUint32(offset, fileSize, true); offset += 4;
        offset += 4; // reserved
        dataView.setUint32(offset, 54, true); offset += 4; // Offset to pixel data

        // DIB Header (BITMAPINFOHEADER)
        dataView.setUint32(offset, 40, true); offset += 4; // Header size
        dataView.setInt32(offset, width, true); offset += 4;
        dataView.setInt32(offset, height, true); offset += 4;
        dataView.setUint16(offset, 1, true); offset += 2; // Planes
        dataView.setUint16(offset, 24, true); offset += 2; // Bits per pixel
        dataView.setUint32(offset, 0, true); offset += 4; // Compression (0 = BI_RGB)
        dataView.setUint32(offset, rowBytes * height, true); offset += 4; // Image size
        dataView.setInt32(offset, 2835, true); offset += 4; // X pixels per meter (~72 DPI)
        dataView.setInt32(offset, 2835, true); offset += 4; // Y pixels per meter (~72 DPI)
        dataView.setUint32(offset, 0, true); offset += 4; // Colors in palette (0 for 24-bit)
        dataView.setUint32(offset, 0, true); offset += 4; // Important colors (0 = all)


        // Apply noise directly to the sourceImageData section if needed
        // Note: This modifies the sourceImageData.data IN PLACE for the section.
        // This is generally okay as it's usually read once per crop operation.
        // If the original data needed preserving elsewhere, a copy would be needed here.
        if (noiseIntensity > 0) {
             // We need a function that applies noise to a sub-rectangle of the source data
             applyNoiseToSubRectangle(sourceImageData.data, sourceTotalWidth, sx, sy, width, height, noiseIntensity);
        }

        // Write pixel data (BGR order) directly reading from the sourceImageData sub-rectangle
        const padding = rowBytes - (width * 3);
        let sourceIndex;

        for (let y = height - 1; y >= 0; y--) { // Iterate rows bottom-up
            for (let x = 0; x < width; x++) { // Iterate pixels left-to-right
                // Calculate index in the large source image data
                sourceIndex = ((sy + y) * sourceTotalWidth + (sx + x)) * 4;

                // Read RGB (potentially modified by applyNoiseToSubRectangle)
                let r = sourceImageData.data[sourceIndex];
                let g = sourceImageData.data[sourceIndex + 1];
                let b = sourceImageData.data[sourceIndex + 2];

                // Write BGR to BMP buffer
                dataView.setUint8(offset++, b);
                dataView.setUint8(offset++, g);
                dataView.setUint8(offset++, r);
            }

            // Add padding bytes at the end of the row
            for (let p = 0; p < padding; p++) {
                dataView.setUint8(offset++, 0);
            }
        }

        return buffer;
    }
}

/**
 * Aplica ruido aleatorio a los datos de imagen
 * @param {Uint8ClampedArray} imageDataData - Array de datos de imagen (solo el .data)
 * @param {number} width - Ancho de la imagen (o sección)
 * @param {number} height - Alto de la imagen (o sección)
 * @param {number} intensity - Intensidad del ruido (0-100)
 */
function applyNoise(imageDataData, width, height, intensity) {
    // This function now operates directly on the .data array
    const noiseLevel = Math.min(100, Math.max(0, intensity)) / 100;
    const maxLightnessNoise = noiseLevel * 0.5;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            let r = imageDataData[index];
            let g = imageDataData[index + 1];
            let b = imageDataData[index + 2];

            let [h, s, l] = rgbToHsl(r, g, b);
            const lightnessNoise = (Math.random() * 2 - 1) * maxLightnessNoise;
            let noisyL = Math.max(0, Math.min(1, l + lightnessNoise));
            let [newR, newG, newB] = hslToRgb(h, s, noisyL);

            imageDataData[index] = newR;
            imageDataData[index + 1] = newG;
            imageDataData[index + 2] = newB;
        }
    }
}

// New helper function to apply noise to a sub-rectangle of a larger data array
/**
 * Aplica ruido aleatorio a un sub-rectángulo dentro de un array de datos de imagen más grande
 * @param {Uint8ClampedArray} sourceData - Array de datos de imagen completo (.data)
 * @param {number} sourceTotalWidth - Ancho total de la imagen fuente
 * @param {number} sx - Coordenada X inicial del sub-rectángulo
 * @param {number} sy - Coordenada Y inicial del sub-rectángulo
 * @param {number} width - Ancho del sub-rectángulo
 * @param {number} height - Alto del sub-rectángulo
 * @param {number} intensity - Intensidad del ruido (0-100)
 */
function applyNoiseToSubRectangle(sourceData, sourceTotalWidth, sx, sy, width, height, intensity) {
    const noiseLevel = Math.min(100, Math.max(0, intensity)) / 100;
    const maxLightnessNoise = noiseLevel * 0.5;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const sourceIndex = ((sy + y) * sourceTotalWidth + (sx + x)) * 4;

            let r = sourceData[sourceIndex];
            let g = sourceData[sourceIndex + 1];
            let b = sourceData[sourceIndex + 2];

            let [h, s, l] = rgbToHsl(r, g, b);
            const lightnessNoise = (Math.random() * 2 - 1) * maxLightnessNoise;
            let noisyL = Math.max(0, Math.min(1, l + lightnessNoise));
            let [newR, newG, newB] = hslToRgb(h, s, noisyL);

            sourceData[sourceIndex] = newR;
            sourceData[sourceIndex + 1] = newG;
            sourceData[sourceIndex + 2] = newB;
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

  // Ocultar el aviso de imagen grande y cancelar temporizador
  const largeImageNotice = document.getElementById('largeImageNotice');
  if (largeImageNotice) {
      largeImageNotice.classList.add('hidden');
  }
  if (noticeHideTimer) {
    clearTimeout(noticeHideTimer);
    noticeHideTimer = null;
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

  // Reset any active logo overlay
  if (window.logoOverlay) {
    window.logoOverlay.removeLogo();
  }
  
  // Update checkboxes in the UI
  const showLogoCheckbox = document.getElementById('showLogoOverlay');
  if (showLogoCheckbox) {
    showLogoCheckbox.checked = false;
  }
  
  const logoControls = document.getElementById('logoControls');
  if (logoControls) {
    logoControls.classList.add('hidden');
  }
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

// --- Nueva función para manejar el aviso de imagen grande ---
function showLargeImageNoticeIfNeeded() {
  const largeImageNotice = document.getElementById('largeImageNotice');
  const noticeProgressBar = document.getElementById('noticeProgressBar');
  const noticeProgressContainer = largeImageNotice?.querySelector('.notice-progress-container'); // Get container

  if (!largeImageNotice || !noticeProgressBar || !noticeProgressContainer) return; // Check container too

  // --- Funciones internas para listeners ---
  const pauseTimer = () => {
    if (noticeHideTimer) {
      clearTimeout(noticeHideTimer);
      noticeHideTimer = null; // Important to clear the reference
    }
    // Stop progress bar animation by getting current computed width and setting percentage
    const progressBarRect = noticeProgressBar.getBoundingClientRect();
    const containerRect = noticeProgressContainer.getBoundingClientRect();
    let currentWidthPercent = 0;
    if (containerRect.width > 0) { // Avoid division by zero
      currentWidthPercent = (progressBarRect.width / containerRect.width) * 100;
    }
    noticeProgressBar.style.transition = 'none';
    noticeProgressBar.style.width = `${currentWidthPercent}%`; // Set percentage width
  };

  const startTimer = () => {
    // Clear any previous timer just in case
    if (noticeHideTimer) {
      clearTimeout(noticeHideTimer);
    }
    // Calculate remaining time based on current width (assuming 5s total)
    const currentWidthPercent = parseFloat(noticeProgressBar.style.width || '100');
    const remainingTimeMs = (currentWidthPercent / 100) * 5000;

    if (remainingTimeMs <= 0) {
      largeImageNotice.classList.add('hidden');
      noticeHideTimer = null;
      largeImageNotice.removeEventListener('mouseenter', pauseTimer);
      largeImageNotice.removeEventListener('mouseleave', startTimer);
      return; // No need to start animation/timer
    }

    // Start animation from current width to 0% over remaining time
    noticeProgressBar.style.transition = `width ${remainingTimeMs / 1000}s linear`;
    noticeProgressBar.style.width = '0%';

    // Set new timer to hide after remaining time
    noticeHideTimer = setTimeout(() => {
      largeImageNotice.classList.add('hidden');
      noticeHideTimer = null; // Clear reference after execution
      // Remove listeners when hidden by timer
      largeImageNotice.removeEventListener('mouseenter', pauseTimer);
      largeImageNotice.removeEventListener('mouseleave', startTimer);
    }, remainingTimeMs);
  };
  // --- Fin Funciones internas ---

  const isLargeImage = originalImageWidth > 2000 || originalImageHeight > 2000;
  const isBmpFormat = outputFormatSelect.value === 'bmp';
  const is8BitChecked = checkbox8Bit.checked;

  // Condición para mostrar el aviso
  const shouldShowNotice = isLargeImage && isBmpFormat && is8BitChecked;

  // Limpiar temporizador y listeners anteriores si las condiciones cambian
  if (!shouldShowNotice) {
    if (noticeHideTimer) {
        clearTimeout(noticeHideTimer);
        noticeHideTimer = null;
    }
    largeImageNotice.classList.add('hidden'); // Hide immediately
    // Always remove listeners if notice shouldn't be shown
    largeImageNotice.removeEventListener('mouseenter', pauseTimer);
    largeImageNotice.removeEventListener('mouseleave', startTimer);
    return; // Exit if notice should not be shown
  }

  // Only proceed if the notice should be shown

  // Check if already visible to prevent re-adding listeners/restarting animation
  const isNoticeVisible = !largeImageNotice.classList.contains('hidden');

  // Mostrar el aviso
  largeImageNotice.classList.remove('hidden');

  // Add listeners and start timer only if it wasn't visible before OR if the timer finished/was cancelled
  if (!isNoticeVisible || !noticeHideTimer) {
      // Reset progress bar visually before starting timer/animation
      noticeProgressBar.style.transition = 'none';
      noticeProgressBar.style.width = '100%';
      void noticeProgressBar.offsetWidth; // Force reflow

      // Remove potentially old listeners before adding new ones
      largeImageNotice.removeEventListener('mouseenter', pauseTimer);
      largeImageNotice.removeEventListener('mouseleave', startTimer);
      // Add fresh listeners
      largeImageNotice.addEventListener('mouseenter', pauseTimer);
      largeImageNotice.addEventListener('mouseleave', startTimer);
      // Start the timer and animation
      startTimer();
  }
}

// --- Initialize Tippy.js Tooltips ---
document.addEventListener('DOMContentLoaded', () => {
  tippy('[data-tippy-content]', {
    animation: 'scale-subtle', // Or 'fade', 'shift-away', etc.
    theme: 'material',      // Use the Material Design theme
    arrow: true,            // Show arrow pointing to the element
    delay: [100, 0],        // Delay before showing (100ms), no delay on hide
    // You can add more default options here
  });
});

// --- Sidebar and Login Box Functionality ---
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const sidebarTab = document.getElementById('sidebar-tab');
  const showLoginBoxCheckbox = document.getElementById('showLoginBox');
  let loginBoxOverlay = null;
  let originalLoginBoxWidth = 0;
  let originalLoginBoxHeight = 0;
  
  // Importar e inicializar las nuevas funcionalidades
  import('./accordionHandler.js').then(module => {
    module.initAccordion();
  }).catch(err => console.error('Error loading accordion module:', err));
  
  // Inicializar ajustes de imagen cuando el cropper esté listo
  import('./imageAdjustments.js').then(module => {
    // Se inicializará cuando el cropper esté listo (llamada desde handleImageLoad)
    window.initImageAdjustments = module.initImageAdjustments;
  }).catch(err => console.error('Error loading image adjustments module:', err));
  
  // Inicializar logo overlay cuando el cropper esté listo
  import('./logoOverlay.js').then(module => {
    // Se inicializará cuando el cropper esté listo (llamada desde handleImageLoad)
    window.initLogoOverlay = module.initLogoOverlay;
    window.logoOverlay = module.default;
  }).catch(err => console.error('Error loading logo overlay module:', err));
  
  // Inicializar grid guides
  import('./gridGuides.js').then(module => {
    module.initGridGuides();
    window.gridGuides = module.default;
  }).catch(err => console.error('Error loading grid guides module:', err));
  
  // Toggle sidebar visibility
  sidebarTab.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  
  // Handle login box checkbox
  showLoginBoxCheckbox.addEventListener('change', function() {
    if (this.checked) {
      addLoginBoxOverlay();
    } else {
      removeLoginBoxOverlay();
    }
  });
  
  // Function to add login box overlay to the cropper
  function addLoginBoxOverlay() {
    // Remove existing overlay if any
    removeLoginBoxOverlay();
    
    // Create new overlay only if cropper exists and is ready
    if (!cropper || !cropper.ready) {
      console.warn('Cropper not ready, cannot add login box overlay');
      return;
    }
    
    // Create the login box image element
    loginBoxOverlay = document.createElement('img');
    loginBoxOverlay.id = 'loginBoxOverlay';
    loginBoxOverlay.src = 'public/img/bg_login.png';
    loginBoxOverlay.alt = 'Login Box';
    loginBoxOverlay.className = 'absolute pointer-events-none';
    
    // Initially hide the overlay until it loads
    loginBoxOverlay.style.opacity = '0';
    
    // Wait for the image to load to get its dimensions
    loginBoxOverlay.onload = function() {
      // Store original dimensions
      originalLoginBoxWidth = this.naturalWidth;
      originalLoginBoxHeight = this.naturalHeight;
      
      console.log('Login box loaded. Original dimensions:', originalLoginBoxWidth, 'x', originalLoginBoxHeight);
      
      // Position the overlay on the cropper
      positionLoginBoxOverlay();
      
      // Show the overlay with fade-in effect
      loginBoxOverlay.style.opacity = '0.85';
      
      // Update position when cropper changes - listen to ALL cropper events
      // Remove any existing event listeners first
      if (imageToCrop) {
        imageToCrop.removeEventListener('crop', positionLoginBoxOverlay);
      }
      
      // Add listeners to multiple cropper events to ensure we catch all changes
      imageToCrop.addEventListener('crop', positionLoginBoxOverlay);
      imageToCrop.addEventListener('cropstart', positionLoginBoxOverlay);
      imageToCrop.addEventListener('cropmove', positionLoginBoxOverlay);
      imageToCrop.addEventListener('cropend', positionLoginBoxOverlay);
      imageToCrop.addEventListener('zoom', positionLoginBoxOverlay);
      
      // Also add a manual trigger when window is resized
      window.addEventListener('resize', positionLoginBoxOverlay);
    };
    
    // Handle load errors
    loginBoxOverlay.onerror = function() {
      console.error('Failed to load login box image');
      showLoginBoxCheckbox.checked = false;
      removeLoginBoxOverlay();
    };
    
    // Find the cropper container and add the overlay
    const cropperContainer = document.querySelector('.cropper-container');
    if (cropperContainer) {
      cropperContainer.appendChild(loginBoxOverlay);
    } else {
      console.error('Cropper container not found');
      showLoginBoxCheckbox.checked = false;
    }
  }
  
  // Function to remove login box overlay
  function removeLoginBoxOverlay() {
    if (loginBoxOverlay) {
      // Remove all event listeners to prevent memory leaks
      if (imageToCrop) {
        imageToCrop.removeEventListener('crop', positionLoginBoxOverlay);
        imageToCrop.removeEventListener('cropstart', positionLoginBoxOverlay);
        imageToCrop.removeEventListener('cropmove', positionLoginBoxOverlay);
        imageToCrop.removeEventListener('cropend', positionLoginBoxOverlay);
        imageToCrop.removeEventListener('zoom', positionLoginBoxOverlay);
      }
      
      // Remove window resize listener
      window.removeEventListener('resize', positionLoginBoxOverlay);
      
      // Remove the overlay element
      loginBoxOverlay.remove();
      loginBoxOverlay = null;
    }
  }
  
  // Function to position the login box overlay relative to the crop box
  function positionLoginBoxOverlay() {
    if (!loginBoxOverlay || !cropper || !cropper.ready) return;
    
    // Get current cropper box dimensions
    const cropBoxData = cropper.getCropBoxData();
    const cropBoxWidth = cropBoxData.width;
    const cropBoxHeight = cropBoxData.height;
    
    // Store original login box dimensions and aspect ratio
    const aspectRatio = originalLoginBoxWidth / originalLoginBoxHeight;
    
    // Fixed reference size - 301x132 is the login box's real dimensions
    // On first load, use real size (100%)
    if (!loginBoxOverlay.dataset.initialScaleSaved) {
      // Mark that we're saving the initial scale
      loginBoxOverlay.dataset.initialScaleSaved = "true";
      
      // Store initial crop box dimensions for future reference
      loginBoxOverlay.dataset.initialCropWidth = cropBoxWidth;
      loginBoxOverlay.dataset.initialCropHeight = cropBoxHeight;
      
      console.log(`Initial cropbox: ${cropBoxWidth}x${cropBoxHeight}`);
      console.log(`Login box real size: ${originalLoginBoxWidth}x${originalLoginBoxHeight}`);
      
      // Use real dimensions for first positioning, scaled down only if needed
      let scaledWidth = originalLoginBoxWidth;
      let scaledHeight = originalLoginBoxHeight;
      
      // Scale down if the login box is larger than the available space
      const maxWidth = cropBoxWidth * 0.95; // 95% of crop width
      const maxHeight = cropBoxHeight * 0.95; // 95% of crop height
      
      if (scaledWidth > maxWidth || scaledHeight > maxHeight) {
        const scaleX = maxWidth / scaledWidth;
        const scaleY = maxHeight / scaledHeight;
        const scale = Math.min(scaleX, scaleY);
        
        scaledWidth = originalLoginBoxWidth * scale;
        scaledHeight = originalLoginBoxHeight * scale;
        
        console.log(`Initial scaling needed. New size: ${scaledWidth}x${scaledHeight}`);
      }
      
      // Center the login box within the crop box with vertical offset
      const verticalOffset = cropBoxHeight * 0.25; // 25% down from center
      const left = cropBoxData.left + (cropBoxWidth - scaledWidth) / 2;
      const top = cropBoxData.top + (cropBoxHeight - scaledHeight) / 2 + verticalOffset;
      
      // Apply position and scale
      loginBoxOverlay.style.width = `${scaledWidth}px`;
      loginBoxOverlay.style.height = `${scaledHeight}px`;
      loginBoxOverlay.style.left = `${left}px`;
      loginBoxOverlay.style.top = `${top}px`;
      
      // Save the initial dimensions for reference
      loginBoxOverlay.dataset.lastWidth = scaledWidth;
      loginBoxOverlay.dataset.lastHeight = scaledHeight;
      loginBoxOverlay.dataset.lastCropWidth = cropBoxWidth;
      loginBoxOverlay.dataset.lastCropHeight = cropBoxHeight;
      
      console.log(`Login box positioned at initial size: ${scaledWidth}x${scaledHeight}`);
    } 
    // For subsequent positionings, scale proportionally based on crop box changes
    else {
      // Get the saved dimensions
      const lastWidth = parseFloat(loginBoxOverlay.dataset.lastWidth) || originalLoginBoxWidth;
      const lastHeight = parseFloat(loginBoxOverlay.dataset.lastHeight) || originalLoginBoxHeight;
      const lastCropWidth = parseFloat(loginBoxOverlay.dataset.lastCropWidth) || cropBoxWidth;
      const lastCropHeight = parseFloat(loginBoxOverlay.dataset.lastCropHeight) || cropBoxHeight;
      
      // Calculate scale factor based on crop box size change
      const widthRatio = cropBoxWidth / lastCropWidth;
      const heightRatio = cropBoxHeight / lastCropHeight;
      
      // Use the average of width and height ratio for a more balanced scaling
      const scaleRatio = (widthRatio + heightRatio) / 2;
      
      // Calculate new dimensions based on scale ratio
      let newWidth = lastWidth * scaleRatio;
      let newHeight = lastHeight * scaleRatio;
      
      // Safety check: ensure dimensions don't exceed original size
      newWidth = Math.min(newWidth, originalLoginBoxWidth);
      newHeight = Math.min(newHeight, originalLoginBoxHeight);
      
      // Safety check: ensure dimensions don't exceed crop box bounds
      if (newWidth > cropBoxWidth * 0.95) {
        newWidth = cropBoxWidth * 0.95;
        newHeight = newWidth / aspectRatio;
      }
      
      if (newHeight > cropBoxHeight * 0.95) {
        newHeight = cropBoxHeight * 0.95;
        newWidth = newHeight * aspectRatio;
      }
      
      // Safety check: ensure minimum dimensions to prevent vanishing login box
      const minWidth = Math.min(30, cropBoxWidth * 0.1);
      const minHeight = Math.min(15, cropBoxHeight * 0.1);
      
      newWidth = Math.max(newWidth, minWidth);
      newHeight = Math.max(newHeight, minHeight);
      
      // Center the login box within the crop box with vertical offset
      const verticalOffset = cropBoxHeight * 0.25; // 25% down from center
      const left = cropBoxData.left + (cropBoxWidth - newWidth) / 2;
      const top = cropBoxData.top + (cropBoxHeight - newHeight) / 2 + verticalOffset;
      
      // Apply position and scale
      loginBoxOverlay.style.width = `${newWidth}px`;
      loginBoxOverlay.style.height = `${newHeight}px`;
      loginBoxOverlay.style.left = `${left}px`;
      loginBoxOverlay.style.top = `${top}px`;
      
      // Update the saved dimensions
      loginBoxOverlay.dataset.lastWidth = newWidth;
      loginBoxOverlay.dataset.lastHeight = newHeight;
      loginBoxOverlay.dataset.lastCropWidth = cropBoxWidth;
      loginBoxOverlay.dataset.lastCropHeight = cropBoxHeight;
      
      console.log(`Login box resized to: ${newWidth}x${newHeight} (crop box: ${cropBoxWidth}x${cropBoxHeight})`);
    }
  }
  
  // Reset login box when resetting UI
  const originalResetUI = resetUI;
  resetUI = function() {
    // Uncheck the login box checkbox
    if (showLoginBoxCheckbox) {
      showLoginBoxCheckbox.checked = false;
    }
    
    // Remove the login box overlay
    removeLoginBoxOverlay();
    
    // Call the original resetUI function
    originalResetUI();
  };
});