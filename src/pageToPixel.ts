/**
 * This module contains a helper function to covert page coordinates to pixel coordinates
 */
import { getEnabledElement } from './enabledElements';
import { getTransform } from './internal/getTransform';
import { Transform } from './internal/transform';

/**
 * Converts a point in the page coordinate system to the pixel coordinate
 * system
 * @param element
 * @param pageX
 * @param pageY
 * @returns {{x: number, y: number}}
 */
export function pageToPixel(element: HTMLElement, pageX: number, pageY: number): CStone.Coord{
    let enabledElement = getEnabledElement(element);
    // convert the pageX and pageY to the canvas client coordinates
    let rect = enabledElement.canvas.getBoundingClientRect();

    return getTransform( enabledElement  )
       .invert()
       .transformPoint(
            pageX - rect.left - window.pageXOffset,
            pageY - rect.top  - window.pageYOffset );
}

export function coordFromEvent(element: HTMLElement, event: MouseEvent): CStone.Coord {
    let enabledElement = getEnabledElement(element);

    if( event.target === enabledElement.canvas )
        return {
            x: event.offsetX,
            y: event.offsetY
        };

    return pageToPixel(element, event.pageX, event.pageY);
}
