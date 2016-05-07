/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function (cornerstone) {

    "use strict";

    var idCpt = 0;

    function enable(element, enableAnnot) {
        if(element === undefined) {
            throw "enable: parameter element cannot be undefined";
        }
        
        var canvas = document.createElement('canvas');       
        element.appendChild(canvas);

        var el = {
            id: idCpt++,
            element: element,
            canvas: canvas,
            image : undefined, // will be set once image is loaded
            invalid: false, // true if image needs to be drawn, false if not
            data : {}
        };
        cornerstone.addEnabledElement(el);

        if(enableAnnot)
            enableAnnotation(el);

        return element;
    }

    // /!\ canvas size is set on displayImage() so we must display an image before being able to draw on annotations
    function enableAnnotation(enabledElement){
        
        var canvasAnnot = document.createElement('canvas');

        //must be updated if element change size
        canvasAnnot.width = enabledElement.element.offsetWidth;
        canvasAnnot.height = enabledElement.element.offsetHeight;

        //TODO use css class
        canvasAnnot.style.position = "absolute";
        canvasAnnot.style.top = canvasAnnot.style.left = canvasAnnot.style.bottom = canvasAnnot.style.right = 0;

        enabledElement.element.appendChild(canvasAnnot);
        enabledElement.canvasAnnot = canvasAnnot;
    }

    // module/private exports
    cornerstone.enable = enable;
    cornerstone.enableAnnotation = function(element){
         if(element === undefined) {
            throw "enable: parameter element cannot be undefined";
        }

        var enabledElement = cornerstone.getEnabledElement(element);

        if(enabledElement === undefined) {
            throw "enableAnnotation: element must be enabled first";
        }

        enableAnnotation(enabledElement);
    };
}(cornerstone));