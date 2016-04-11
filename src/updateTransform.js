(function ($, cornerstone) {

    "use strict";

    /**
     * Forces the transform to be updated for the specified enabled element
     * @param element
     */
    function updateTransform(element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        if(enabledElement.image === undefined) {
            throw "updateTransform: image has not been loaded yet";
        }
       
       applyTransform(enabledElement);
    }

    function applyTransform(enabledElement){      

        var viewport = enabledElement.viewport,
            /*
            transform = 'translate(' + 
                (viewport.translation.x === 0 ? '-50%,' : 'calc(' + viewport.translation.x + 'px - 50%),') +
                (viewport.translation.y === 0 ? '-50%)' : 'calc(' + viewport.translation.y + 'px - 50%))');
           */
           
           transform = 'translate(' + 
                viewport.translation.x + 'px,' +
                viewport.translation.y + 'px)';
           

        //We dont need to translate to center to apply scale/rotation thanks to transform-origin
        
        if( viewport.rotation%360 !== 0 )//heavy test for small optimisation ?
            transform += 'rotate(' + viewport.rotation + 'deg)'; //use radiant ?

        //use rotation for flip so we can animate it
        if(viewport.hflip)
            transform += 'rotateY(180deg)';
        if(viewport.vflip)
            transform += 'rotateX(180deg)';

        //scale
        var img = enabledElement.image,
            widthScale = enabledElement.viewport.scale,
            heightScale = enabledElement.viewport.scale;

        if(img){
            if(img.rowPixelSpacing < img.columnPixelSpacing)
                widthScale = widthScale * (img.columnPixelSpacing / img.rowPixelSpacing);
            else if(img.columnPixelSpacing < img.rowPixelSpacing)
                heightScale = heightScale * (img.rowPixelSpacing / img.columnPixelSpacing);
        }

        transform += 'scale(' + widthScale + ',' + heightScale +')';

        transform += 'translate(-50%,-50%)';

        enabledElement.canvas.style.transform = transform;

        $(enabledElement.element).trigger("CornerstoneTransformUpdated", {
            viewport : enabledElement.viewport,
            element : enabledElement.element,
            image : enabledElement.image,
            enabledElement : enabledElement,
            canvasContext: enabledElement.canvas.getContext('2d')
        });
    }

    // module exports
    cornerstone.updateTransform = updateTransform;
    cornerstone.internal.applyTransform = applyTransform;

}($, cornerstone));