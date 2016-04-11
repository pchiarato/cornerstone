/**
 * This module contains a function to get a default viewport for an image given
 * a canvas element to display it in
 *
 */
(function (cornerstone) {

    "use strict";

    /**
     * Creates a new viewport object containing default values for the image and canvas
     * @param element
     * @param image
     * @returns viewport object
     */
    function getDefaultViewport(element, image) {
        if(element === undefined) {
            throw "getDefaultViewport: parameter element must not be undefined";
        }
        if(image === undefined) {
            throw "getDefaultViewport: parameter image must not be undefined";
        }

        //quick and temporary hack for displayStaticImage() where we element is an untached canvas
        var elementSize = element.parentNode ?
                    element.getBoundingClientRect()
                :   
                    {
                        width: element.width,
                        height: element.height
                    };

        return {
            scale : scaleToFit(elementSize.width, elementSize.height, image.width, image.height),
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
            modalityLUT: image.modalityLUT,
            voiLUT: image.voiLUT
        };
    }

    function scaleToFit(elWidth, elHeight, imgWidth, imgHeight){
        return Math.min(elWidth / imgWidth, elHeight / imgHeight);
    }

    // module/private exports
    cornerstone.internal.getDefaultViewport = getDefaultViewport;
    cornerstone.getDefaultViewport = getDefaultViewport;

    cornerstone.internal.scaleToFit = scaleToFit;
}(cornerstone));
