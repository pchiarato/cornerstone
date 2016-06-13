/**
 * This module contains a function to convert stored pixel values to display pixel values using a LUT
 */

export function storedColorPixelDataToCanvasImageData(image: CStone.Image, lut: CStone.LUT | CStone.ImageLut, canvasImageDataData: Uint8ClampedArray)
{
    let minPixelValue = image.minPixelValue;
    let canvasImageDataIndex = 0;
    let storedPixelDataIndex = 0;
    let numPixels = image.width * image.height * 4;
    let storedPixelData = image.getPixelData();
    let localLut = lut;
    let localCanvasImageDataData = canvasImageDataData;
    // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
    // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement
    if(minPixelValue < 0){
        while(storedPixelDataIndex < numPixels) {
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // red
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++] + (-minPixelValue)]; // green
            localCanvasImageDataData[canvasImageDataIndex] = localLut[storedPixelData[storedPixelDataIndex] + (-minPixelValue)]; // blue
            storedPixelDataIndex+=2;
            canvasImageDataIndex+=2;
        }
    }else{
        while(storedPixelDataIndex < numPixels) {
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++]]; // red
            localCanvasImageDataData[canvasImageDataIndex++] = localLut[storedPixelData[storedPixelDataIndex++]]; // green
            localCanvasImageDataData[canvasImageDataIndex] = localLut[storedPixelData[storedPixelDataIndex]]; // blue
            storedPixelDataIndex+=2;
            canvasImageDataIndex+=2;
        }
    }
}
