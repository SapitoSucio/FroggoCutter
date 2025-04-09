/**
 * Median Cut color quantization algorithm
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} colorCount - Number of colors to use in palette
 * @returns {Array} - Array of RGB color arrays
 */
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

export default medianCut; 