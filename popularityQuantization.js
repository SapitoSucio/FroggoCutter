/**
 * Popularity Quantization algorithm
 * Selects the most frequently occurring colors in the image
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} k - Number of colors to use in palette
 * @returns {Array} - Array of RGB color arrays
 */
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
    for (let i = 0; i < k && i < sortedColors.length; i++) {
        colorTable.push(sortedColors[i].split(",").map(function(x) { return parseInt(x); }));
    }

    // Si no hay suficientes colores únicos, completar con colores predeterminados
    while (colorTable.length < k) {
        colorTable.push([0, 0, 0]); // Negro como color de relleno
    }

    return colorTable;
}

// Exportar la función correctamente como exportación por defecto
export default popularityQuantization; 