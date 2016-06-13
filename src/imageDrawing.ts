import { getEnabledElement, getEnabledElementsByImageId } from './enabledElement';
import { getViewport, getDefaultViewport } from './viewport';
import { updateTransform, scaleToFit } from './transform';
import extend = require('extend');

/**
 * Internal API function to draw an image to a given enabled element
 * @param enabledElement
 * @param invalidated - true if pixel data has been invalidated and cached rendering should not be used
 */
export function drawImage(enabledElement: CStone.EnabledElement, invalidated?: boolean) {

    let start = new Date().getTime();

    enabledElement.image.render(enabledElement, invalidated);

    let context = enabledElement.canvas.getContext('2d');

    let end = new Date().getTime();
    let diff = end - start;
    //console.log(diff + ' ms');

    /*
    let eventData = {
        viewport: enabledElement.viewport,
        element: enabledElement.element,
        image: enabledElement.image,
        enabledElement: enabledElement,
        canvasContext: context,
        renderTimeInMs: diff
    };

    $(enabledElement.element).trigger("CornerstoneImageRendered", eventData);
    */
    enabledElement.invalid = false;
}

/**
 * sets a new image object for a given element
 * @param element
 * @param image
 */
export function displayImage(element: HTMLElement, image: CStone.Image, viewport: CStone.Viewport) {
    if (element === undefined) {
        throw "displayImage: parameter element cannot be undefined";
    }
    if (image === undefined) {
        throw "displayImage: parameter image cannot be undefined";
    }

    var enabledElement = getEnabledElement(element);
    var hasSizeChanged = false;

    if (enabledElement.image === undefined)
        //TODO could do better
        //What we want is to set canvas background only once we start displaying images
        // Doing it at enable() is too soon (create a white rect during image load)
        // Doing it at each drawImage() call seems too much
        //Here we kinda do it at first displayImage
        enabledElement.canvas.style.backgroundColor = '#fff';

    enabledElement.image = image;


    if (enabledElement.viewport === undefined)
        enabledElement.viewport = getDefaultViewport(image);

    // merge viewport
    if (viewport) {
        for (var attrname in viewport) {
            if (viewport[attrname] !== null) {
                enabledElement.viewport[attrname] = viewport[attrname];
            }
        }
    }
    //for reset we keep a copy of the viewport at this point 
    enabledElement.initialViewport = getViewport(element);

    if (enabledElement.canvas.width != image.width) {
        enabledElement.canvas.width = image.width;
        hasSizeChanged = true;
    }
    if (enabledElement.canvas.height != image.height) {
        enabledElement.canvas.height = image.height;
        hasSizeChanged = true;
    }

    var now = new Date();
    var frameRate;
    if (enabledElement.lastImageTimeStamp !== undefined) {
        var timeSinceLastImage = now.getTime() - enabledElement.lastImageTimeStamp;
        frameRate = (1000 / timeSinceLastImage).toFixed();
    } else {
    }
    enabledElement.lastImageTimeStamp = now.getTime();

    /*
    var newImageEventData = {
        viewport : enabledElement.viewport,
        element : enabledElement.element,
        image : enabledElement.image,
        enabledElement : enabledElement,
        frameRate : frameRate
    };

    $(enabledElement.element).trigger("CornerstoneNewImage", newImageEventData);
    */

    if (viewport || hasSizeChanged)
        updateTransform(element);

    updateImage(element);
}

