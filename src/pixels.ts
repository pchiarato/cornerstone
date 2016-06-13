import { getEnabledElement } from './enabledElement';
import { getModalityLUT } from './lut';

/***** Getters *****/

/**
  * Returns an array of stored pixels given a rectangle in the image
  * @param element
  * @param x
  * @param y
  * @param width
  * @param height
  * @returns {Array}
  */
export function getStoredPixels(element: HTMLElement, x: number, y: number, width: number, height: number): number[] {
    if (element === undefined) {
        throw "getStoredPixels: parameter element must not be undefined";
    }

    x = Math.round(x);
    y = Math.round(y);
    var ee = getEnabledElement(element);
    var storedPixels = [];
    var index = 0;
    var pixelData = ee.image.getPixelData();
    for (var row = 0; row < height; row++) {
        for (var column = 0; column < width; column++) {
            var spIndex = ((row + y) * ee.image.columns) + (column + x);
            storedPixels[index++] = pixelData[spIndex];
        }
    }
    return storedPixels;
}

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

/***** Conversions *****/
import { getTransform } from './transform';

/**
 * Converts a point in the page coordinate system to the pixel coordinate
 * system
 * @param element
 * @param pageX
 * @param pageY
 * @returns {{x: number, y: number}}
 */
export function pageToPixel(element: HTMLElement, pageX: number, pageY: number): CStone.Coord {
    let enabledElement = getEnabledElement(element);
    // convert the pageX and pageY to the canvas client coordinates
    let rect = enabledElement.canvas.getBoundingClientRect();

    return getTransform(enabledElement)
		.invert()
		.transformPoint(
		pageX - rect.left - window.pageXOffset,
		pageY - rect.top - window.pageYOffset);
}

export function coordFromEvent(element: HTMLElement, event: MouseEvent): CStone.Coord {
    let enabledElement = getEnabledElement(element);

    if (event.target === enabledElement.canvas)
        return {
            x: event.offsetX,
            y: event.offsetY
        };

    return pageToPixel(element, event.pageX, event.pageY);
}

/**
 * Converts a point in the pixel coordinate system to the canvas coordinate system
 * system.  This can be used to render using canvas context without having the weird
 * side effects that come from scaling and non square pixels
 * @param element
 * @param pt
 * @returns {x: number, y: number}
 */
export function pixelToCanvas(element: HTMLElement, pt: CStone.Coord): CStone.Coord {
    var enabledElement = getEnabledElement(element);
    var transform = getTransform(enabledElement);
    return transform.transformPoint(pt.x, pt.y);
}