/**
 * This module contains functions to deal with getting and setting the viewport for an enabled element
 */
import { getEnabledElement } from './enabledElements';
    /**
     * Returns the viewport for the specified enabled element
     * @param element
     * @returns {*}
     */
    
export function getViewport(element: HTMLElement): CStone.Viewport {
    let viewport = getEnabledElement(element).viewport;

    if(viewport === undefined) {
        return undefined;
    }

    return {
        scale : viewport.scale,
        translation : {
            x : viewport.translation.x,
            y : viewport.translation.y
        },
        voi : {
            windowWidth: viewport.voi.windowWidth,
            windowCenter : viewport.voi.windowCenter
        },
        invert : viewport.invert,
        pixelReplication: viewport.pixelReplication,
        rotation: viewport.rotation, 
        hflip: viewport.hflip,
        vflip: viewport.vflip,
        modalityLUT: viewport.modalityLUT,
        voiLUT: viewport.voiLUT
    };
}

