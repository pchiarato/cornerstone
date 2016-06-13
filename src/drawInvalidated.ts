/**
 * This module is responsible for drawing invalidated enabled elements
 */
import { getEnabledElements } from './enabledElements';
import { drawImage } from './internal/drawImage';

/**
 * Draws all invalidated enabled elements and clears the invalid flag after drawing it
 */
export function drawInvalidated() {
    let enabledElements = getEnabledElements();
    for (let i = 0; i < enabledElements.length; i++) {
        let ee = enabledElements[i];
        if (ee.invalid === true) {
            drawImage(ee);
        }
    }
}