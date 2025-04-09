/**
 * Error Diffusion Dithering optimizado y corregido
 * Usa algoritmo de difusión mejorado con correcciones para asegurar integridad de datos
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} colorCount - Number of colors to use in palette
 * @returns {Array} - Array of RGB color arrays
 */
function errorDiffusionDithering(imageData, colorCount) {
    // Generar una paleta de colores simplificada pero efectiva
    const palette = generateSimplePalette(colorCount || 256);
    
    // CORRECCIÓN: No modificamos los datos de imagen originales
    // sino que trabajamos con una copia y devolvemos la paleta solamente
    const width = imageData.width;
    const height = imageData.height;
    
    // SIMPLIFICACIÓN: Usamos una matriz de difusión específica y probada
    // Floyd-Steinberg clásico que sabemos que funciona correctamente
    const matrix = {
        forward: [
            { dx: 1, dy: 0, factor: 7/16 },   // derecha
            { dx: -1, dy: 1, factor: 3/16 },  // abajo-izquierda
            { dx: 0, dy: 1, factor: 5/16 },   // abajo
            { dx: 1, dy: 1, factor: 1/16 }    // abajo-derecha
        ],
        backward: [
            { dx: -1, dy: 0, factor: 7/16 },  // izquierda
            { dx: 1, dy: 1, factor: 3/16 },   // abajo-derecha
            { dx: 0, dy: 1, factor: 5/16 },   // abajo
            { dx: -1, dy: 1, factor: 1/16 }   // abajo-izquierda
        ]
    };
    
    // Crear una copia de los datos de la imagen para procesarlos
    // CORRECCIÓN: Usar el tipo correcto de array (Uint8ClampedArray) 
    // y asegurarse de inicializarlo correctamente
    const imageDataCopy = new Uint8ClampedArray(imageData.data.length);
    for (let i = 0; i < imageData.data.length; i++) {
        imageDataCopy[i] = imageData.data[i];
    }
    
    // Aplicar dithering en la copia
    for (let y = 0; y < height; y++) {
        // Alternar dirección (serpentine scanning)
        const direction = y % 2 === 0 ? 1 : -1;
        const startX = y % 2 === 0 ? 0 : width - 1;
        const endX = y % 2 === 0 ? width : -1;
        
        for (let x = startX; x !== endX; x += direction) {
            const index = (y * width + x) * 4;
            
            // Obtener valores RGB originales
            const r = imageDataCopy[index];
            const g = imageDataCopy[index + 1];
            const b = imageDataCopy[index + 2];
            
            // Encontrar el color más cercano en la paleta
            const closestColor = findClosestColor(palette, r, g, b);
            
            // Calcular error
            const errorR = r - closestColor[0];
            const errorG = g - closestColor[1];
            const errorB = b - closestColor[2];
            
            // Establecer pixel al color más cercano
            imageDataCopy[index] = closestColor[0];
            imageDataCopy[index + 1] = closestColor[1];
            imageDataCopy[index + 2] = closestColor[2];
            
            // Difundir error
            const currentMatrix = direction === 1 ? matrix.forward : matrix.backward;
            for (const coeff of currentMatrix) {
                const nx = x + coeff.dx;
                const ny = y + coeff.dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = (ny * width + nx) * 4;
                    
                    // Usar Math.max/min para asegurar que los valores estén en el rango correcto
                    imageDataCopy[idx] = Math.max(0, Math.min(255, imageDataCopy[idx] + errorR * coeff.factor));
                    imageDataCopy[idx + 1] = Math.max(0, Math.min(255, imageDataCopy[idx + 1] + errorG * coeff.factor));
                    imageDataCopy[idx + 2] = Math.max(0, Math.min(255, imageDataCopy[idx + 2] + errorB * coeff.factor));
                }
            }
        }
    }
    
    // IMPORTANTE: Devolver solo la paleta, ya que el algoritmo de cuantificación 
    // solo requiere la paleta para el proceso posterior
    return palette;
}

/**
 * Genera una paleta simple pero efectiva
 * @param {number} colorCount - Número de colores deseados
 * @returns {Array} - Paleta de colores RGB
 */
function generateSimplePalette(colorCount) {
    const palette = [];
    
    // Garantizar presencia de colores básicos
    const basicColors = [
        [0, 0, 0],       // Negro
        [255, 255, 255], // Blanco
        [255, 0, 0],     // Rojo
        [0, 255, 0],     // Verde
        [0, 0, 255],     // Azul
        [255, 255, 0],   // Amarillo
        [0, 255, 255],   // Cian
        [255, 0, 255]    // Magenta
    ];
    
    // Agregar colores básicos
    for (const color of basicColors) {
        palette.push(color);
    }
    
    // Agregar algunos niveles de grises
    const grayLevels = Math.min(10, Math.floor(colorCount * 0.1));
    for (let i = 1; i < grayLevels - 1; i++) {
        const value = Math.round(i * 255 / grayLevels);
        palette.push([value, value, value]);
    }
    
    // Determinar cuántos niveles por canal necesitamos
    const remaining = colorCount - palette.length;
    // Calcular niveles por canal para distribución uniforme
    const levels = Math.ceil(Math.cbrt(remaining));
    
    if (levels >= 2) {
        const step = 255 / (levels - 1);
        
        // Generar colores RGB distribuidos uniformemente
        for (let r = 0; r < levels && palette.length < colorCount; r++) {
            for (let g = 0; g < levels && palette.length < colorCount; g++) {
                for (let b = 0; b < levels && palette.length < colorCount; b++) {
                    // Evitar duplicar colores básicos
                    if (r === 0 && g === 0 && b === 0) continue; // Negro
                    if (r === levels - 1 && g === levels - 1 && b === levels - 1) continue; // Blanco
                    if (r === levels - 1 && g === 0 && b === 0) continue; // Rojo
                    if (r === 0 && g === levels - 1 && b === 0) continue; // Verde
                    if (r === 0 && g === 0 && b === levels - 1) continue; // Azul
                    
                    palette.push([
                        Math.round(r * step),
                        Math.round(g * step),
                        Math.round(b * step)
                    ]);
                }
            }
        }
    }
    
    // Asegurar que devolvemos exactamente el número solicitado de colores
    return palette.slice(0, colorCount);
}

/**
 * Encuentra el color más cercano en la paleta
 * @param {Array} palette - La paleta de colores
 * @param {number} r - Componente rojo
 * @param {number} g - Componente verde
 * @param {number} b - Componente azul
 * @returns {Array} - El color más cercano
 */
function findClosestColor(palette, r, g, b) {
    let minDistance = Number.MAX_VALUE;
    let closestColor = null;
    
    // Pesos perceptuales según sensibilidad del ojo humano
    const rWeight = 0.299;
    const gWeight = 0.587;
    const bWeight = 0.114;
    
    for (const color of palette) {
        const dr = r - color[0];
        const dg = g - color[1];
        const db = b - color[2];
        
        // Distancia euclidiana ponderada
        const distance = Math.sqrt(
            rWeight * dr * dr +
            gWeight * dg * dg +
            bWeight * db * db
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
        }
    }
    
    return closestColor;
}

export default errorDiffusionDithering; 