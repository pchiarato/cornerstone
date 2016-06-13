/**
 * This module generates a VOI LUT
 */

function generateNonLinearVOILUT(voiLUT: CStone.LUT): CStone.LutFunc {
  let shift = voiLUT.numBitsPerEntry - 8;
  let minValue = voiLUT.lut[0] >> shift;
  let maxValue = voiLUT.lut[voiLUT.lut.length -1] >> shift;
  let maxValueMapped = voiLUT.firstValueMapped + voiLUT.lut.length - 1;
  return (modalityLutValue) => {
    if(modalityLutValue < voiLUT.firstValueMapped) {
      return minValue;
    }
    else if(modalityLutValue >= maxValueMapped)
    {
      return maxValue;
    }
    else
    {
      return voiLUT.lut[modalityLutValue - voiLUT.firstValueMapped] >> shift;
    }
  }
}

export function getVOILUT(windowWidth: number, windowCenter: number, voiLUT: CStone.LUT): CStone.LutFunc {
  if(voiLUT) {
    return generateNonLinearVOILUT(voiLUT);
  } else {
    return (modalityLutValue) => (((modalityLutValue - (windowCenter)) / (windowWidth) + 0.5) * 255.0);
  }
}
