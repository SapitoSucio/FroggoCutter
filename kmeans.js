/**
 * K-means color quantization algorithm
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} k - Number of colors to use in palette
 * @returns {Array} - Array of RGB color arrays
 */
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

    // Limitar el número de iteraciones para evitar bucles infinitos
    const MAX_ITERATIONS = 10;
    let iterations = 0;

    // Iterar hasta que las asignaciones no cambien o se alcance el máximo de iteraciones
    while (!arraysEqual(assignments, oldAssignments) && iterations < MAX_ITERATIONS) {
        iterations++;
        
        // Guardar las asignaciones antiguas
        oldAssignments = assignments.slice();
        
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
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export default kmeans; 