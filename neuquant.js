/**
 * NeuQuant color quantization algorithm (optimized implementation)
 * Based on the algorithm by Anthony Dekker with improvements
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} colorCount - Number of colors to use in palette
 * @returns {Array} - Array of RGB color arrays
 */
function neuQuant(imageData, colorCount) {
    // Parámetros optimizados
    const NETSIZE = colorCount;
    const ALPHA_BIASSHIFT = 10; // Alpha weight for learning rate
    const INIT_ALPHA = 1.0 * (1 << ALPHA_BIASSHIFT); // Initial alpha value
    const GAMMA = 1024.0; // Gamma factor for learning rate decay
    const RADIUS_BIASSHIFT = 8; // Increased for better neighborhood effect
    const INIT_RADIUS = Math.min(NETSIZE >> 3, 32); // Improved initial radius
    const RADIUS_DEC = 20; // Optimized radius decay for more stable convergence
    const MAX_CYCLES = 200; // Increased for better quality

    // Pre-procesar datos para análisis de importancia
    const histogramColors = createColorHistogram(imageData);
    const importantColors = getImportantColors(histogramColors, 100);
    
    // Extract pixel data con muestreo adaptativo
    const pixels = [];
    const width = imageData.width;
    const height = imageData.height;
    
    // Muestreo estratificado para mejor representación
    // 1. Garantizar colores importantes
    for (const color of importantColors) {
        pixels.push([color[0], color[1], color[2]]);
    }
    
    // 2. Muestreo aleatorio pero representativo
    const totalPixels = width * height;
    const targetSamples = Math.min(totalPixels, 5000); // Limitar a 5000 muestras para eficiencia
    const stride = Math.max(1, Math.floor(totalPixels / targetSamples));
    
    for (let i = 0; i < imageData.data.length; i += stride * 4) {
        if (pixels.length >= targetSamples) break;
        
        if (i < imageData.data.length) {
            pixels.push([
                imageData.data[i],
                imageData.data[i + 1],
                imageData.data[i + 2]
            ]);
        }
    }
    
    // Inicializar red con colores estratégicos en lugar de aleatorios
    const network = initializeNetwork(NETSIZE, importantColors);

    // Main learning loop con progreso gradual
    let alpha = INIT_ALPHA;
    let radius = INIT_RADIUS;
    let rad = radius >> RADIUS_BIASSHIFT;
    
    // Primera fase: aprendizaje grueso
    for (let i = 0; i < MAX_CYCLES / 2; i++) {
        // Ajustar tasa de aprendizaje y radio
        alpha = adjustLearningRate(alpha, i, MAX_CYCLES / 2, GAMMA);
        radius = adjustRadius(radius, i, MAX_CYCLES / 2, RADIUS_DEC);
        rad = Math.max(1, radius >> RADIUS_BIASSHIFT);
        
        // Entrenar con todos los píxeles
        trainNetwork(pixels, network, alpha, rad, ALPHA_BIASSHIFT);
    }
    
    // Segunda fase: ajuste fino (menor radio, menor aprendizaje)
    alpha = INIT_ALPHA / 4; // Comenzar con un alpha menor para refinamiento
    radius = INIT_RADIUS / 2;
    rad = radius >> RADIUS_BIASSHIFT;
    
    for (let i = 0; i < MAX_CYCLES / 2; i++) {
        alpha = adjustLearningRate(alpha, i, MAX_CYCLES / 2, GAMMA * 2);
        radius = adjustRadius(radius, i, MAX_CYCLES / 2, RADIUS_DEC * 2);
        rad = Math.max(1, radius >> RADIUS_BIASSHIFT);
        
        // Entrenar solo con los colores importantes en la fase de ajuste fino
        trainNetwork(importantColors.map(c => [c[0], c[1], c[2]]), network, alpha, rad, ALPHA_BIASSHIFT);
    }

    // Normalizar todos los valores de color
    for (let i = 0; i < network.length; i++) {
        for (let c = 0; c < 3; c++) {
            network[i][c] = Math.max(0, Math.min(255, Math.round(network[i][c])));
        }
    }
    
    // Asegurar que los extremos del espacio de color estén representados
    ensureKeyColors(network);

    return network;
}

