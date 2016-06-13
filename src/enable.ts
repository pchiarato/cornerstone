/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
import { addEnabledElement } from './enabledElements';

let idCpt = 0;

export function enable(element: HTMLElement): CStone.EnabledElement {
    if(element === undefined) {
        throw "enable: parameter element cannot be undefined";
    }

    var canvas = document.createElement('canvas');
    canvas.className = 'cornerstone-canvas';

    element.appendChild(canvas);

    let el = {
        id: idCpt++,
        element: element,
        canvas: canvas,
        image : undefined, // will be set once image is loaded
        invalid: false, // true if image needs to be drawn, false if not
        data : {}
    };
    addEnabledElement(el);

    return el;
}
