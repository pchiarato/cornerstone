/**
 * This module returns a subset of the stored pixels of an image
 */
import { getEnabledElement } from './enabledElements';
import { getStoredPixels } from './getStoredPixels';
import { getModalityLUT } from './internal/modalityLUT';

/**
 * Returns array of pixels with modality LUT transformation applied
 */
export function getPixels(element: HTMLElement, x: number, y: number, width: number, height: number): number[] {

    let storedPixels = getStoredPixels(element, x, y, width, height);
    let ee = getEnabledElement(element);

    let mlutfn = getModalityLUT(ee.image.slope, ee.image.intercept, ee.viewport.modalityLUT);

    let modalityPixels = storedPixels.map(mlutfn);

    return modalityPixels;
}