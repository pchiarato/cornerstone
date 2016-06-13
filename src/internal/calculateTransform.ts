import { Transform } from './transform';

export function calculateTransform(enabledElement: CStone.EnabledElement, scale?: number) {

    let transform = new Transform();

    //Apply the rotation before scaling for non square pixels
    let angle = enabledElement.viewport.rotation;
    if(angle!==0) {
        transform.rotate(angle*Math.PI/180);
    }

    // apply the scale
    let widthScale = enabledElement.viewport.scale;
    let heightScale = enabledElement.viewport.scale;
    if(enabledElement.image.rowPixelSpacing < enabledElement.image.columnPixelSpacing) {
        widthScale = widthScale * (enabledElement.image.columnPixelSpacing / enabledElement.image.rowPixelSpacing);
    }
    else if(enabledElement.image.columnPixelSpacing < enabledElement.image.rowPixelSpacing) {
        heightScale = heightScale * (enabledElement.image.rowPixelSpacing / enabledElement.image.columnPixelSpacing);
    }
    transform.scale(widthScale, heightScale);

    // unrotate to so we can translate unrotated
    if(angle!==0) {
        transform.rotate(-angle*Math.PI/180);
    }

    // apply the pan offset
    transform.translate(enabledElement.viewport.translation.x, enabledElement.viewport.translation.y);

    // rotate again so we can apply general scale
    if(angle!==0) {
        transform.rotate(angle*Math.PI/180);
    }

    scale = scale || 1;
    transform.scale( (enabledElement.viewport.hflip ? -1 : 1)*scale, (enabledElement.viewport.vflip ? -1 : 1)*scale );

    // translate the origin back to the corner of the image so the event handlers can draw in image coordinate system
    //transform.translate(-enabledElement.image.width / 2 , -enabledElement.image.height/ 2);
    return transform;
}