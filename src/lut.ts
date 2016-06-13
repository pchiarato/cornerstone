function generateNonLinearModalityLUT(modalityLUT): CStone.LutFunc {
  let minValue = modalityLUT.lut[0];
  let maxValue = modalityLUT.lut[modalityLUT.lut.length - 1];
  let maxValueMapped = modalityLUT.firstValueMapped + modalityLUT.lut.length;

  return sp => {
    if (sp < modalityLUT.firstValueMapped) {
      return minValue;
    }
    else if (sp >= maxValueMapped) {
      return maxValue;
    }
    else {
      return modalityLUT.lut[sp];
    }
  };
}

export function getModalityLUT(slope, intercept, modalityLUT): CStone.LutFunc {
  if (modalityLUT) {
    return generateNonLinearModalityLUT(modalityLUT);
  } else {
    return sp => sp * slope + intercept;
  }
}

function generateNonLinearVOILUT(voiLUT: CStone.LUT): CStone.LutFunc {
  let shift = voiLUT.numBitsPerEntry - 8;
  let minValue = voiLUT.lut[0] >> shift;
  let maxValue = voiLUT.lut[voiLUT.lut.length - 1] >> shift;
  let maxValueMapped = voiLUT.firstValueMapped + voiLUT.lut.length - 1;
  return (modalityLutValue) => {
    if (modalityLutValue < voiLUT.firstValueMapped) {
      return minValue;
    }
    else if (modalityLutValue >= maxValueMapped) {
      return maxValue;
    }
    else {
      return voiLUT.lut[modalityLutValue - voiLUT.firstValueMapped] >> shift;
    }
  }
}

export function getVOILUT(windowWidth: number, windowCenter: number, voiLUT: CStone.LUT): CStone.LutFunc {
  if (voiLUT) {
    return generateNonLinearVOILUT(voiLUT);
  } else {
    return (modalityLutValue) => (((modalityLutValue - (windowCenter)) / (windowWidth) + 0.5) * 255.0);
  }
}

export function generateLutNew(image: CStone.Image, windowWidth: number, windowCenter: number, invert: boolean, modalityLUT?: CStone.LUT, voiLUT?: CStone.LUT) {
  let lut = image.lut;
  let maxPixelValue = image.maxPixelValue;
  let minPixelValue = image.minPixelValue;

  let mlutfn = getModalityLUT(image.slope, image.intercept, modalityLUT);
  let vlutfn = getVOILUT(windowWidth, windowCenter, voiLUT);

  let offset = 0;
  if (minPixelValue < 0) {
    offset = minPixelValue;
  }
  let storedValue;
  let modalityLutValue;
  let voiLutValue;
  let clampedValue;

  for (storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++) {
    modalityLutValue = mlutfn(storedValue);
    voiLutValue = vlutfn(modalityLutValue);
    clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
    if (!invert) {
      lut[storedValue + (-offset)] = Math.round(clampedValue);
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
export function generateLut(image: CStone.Image, windowWidth: number, windowCenter: number, invert: boolean, modalityLUT?: CStone.LUT, voiLUT?: CStone.LUT) {
  if (image.lut === undefined) {
    image.lut = new Int16Array(image.maxPixelValue - Math.min(image.minPixelValue, 0) + 1);
  }

  if (modalityLUT || voiLUT) {
    generateLutNew(image, windowWidth, windowCenter, invert, modalityLUT, voiLUT);
  }
  else {
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
    if (minPixelValue < 0) {
      offset = minPixelValue;
    }

    if (invert === true) {
      for (storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++) {
        modalityLutValue = storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
        lut[storedValue + (-offset)] = Math.round(255 - clampedValue);
      }
    }
    else {
      for (storedValue = image.minPixelValue; storedValue <= maxPixelValue; storedValue++) {
        modalityLutValue = storedValue * slope + intercept;
        voiLutValue = (((modalityLutValue - (localWindowCenter)) / (localWindowWidth) + 0.5) * 255.0);
        clampedValue = Math.min(Math.max(voiLutValue, 0), 255);
        lut[storedValue + (-offset)] = Math.round(clampedValue);
      }
    }
  }
}