/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function ($, cornerstone) {

    "use strict";

    /**
     * sets a new image object for a given element
     * @param element
     * @param image
     */
    function displayImage(element, image, viewport) {
        if(element === undefined) {
            throw "displayImage: parameter element cannot be undefined";
        }
        if(image === undefined) {
            throw "displayImage: parameter image cannot be undefined";
        }

        var enabledElement = cornerstone.getEnabledElement(element);
        var hasSizeChanged = false;

        if(enabledElement.image === undefined)
             //TODO could do better
            //What we want is to set canvas background only once we start displaying images
            // Doing it at enable() is too soon (create a white rect during image load)
            // Doing it at each drawImage() call seems too much
            //Here we kinda do it at first displayImage
            enabledElement.canvas.style.backgroundColor = '#fff';

        enabledElement.image = image;

        if(enabledElement.viewport === undefined)
            enabledElement.viewport = cornerstone.internal.getDefaultViewport(enabledElement, image);

        // merge viewport
        if(viewport) {
            for(var attrname in viewport)
            {
                if(viewport[attrname] !== null) {
                    enabledElement.viewport[attrname] = viewport[attrname];
                }
            }
        }

        if(enabledElement.canvas.width != image.width){
            enabledElement.canvas.width = image.width;
            hasSizeChanged = true;
        }
        if(enabledElement.canvas.height != image.height){
            enabledElement.canvas.height = image.height;
            hasSizeChanged = true;
        }

        var now = new Date();
        var frameRate;
        if(enabledElement.lastImageTimeStamp !== undefined) {
            var timeSinceLastImage = now.getTime() - enabledElement.lastImageTimeStamp;
            frameRate = (1000 / timeSinceLastImage).toFixed();
        } else {
        }
        enabledElement.lastImageTimeStamp = now.getTime();

        var newImageEventData = {
            viewport : enabledElement.viewport,
            element : enabledElement.element,
            image : enabledElement.image,
            enabledElement : enabledElement,
            frameRate : frameRate
        };

        $(enabledElement.element).trigger("CornerstoneNewImage", newImageEventData);

         if( viewport || hasSizeChanged )
            cornerstone.updateTransform(element);  

        cornerstone.updateImage(element);
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
    function getImageCanvas(image, width, height, viewport){
        if(image === undefined) {
            throw "displayStaticImage: parameters 'canvas' and 'image' cannot be undefined";
        }

        var imgWidth = image.width,
            imgHeight = image.height;
        
        if( !width && !height){
            width = image.width;
            height = image.height;
        }
        //at least one is non-null
        else{
            if(!width)
                width = height * imgWidth / imgHeight;
            else if(!height)
                height = width * imgHeight / imgWidth;
        }

        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        var vp = cornerstone.internal.getDefaultViewport(canvas, image);
        if( viewport )
            $.extend(vp, viewport);

         //render the image entierely
        var renderCanvas = document.createElement('canvas');
        renderCanvas.width = imgWidth;
        renderCanvas.height = imgHeight;       

        //only lut/windowing par of vp is of need here
        //transform properties are used below
        cornerstone.internal.drawImage({
            canvas : renderCanvas,
            viewport : vp,
            image: image
        });

        //draw
        
        // compute scale
        var widthScale = vp.scale,
            heightScale = vp.scale;
        if(image.rowPixelSpacing < image.columnPixelSpacing)
            widthScale = widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
        else if(image.columnPixelSpacing < image.rowPixelSpacing)
            heightScale = heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);

        if(vp.hflip)
            widthScale = -widthScale;
        if(vp.vflip)
            heightScale = -heightScale;

        var context = canvas.getContext('2d');

        context.translate(width/2 + vp.translation.x, height / 2 + vp.translation.y);
        context.rotate(vp.rotation*Math.PI/180);
        context.scale(widthScale, heightScale);
        context.translate(-imgWidth / 2 , -imgHeight/ 2);

        //renderCanvas must be drawn on a white background
        context.fillStyle = '#fff';
        context.fillRect( 0, 0, imgWidth, imgHeight);

        context.drawImage(renderCanvas, 0, 0, imgWidth, imgHeight);

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
    function getImageElement(srcImage, opt ){
        opt = opt || {};

        var img = document.createElement('img');
        img.src = getImageCanvas(srcImage, opt.width, opt.height, opt.viewport)
            .toDataURL(opt.imageType, opt.imageQuality);

        return img;
    }

    // module/private exports
    cornerstone.displayImage = displayImage;
    cornerstone.getImageCanvas = getImageCanvas;
    cornerstone.getImageElement = getImageElement;

}($, cornerstone));