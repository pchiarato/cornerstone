/**
 * This module contains a function to make an image is invalid
 */
import { getEnabledElement } from './enabledElements';

/**
 * Sets the invalid flag on the enabled element and fire an event
 * @param element
 */
export function invalidate(element: HTMLElement) {
    var enabledElement = getEnabledElement(element);
    enabledElement.invalid = true;
    var eventData = {
        element: element
    };

    //$(enabledElement.element).trigger("CornerstoneInvalidated", eventData);
}