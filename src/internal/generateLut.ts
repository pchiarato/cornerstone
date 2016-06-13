/**
 * This module generates a lut for an image
 */
import { getModalityLUT } from './modalityLUT';
import { getVOILUT } from './voiLUT';


export function generateLutNew(image: CStone.Image, windowWidth: number, windowCenter: number, invert: boolean, modalityLUT?: CStone.LUT, voiLUT?: CStone.LUT){
  let lut = image.lut;
  let maxPixelValue = image.maxPixelValue;
  let minPixelValue = image.minPixelValue;

  let mlutfn = getModalityLUT(image.slope, image.intercept, modalityLUT);
  let vlutfn = getVOILUT(windowWidth, windowCenter, voiLUT);

  let offset = 0;
  if(minPixelValue < 0) {
    offset = minPixelValue;
  }
  let storedValue;
  let modalityLutValue;
  let voiLutValue;
  let clampedValue;

  for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
  {
    modalityLutValue = mlutfn(storedValue);
    voiLutValue = vlutfn(modalityLutValue);
    clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
    if(!invert) {
      lut[storedValue+ (-offset)] = Math.round(clampedValue);
    } else {
      lut[storedValue + (-offset)] = Math.round(255 - clampedValue);
    }
  }
}



/**
 * Creates a LUT used while rendering to convert stored pixel values to
 * display pixels
 *
 * @param image
 * @returns {Array}
 */
export function generateLut(image: CStone.Image, windowWidth: number, windowCenter: number, invert: boolean, modalityLUT?: CStone.LUT, voiLUT?: CStone.LUT){
  if (image.lut === undefined) {
    image.lut = new Int16Array(image.maxPixelValue - Math.min(image.minPixelValue, 0) + 1);
  }

  if(modalityLUT || voiLUT) {
    generateLutNew(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT);
  }
  else{
    let lut = image.lut;

    let maxPixelValue = image.maxPixelValue;
    let minPixelValue = image.minPixelValue;
    let slope = image.slope;
    let intercept = image.intercept;
    let localWindowWidth = windowWidth;
    let localWindowCenter = windowCenter;
    let modalityLutValue;
    let voiLutValue;
    let clampedValue;
    let storedValue;

    // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
    // We improve performance by offsetting the pixel values for signed data to avoid negative indexes
    // when generating the lut and then undo it in storedPixelDataToCanvasImagedata.  Thanks to @jpambrun
    // for this contribution!

    let offset = 0;
    if(minPixelValue < 0) {
      offset = minPixelValue;
    }

    if(invert === true) {
      for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
      {
        modalityLutValue =  storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
        lut[storedValue + (-offset)] = Math.round(255 - clampedValue);
      }
    }
    else {
      for(storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++)
      {
        modalityLutValue = storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
        lut[storedValue+ (-offset)] = Math.round(clampedValue);
      }
    }
  }
}
