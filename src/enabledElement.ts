let enabledElements: CStone.EnabledElement[] = [];

export function getEnabledElement(element: HTMLElement): CStone.EnabledElement {
    if(element === undefined) {
        throw "getEnabledElement: parameter element must not be undefined";
    }
    for(var i=0; i < enabledElements.length; i++) {
        if(enabledElements[i].element == element) {
            return enabledElements[i];
        }
    }

    throw "element not enabled";
}

export function addEnabledElement(enabledElement: CStone.EnabledElement) {
    if(enabledElement === undefined) {
        throw "getEnabledElement: enabledElement element must not be undefined";
    }

    enabledElements.push(enabledElement);
}

export function getEnabledElementsByImageId(imageId: string): CStone.EnabledElement[] {
    var ees = [];
    enabledElements.forEach( enabledElement => {
        if(enabledElement.image && enabledElement.image.imageId === imageId) {
            ees.push(enabledElement);
        }
    });
    return ees;
}

export function getEnabledElements(): CStone.EnabledElement[] {
    return enabledElements;
}

export function getElementData(el: HTMLElement, dataType: string): {} {
    var ee = getEnabledElement(el);
    if (ee.data.hasOwnProperty(dataType) === false) {
        ee.data[dataType] = {};
    }
    return ee.data[dataType];
}

export function removeElementData(el: HTMLElement, dataType: string) {
    var ee = getEnabledElement(el);
    delete ee.data[dataType];
}

/**
 * returns the currently displayed image for an element or undefined if no image has
 * been displayed yet
 *
 * @param element
 */
export function getImage(element) {
    var enabledElement = getEnabledElement(element);
    return enabledElement.image;
}

import { drawImage } from './imageDrawing';

/**
 * Immediately draws the enabled element
 *
 * @param element
 */
export function draw(element: HTMLElement) {
    let enabledElement = getEnabledElement(element);

    if (enabledElement.image === undefined) {
        throw "draw: image has not been loaded yet";
    }

    drawImage(enabledElement);
}

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

let idCpt = 0;

export function enable(element: HTMLElement): CStone.EnabledElement {
    if (element === undefined) {
        throw "enable: parameter element cannot be undefined";
    }

    var canvas = document.createElement('canvas');
    canvas.className = 'cornerstone-canvas';

    element.appendChild(canvas);

    let el = {
        id: idCpt++,
        element: element,
        canvas: canvas,
        image: undefined, // will be set once image is loaded
        invalid: false, // true if image needs to be drawn, false if not
        data: {}
    };
    addEnabledElement(el);

    return el;
}

export function disable(element: HTMLElement) {
    if (element === undefined) {
        throw "disable: element element must not be undefined";
    }

    // Search for this element in this list of enabled elements
    let enabledElements = getEnabledElements();
    for (let i = 0; i < enabledElements.length; i++) {
        if (enabledElements[i].element === element) {
            // We found it!

            // Fire an event so dependencies can cleanup
            let eventData = {
                element: element
            };

            /*$(element).trigger("CornerstoneElementDisabled", eventData);*/

            // remove the child dom elements that we created (e.g. canvas)
            enabledElements[i].element.removeChild(enabledElements[i].canvas);

            // remove this element from the list of enabled elements
            enabledElements.splice(i, 1);
            return;
        }
    }
}

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