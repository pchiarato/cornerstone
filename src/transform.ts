import { Transform } from './transform.class';
import { getEnabledElement } from './enabledElement';

export function getTransform(enabledElement: CStone.EnabledElement): Transform {
    // For now we will calculate it every time it is requested.  In the future, we may want to cache
    // it in the enabled element to speed things up
    let transform = calculateTransform(enabledElement);
    return transform;
}

export function calculateTransform(enabledElement: CStone.EnabledElement, scale?: number) {

    let transform = new Transform();

    //Apply the rotation before scaling for non square pixels
    let angle = enabledElement.viewport.rotation;
    if (angle !== 0) {
        transform.rotate(angle * Math.PI / 180);
    }

    // apply the scale
    let widthScale = enabledElement.viewport.scale;
    let heightScale = enabledElement.viewport.scale;
    if (enabledElement.image.rowPixelSpacing < enabledElement.image.columnPixelSpacing) {
        widthScale = widthScale * (enabledElement.image.columnPixelSpacing / enabledElement.image.rowPixelSpacing);
    }
    else if (enabledElement.image.columnPixelSpacing < enabledElement.image.rowPixelSpacing) {
        heightScale = heightScale * (enabledElement.image.rowPixelSpacing / enabledElement.image.columnPixelSpacing);
    }
    transform.scale(widthScale, heightScale);

    // unrotate to so we can translate unrotated
    if (angle !== 0) {
        transform.rotate(-angle * Math.PI / 180);
    }

    // apply the pan offset
    transform.translate(enabledElement.viewport.translation.x, enabledElement.viewport.translation.y);

    // rotate again so we can apply general scale
    if (angle !== 0) {
        transform.rotate(angle * Math.PI / 180);
    }

    scale = scale || 1;
    transform.scale((enabledElement.viewport.hflip ? -1 : 1) * scale, (enabledElement.viewport.vflip ? -1 : 1) * scale);

    // translate the origin back to the corner of the image so the event handlers can draw in image coordinate system
    //transform.translate(-enabledElement.image.width / 2 , -enabledElement.image.height/ 2);
    return transform;
}

export function scaleToFit(elWidth: number, elHeight: number, imgWidthOrImage: number | CStone.Image, imgHeight?: number): number {
    let imgWidth: number;

    if (isNaN(<number>imgWidthOrImage)) {
        imgHeight = (<CStone.Image>imgWidthOrImage).rows;
        imgWidth = (<CStone.Image>imgWidthOrImage).columns;
    }
    else
        imgWidth = <number>imgWidthOrImage;

    return Math.min(elWidth / imgWidth, elHeight / imgHeight);
}

export function updateTransform(element: HTMLElement) {
    let enabledElement = getEnabledElement(element);
    if (enabledElement.image === undefined) {
        throw "updateTransform: image has not been loaded yet";
    }

    let viewport = enabledElement.viewport,
        image = enabledElement.image,

        transform = 'translate(' +
            (viewport.translation.x === 0 ? '-50%,' : 'calc(' + viewport.translation.x + 'px - 50%),') +
            (viewport.translation.y === 0 ? '-50%)' : 'calc(' + viewport.translation.y + 'px - 50%))');

    //We dont need to translate to center to apply scale/rotation thanks to transform-origin

    if (viewport.rotation % 360 !== 0)//heavy test for small optimisation ?
        transform += 'rotate(' + viewport.rotation + 'deg)'; //use radiant ?

    //use rotation for flip so we can animate it
    transform += 'rotateY(' + (viewport.hflip ? 180 : 0) + 'deg)';
    transform += 'rotateX(' + (viewport.vflip ? 180 : 0) + 'deg)';

    //scale
    let widthScale = enabledElement.viewport.scale;
    let heightScale = enabledElement.viewport.scale;
    if (image) {
        if (image.rowPixelSpacing < image.columnPixelSpacing)
            widthScale = widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
        else if (image.columnPixelSpacing < image.rowPixelSpacing)
            heightScale = heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);
    }

    transform += 'scale(' + widthScale + ',' + heightScale + ')';

    enabledElement.canvas.style.transform = transform;

    /*
    $(enabledElement.element).trigger("CornerstoneTransformUpdated", {
        viewport : enabledElement.viewport,
        transform: transform,
        element : enabledElement.element,
        image : enabledElement.image,
        enabledElement : enabledElement,
        canvasContext: enabledElement.canvas.getContext('2d')
    });
    */
}