/**
 * Crea un histograma de colores para identificar colores dominantes
 */
function createColorHistogram(imageData) {
    const histogram = new Map();
    const pixelCount = imageData.width * imageData.height;
    const samplingRate = Math.max(1, Math.floor(pixelCount / 10000));
    
    for (let i = 0; i < imageData.data.length; i += 4 * samplingRate) {
        if (i >= imageData.data.length) break;
        
        // Cuantizar ligeramente para reducir el número de colores únicos
        const r = Math.floor(imageData.data[i] / 8) * 8;
        const g = Math.floor(imageData.data[i + 1] / 8) * 8;
        const b = Math.floor(imageData.data[i + 2] / 8) * 8;
        
        const colorKey = `${r},${g},${b}`;
        
        if (histogram.has(colorKey)) {
            histogram.set(colorKey, histogram.get(colorKey) + 1);
        } else {
            histogram.set(colorKey, 1);
            // Guardar color original
            histogram.set(`${colorKey}_color`, [
                imageData.data[i],
                imageData.data[i + 1],
                imageData.data[i + 2]
            ]);
        }
    }
    
    return histogram;
}

/**
 * Extrae los colores más importantes basado en frecuencia y diversidad
 */
function getImportantColors(histogram, maxCount) {
    // Convertir el histograma a un array para ordenar
    const entries = Array.from(histogram.entries())
        .filter(entry => !entry[0].includes('_color'))
        .sort((a, b) => b[1] - a[1]); // Ordenar por frecuencia
    
    const result = [];
    // Extraer los colores más frecuentes
    for (let i = 0; i < Math.min(maxCount, entries.length); i++) {
        const colorKey = entries[i][0];
        const colorData = histogram.get(`${colorKey}_color`);
        if (colorData) {
            result.push(colorData);
        }
    }
    
    // Asegurar que se incluyen negro y blanco
    let hasBlack = false;
    let hasWhite = false;
    
    for (const color of result) {
        if (color[0] <= 10 && color[1] <= 10 && color[2] <= 10) hasBlack = true;
        if (color[0] >= 245 && color[1] >= 245 && color[2] >= 245) hasWhite = true;
    }
    
    if (!hasBlack) result.push([0, 0, 0]);
    if (!hasWhite) result.push([255, 255, 255]);
    
    return result;
}

/**
 * Ajusta la tasa de aprendizaje usando una curva de decaimiento mejorada
 */
function adjustLearningRate(alpha, cycle, maxCycles, gamma) {
    // Decay with a curve that starts faster and then slows down
    return alpha * (1.0 - cycle / (maxCycles + gamma));
}

/**
 * Ajusta el radio usando una curva de decaimiento adaptativa
 */
function adjustRadius(radius, cycle, maxCycles, radiusDec) {
    return Math.max(1, Math.floor(radius * (1.0 - cycle / (maxCycles + radiusDec))));
}

/**
 * Inicializa la red con colores estratégicos en lugar de aleatorios
 */
function initializeNetwork(netsize, importantColors) {
    const network = [];
    
    // 1. Primero incluir algunos colores importantes si están disponibles
    const importantCount = Math.min(Math.floor(netsize * 0.2), importantColors.length);
    for (let i = 0; i < importantCount; i++) {
        network.push([...importantColors[i]]);
    }
    
    // 2. Incluir colores clave del espacio RGB
    const keyColors = [
        [0, 0, 0],       // Negro
        [255, 0, 0],     // Rojo
        [0, 255, 0],     // Verde
        [0, 0, 255],     // Azul
        [255, 255, 0],   // Amarillo
        [0, 255, 255],   // Cian
        [255, 0, 255],   // Magenta
        [255, 255, 255], // Blanco
        [128, 128, 128]  // Gris medio
    ];
    
    for (const color of keyColors) {
        if (network.length < netsize * 0.3) {
            network.push([...color]);
        }
    }
    
    // 3. Añadir colores graduales para el resto
    const remaining = netsize - network.length;
    if (remaining > 0) {
        const cubeSize = Math.ceil(Math.cbrt(remaining));
        const step = 255 / (cubeSize - 1);
        
        for (let r = 0; r < cubeSize && network.length < netsize; r++) {
            for (let g = 0; g < cubeSize && network.length < netsize; g++) {
                for (let b = 0; b < cubeSize && network.length < netsize; b++) {
                    network.push([
                        Math.round(r * step),
                        Math.round(g * step),
                        Math.round(b * step)
                    ]);
                }
            }
        }
    }
    
    // Verificar que tenemos exactamente el número requerido de colores
    while (network.length < netsize) {
        // Añadir colores aleatorios si es necesario
        network.push([
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)
        ]);
    }
    
    return network;
}

