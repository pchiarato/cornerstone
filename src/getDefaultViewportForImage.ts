/**
 * This file is responsible for returning the default viewport for an image
 */
import { getEnabledElement } from './enabledElements';
import { getDefaultViewport } from './internal/getDefaultViewport';

/**
 * returns a default viewport for display the specified image on the specified
 * enabled element.  The default viewport is fit to window
 *
 * @param element
 * @param image
 */
export function getDefaultViewportForImage(element: HTMLElement, image: CStone.Image) {
    var enabledElement = getEnabledElement(element);
    var viewport = getDefaultViewport(image);
    return viewport;
}