/*
   Return a canvas with the image displayed on
   Statically means 
       - we keep nothing on memory (no cache, no enabled element etc...)
       - we won't apply any changes on the image

   @param canvas
   @param image
   @param width width of the final canvas
   @param height height of the final canvas
   @param viewport 

   if width is undefined or equal to 0 it will be computed from image ratio and height
   same for height.
   if both width and height are undefined or equals to 0, we'll use image size.
*/
export function getImageCanvas(image: CStone.Image, width?: number, height?: number, viewport?: CStone.Viewport) {
    if (image === undefined) {
        throw "displayStaticImage: parameters 'canvas' and 'image' cannot be undefined";
    }

    var imgWidth = image.width,
        imgHeight = image.height;

    if (!width && !height) {
        width = image.width;
        height = image.height;
    }
    //at least one is non-null
    else {
        if (!width)
            width = height * imgWidth / imgHeight;
        else if (!height)
            height = width * imgHeight / imgWidth;
    }

    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    let vp = getDefaultViewport(image);
    if (viewport)
        extend(vp, viewport);

    //render the image entierely
    var renderCanvas = document.createElement('canvas');
    renderCanvas.width = imgWidth;
    renderCanvas.height = imgHeight;

    //only lut/windowing par of vp is of need here
    //transform properties are used below
    drawImage({
        id: 0,                //not used and should not be
        element: null,
        canvas: renderCanvas,
        viewport: vp,
        image: image
    });


    //draw


    // compute scale
    let scale = scaleToFit(width, height, image),
        widthScale = scale,
        heightScale = scale;

    if (image.rowPixelSpacing < image.columnPixelSpacing)
        widthScale = widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
    else if (image.columnPixelSpacing < image.rowPixelSpacing)
        heightScale = heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);

    if (vp.hflip)
        widthScale = -widthScale;
    if (vp.vflip)
        heightScale = -heightScale;


    let context = canvas.getContext('2d');

    context.translate(width / 2 + vp.translation.x, height / 2 + vp.translation.y);
    context.rotate(vp.rotation * Math.PI / 180);
    context.scale(widthScale, heightScale);
    context.translate(-imgWidth / 2, -imgHeight / 2);

    //renderCanvas must be drawn on a white background
    context.fillStyle = '#fff';
    context.fillRect(0, 0, imgWidth, imgHeight);

    //scale is done here : TODO non-squared pixel
    context.drawImage(renderCanvas, 0, 0);

    return canvas;
}

/*
    return an <image> element
    @param opt object list of option which may contain :
        viewport:       viewport to apply to the srcImage
        
        width:          width of the imageElement default width of srcImage
        height:         height of the imageElement default height of srcImage
        imageType:      type of the imageElement @see canvas.toDataURL()
        imageQuality:   quality of the imageElement @see canvas.toDataURL()
 */
export function getImageElement(srcImage: CStone.Image,
    opt: { viewport?: CStone.Viewport, width?: number, height?: number, imageType?: string, imageQuality?: number } = {}): HTMLImageElement {

    var img = document.createElement('img');
    img.src = getImageCanvas(srcImage, opt.width, opt.height, opt.viewport)
        .toDataURL(opt.imageType, opt.imageQuality);

    return img;
}

/**
 * This module contains a function to immediately redraw an image
 */
/* global jQuery, cornerstone */

interface pendingElement {
    enabledElement: CStone.EnabledElement;
    //promise: Promise<>;    
}

let pendingEls = {},
    pool = [],
    loopRunning = false;

function renderingLoop() {
    var id = pool.shift(),
        el = pendingEls[id];

    delete pendingEls[id];
    drawImage(el.enabledElement, el.invalidated);
    //el.promise.resolve();

    //if we have still pending rendering continue otherwise stop
    if (pool.length > 0)
        window.requestAnimationFrame(renderingLoop);
    else
        loopRunning = false;
}

/**
 * Update the image display by adding it to the rendering pool
 * 
 * @param element
 */
export function updateImage(element: HTMLElement, invalidated?: boolean) {
    var enabledElement = getEnabledElement(element);

    if (enabledElement.image === undefined) {
        throw "updateImage: image has not been loaded yet";
    }

    var id = enabledElement.id,
        pendingElement = pendingEls[id];

    //if this element is not yet on the pool add it
    //otherwise do nothing cause it means we're asking for an update before the previous one had time to complete
    if (!pendingElement) {
        pendingEls[id] = pendingElement = {
            enabledElement: enabledElement,
            //promise: $.Deferred()
        };
        pool.push(id);

        //start loop if is not already running
        if (!loopRunning) {
            loopRunning = true;
            window.requestAnimationFrame(renderingLoop);
        }
    }

    //if we have at least one call to updateImage() with invalidated set to true
    //invalidated must be set to true for the rendering
    if (invalidated)
        pendingElement.invalidated = true;

    //return pendingElement.promise;
}

/**
 * Forces the image to be updated/redrawn for the specified enabled element
 * @param element
 */
export function invalidateImageId(imageId: string) {

    let enabledElements = getEnabledElementsByImageId(imageId);
    enabledElements.forEach(enabledElement => drawImage(enabledElement, true));
}