import { getEnabledElement } from './enabledElement';

/**
 * Creates a new viewport object containing default values for the image and canvas
 * @param image
 * @returns viewport object
 */
export function getDefaultViewport(image: CStone.Image): CStone.Viewport {

    if (image === undefined) {
        throw "getDefaultViewport: parameter image must not be undefined";
    }

    return {
        scale: 1,
        translation: {
            x: 0,
            y: 0
        },
        voi: {
            windowWidth: image.windowWidth,
            windowCenter: image.windowCenter,
        },
        invert: image.invert,
        pixelReplication: false,
        rotation: 0,
        hflip: false,
        vflip: false,
        modalityLUT: image.lut.modalityLUT,
        voiLUT: image.lut.voiLUT
    };
}

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

export function getViewport(element: HTMLElement): CStone.Viewport {
    let viewport = getEnabledElement(element).viewport;

    if (viewport === undefined) {
        return undefined;
    }

    return {
        scale: viewport.scale,
        translation: {
            x: viewport.translation.x,
            y: viewport.translation.y
        },
        voi: {
            windowWidth: viewport.voi.windowWidth,
            windowCenter: viewport.voi.windowCenter
        },
        invert: viewport.invert,
        pixelReplication: viewport.pixelReplication,
        rotation: viewport.rotation,
        hflip: viewport.hflip,
        vflip: viewport.vflip,
        modalityLUT: viewport.modalityLUT,
        voiLUT: viewport.voiLUT
    };
}


import { updateTransform } from './transform';
import { drawImage } from './imageDrawing';
/**
 * Sets the viewport for an element and corrects invalid values
 *
 * @param element - DOM element of the enabled element
 * @param viewport - Object containing the viewport properties
 * @returns {*}
 */
export function setViewport(element: HTMLElement, viewport: CStone.Viewport) {

    var enabledElement = getEnabledElement(element),
        elViewport = enabledElement.viewport;

    //TODO should take into consideration the 3 borning condition below (rotation, windowWidth, scale)
    var needViewportUpdate = elViewport.scale != viewport.scale ||
        elViewport.translation.x != viewport.translation.x ||
        elViewport.translation.y != viewport.translation.y ||
        elViewport.rotation != viewport.rotation ||
        elViewport.hflip != viewport.hflip ||
        elViewport.vflip != viewport.vflip;

    var needImageUpdate = elViewport.voi.windowWidth != viewport.voi.windowWidth ||
        elViewport.voi.windowCenter != viewport.voi.windowCenter ||
        elViewport.invert != viewport.invert ||
        elViewport.modalityLUT != viewport.modalityLUT ||
        elViewport.voiLUT != viewport.voiLUT;

    elViewport.scale = viewport.scale;
    elViewport.translation.x = viewport.translation.x;
    elViewport.translation.y = viewport.translation.y;
    elViewport.voi.windowWidth = viewport.voi.windowWidth;
    elViewport.voi.windowCenter = viewport.voi.windowCenter;
    elViewport.invert = viewport.invert;
    elViewport.pixelReplication = viewport.pixelReplication;
    elViewport.rotation = viewport.rotation % 360;
    elViewport.hflip = viewport.hflip;
    elViewport.vflip = viewport.vflip;
    elViewport.modalityLUT = viewport.modalityLUT;
    elViewport.voiLUT = viewport.voiLUT;

    // prevent window width from being too small (note that values close to zero are valid and can occur with
    // PET images in particular)
    if (elViewport.voi.windowWidth < 0.000001)
        elViewport.voi.windowWidth = 0.000001;

    // prevent scale from getting too small
    if (elViewport.scale < 0.0001)
        elViewport.scale = 0.25;

    if (needViewportUpdate)
        updateTransform(element);

    if (needImageUpdate) {
        element.style.background = elViewport.invert ? '#fff' : '#000';
        drawImage(enabledElement, true);
    }
}

import { updateImage } from './imageDrawing';
/**
 * Resets the viewport to the default settings
 *
 * @param element
 */
export function reset(element: HTMLElement) {
    let enabledElement = getEnabledElement(element);

    enabledElement.viewport =
        enabledElement.initialViewport || getDefaultViewport(enabledElement.image);

    updateImage(element);
}