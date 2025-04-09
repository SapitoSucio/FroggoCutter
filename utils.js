/**
 * Finds the index of the nearest color in a color table
 * @param {Array} colorTable - Array of RGB color arrays
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} - Index of the nearest color in the table
 */
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

export { nearestColorIndex }; 