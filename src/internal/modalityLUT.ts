/**
 * This module generates a Modality LUT
 */

function generateNonLinearModalityLUT(modalityLUT): CStone.LutFunc {
  let minValue = modalityLUT.lut[0];
  let maxValue = modalityLUT.lut[modalityLUT.lut.length -1];
  let maxValueMapped = modalityLUT.firstValueMapped + modalityLUT.lut.length;

  return sp => {
    if(sp < modalityLUT.firstValueMapped) {
      return minValue;
    }
    else if(sp >= maxValueMapped)
    {
      return maxValue;
    }
    else
    {
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
