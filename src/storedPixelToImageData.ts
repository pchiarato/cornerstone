/**
 * This function transforms stored pixel values into a canvas image data buffer
 * by using a LUT.  This is the most performance sensitive code in cornerstone and
 * we use a special trick to make this go as fast as possible.  Specifically we
 * use the alpha channel only to control the luminance rather than the red, green and
 * blue channels which makes it over 3x faster.  The canvasImageDataData buffer needs
 * to be previously filled with white pixels.
 *
 * NOTE: Attribution would be appreciated if you use this technique!
 *
 * @param pixelData the pixel data
 * @param lut the lut
 * @param canvasImageDataData a canvasImgageData.data buffer filled with white pixels
 */
export function storedPixelDataToCanvasImageData(image: CStone.Image, lut: CStone.LUT | CStone.ImageLut, canvasImageDataData: Uint8ClampedArray) {
    let pixelData = image.getPixelData();
    let minPixelValue = image.minPixelValue;
    let canvasImageDataIndex = 3;
    let storedPixelDataIndex = 0;
    let localNumPixels = pixelData.length;
    let localPixelData = pixelData;
    let localLut = lut;
    let localCanvasImageDataData = canvasImageDataData;
    // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
    // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement
    if (minPixelValue < 0) {
        while (storedPixelDataIndex < localNumPixels) {
            localCanvasImageDataData[canvasImageDataIndex] = localLut[localPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // alpha
            canvasImageDataIndex += 4;
        }
    } else {
        while (storedPixelDataIndex < localNumPixels) {
            localCanvasImageDataData[canvasImageDataIndex] = localLut[localPixelData[storedPixelDataIndex++]]; // alpha
            canvasImageDataIndex += 4;
        }
    }
}

export function storedColorPixelDataToCanvasImageData(image: CStone.Image, lut: CStone.LUT | CStone.ImageLut, canvasImageDataData: Uint8ClampedArray) {
    let minPixelValue = image.minPixelValue;
    let canvasImageDataIndex = 0;
    let storedPixelDataIndex = 0;
    let numPixels = image.width * image.height * 4;
    let storedPixelData = image.getPixelData();
    let localLut = lut;
    let localCanvasImageDataData = canvasImageDataData;
    // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
    // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement
    if (minPixelValue < 0) {
        while (storedPixelDataIndex < numPixels) {
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // red
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // green
            localCanvasImageDataData[canvasImageDataIndex] = localLut[storedPixelData[storedPixelDataIndex] + (-minPixelValue)]; // blue
            storedPixelDataIndex += 2;
            canvasImageDataIndex += 2;
        }
    } else {
        while (storedPixelDataIndex < numPixels) {
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++]]; // red
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++]]; // green
            localCanvasImageDataData[canvasImageDataIndex] = localLut[storedPixelData[storedPixelDataIndex]]; // blue
            storedPixelDataIndex += 2;
            canvasImageDataIndex += 2;
        }
    }
}