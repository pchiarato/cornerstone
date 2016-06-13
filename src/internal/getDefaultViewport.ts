/**
 * This module contains a function to get a default viewport for an image given
 * a canvas element to display it in
 *
 */

/**
 * Creates a new viewport object containing default values for the image and canvas
 * @param image
 * @returns viewport object
 */
export function getDefaultViewport(image: CStone.Image): CStone.Viewport {

    if(image === undefined) {
        throw "getDefaultViewport: parameter image must not be undefined";
    }        

    return {
        scale : 1,
        translation : {
            x : 0,
            y : 0
        },
        voi : {
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
