/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function (cornerstone) {

    "use strict";

    function enable(element, renderer) {
        if(element === undefined) {
            throw "enable: parameter element cannot be undefined";
        }

        var canvas = document.createElement('canvas');
        element.appendChild(canvas);

        if (typeof renderer === 'string' && renderer.toLowerCase() === 'webgl') {
            renderer = cornerstone.webGL.renderer.render;
        }

        if (renderer === cornerstone.webGL.renderer.render) {
            if (!cornerstone.webGL.renderer.isWebGLAvailable()) {
                console.error('WebGL not available, falling back to Canvas renderer');
                renderer = undefined;
            } else {
                cornerstone.webGL.renderer.initRenderer();
            }
        }

        var el = {
            element: element,
            canvas: canvas,
            image : undefined, // will be set once image is loaded
            invalid: false, // true if image needs to be drawn, false if not
            render: renderer,
            data : {}
        };
        cornerstone.addEnabledElement(el);

        cornerstone.resize(element, true);

        return element;
    }

    // module/private exports
    cornerstone.enable = enable;
}(cornerstone));