/**
 * Entrena la red con los píxeles proporcionados
 */
function trainNetwork(pixels, network, alpha, rad, alphaBiasShift) {
    for (let j = 0; j < pixels.length; j++) {
        const pixel = pixels[j];
        
        // Encontrar la neurona que mejor coincide (BMU)
        const bestPos = findBestNeuron(network, pixel);
        
        // Actualizar BMU y vecinos
        const alphaVal = alpha / (1 << alphaBiasShift);
        updateNeurons(network, bestPos, pixel, alphaVal, rad);
    }
}

/**
 * Encuentra la neurona que mejor coincide con el píxel dado
 */
function findBestNeuron(network, pixel) {
    let bestD = Number.MAX_VALUE;
    let bestPos = -1;
    
    for (let i = 0; i < network.length; i++) {
        const n = network[i];
        // Usar distancia euclidiana para mejor calidad
        const dist = euclideanDistance(n, pixel);
        
        if (dist < bestD) {
            bestD = dist;
            bestPos = i;
        }
    }
    
    return bestPos;
}

/**
 * Calcula la distancia euclidiana entre dos colores
 */
function euclideanDistance(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt(dr*dr + dg*dg + db*db);
}

/**
 * Actualiza la BMU y sus vecinos
 */
function updateNeurons(network, bestPos, pixel, alphaVal, rad) {
    const bmu = network[bestPos];
    
    // Actualizar la BMU
    for (let c = 0; c < 3; c++) {
        bmu[c] += alphaVal * (pixel[c] - bmu[c]);
    }
    
    // Actualizar vecinos con decaimiento gaussiano por distancia
    const lo = Math.max(0, bestPos - rad);
    const hi = Math.min(network.length - 1, bestPos + rad);
    
    for (let i = lo; i <= hi; i++) {
        if (i === bestPos) continue;
        
        const neuron = network[i];
        const distance = Math.abs(i - bestPos);
        // Factor gaussiano que disminuye con la distancia
        const influence = Math.exp(-(distance * distance) / (2 * rad * rad)) * alphaVal;
        
        for (let c = 0; c < 3; c++) {
            neuron[c] += influence * (pixel[c] - neuron[c]);
        }
    }
}

/**
 * Asegura que ciertos colores clave estén representados en la paleta
 */
function ensureKeyColors(network) {
    // Colores esenciales para representación visual
    const essentialColors = [
        [0, 0, 0],       // Negro
        [255, 255, 255], // Blanco
        [255, 0, 0],     // Rojo
        [0, 255, 0],     // Verde
        [0, 0, 255],     // Azul
        [255, 255, 0],   // Amarillo
        [0, 255, 255],   // Cian
        [255, 0, 255]    // Magenta
    ];
    
    for (const essential of essentialColors) {
        let found = false;
        let closestDist = Number.MAX_VALUE;
        let closestIdx = -1;
        
        // Buscar el color más cercano en la red
        for (let i = 0; i < network.length; i++) {
            const color = network[i];
            const dist = euclideanDistance(color, essential);
            
            if (dist < 20) { // Si hay uno muy cercano, lo consideramos presente
                found = true;
                break;
            }
            
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        }
        
        // Si no encontramos un color cercano, reemplazar el más cercano
        if (!found && closestIdx >= 0) {
            network[closestIdx] = [...essential];
        }
    }
}

export default neuQuant; 