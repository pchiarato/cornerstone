/**
 * This module contains a function to immediately invalidate an image
 */

import { getEnabledElementsByImageId } from './enabledElements';
import { drawImage } from './internal/drawImage';

/**
 * Forces the image to be updated/redrawn for the specified enabled element
 * @param element
 */
export function invalidateImageId(imageId: string) {

    let enabledElements = getEnabledElementsByImageId(imageId);
    enabledElements.forEach( enabledElement => drawImage(enabledElement, true) );
}
