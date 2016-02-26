/**
 * This module is responsible for drawing annotations
 */
(function (cornerstone) {

    "use strict";

    /**
     * Setup context to draw annotation
     *
     * 
     * /!\ Still in very early stage !
     *   
     * 
     * @param drawShapesCbArr array of callbacks where shapes are drawn
     *     function( context, scaleAdjust )
     *         @param {CanvasRenderingContext2D} [context] : 2D context of canvas
     *         @param {Number} [scaleAdjust] : offset to add to all positions when drawing shapes
     *
     *         return true to stroke the shape.
     *
     *      shapes can be filled but should not be stroke (use return instead).
     * 
     * @param textArr array of text object to draw
     *
     * text object : {
     *     text : text to be displayed
     *     bottom: bottom position of text
     *     left: left position of text
     *     width: width of rect around where text can appear (for rotation)
     *     height: height of rect around where text can appear (for rotation)
     * }
     *  
     */
    function drawAnnotation(element, drawShapesCbArr, textArr) {
       var  enabledElement = cornerstone.getEnabledElement(element),
            canvasAnnot = enabledElement.canvasAnnot;

        if( !canvasAnnot )
            throw "you must enableAnnotation() before drawing them";

       //temporary
       enabledElement.shapes = drawShapesCbArr;
       enabledElement.texts = textArr;

       updateAnnotation(enabledElement);
    }

    function updateAnnotation(enabledElement){

       var  canvasAnnot = enabledElement.canvasAnnot,
            ctxAnnot = canvasAnnot.getContext('2d'),

            rotation = enabledElement.viewport.rotation*Math.PI/180,
            scaleX = (enabledElement.viewport.hflip? -1 : 1)*enabledElement.viewport.scale,
            scaleY = (enabledElement.viewport.vflip? -1 : 1)*enabledElement.viewport.scale;

        ctxAnnot.setTransform(1, 0, 0, 1, 0, 0);
        ctxAnnot.clearRect(0, 0, canvasAnnot.width, canvasAnnot.height);

        //default values can be change on drawShapes
        ctxAnnot.strokeStyle = 'white';
        ctxAnnot.fillStyle = 'white';
        ctxAnnot.font = "12pt Arial";

        //translate to center for rotate/scale
        ctxAnnot.translate(enabledElement.viewport.translation.x + canvasAnnot.width/2, enabledElement.viewport.translation.y + canvasAnnot.height/2);
        ctxAnnot.scale(scaleX, scaleY);
        ctxAnnot.rotate(rotation);

        //go to top left of image (from center)
        ctxAnnot.translate(-enabledElement.image.width/2, -enabledElement.image.height/2);

        var scaleAdjust = 0.5/enabledElement.viewport.scale,
            i,l;
        
        if( enabledElement.shapes )
            for(i = 0, l = enabledElement.shapes.length; i < l; i ++){
                ctxAnnot.save();
                if( enabledElement.shapes[i]( ctxAnnot, scaleAdjust ) ){
                    ctxAnnot.setTransform(1, 0, 0, 1, 0, 0);
                    ctxAnnot.stroke();

                    ctxAnnot.restore();
                }

            }

        if( enabledElement.texts ){
            ctxAnnot.textBaseline = "bottom";
            ctxAnnot.textAlign = "left";

            for(i = 0, l = enabledElement.texts.length; i < l; i++){
                var txtObj = enabledElement.texts[i],
                    x = txtObj.left + scaleAdjust,
                    y = txtObj.bottom + scaleAdjust,

                    width2 =  txtObj.width/2,
                    height2 = txtObj.height/2, 

                    cos = Math.abs(Math.cos(rotation)),
                    sin = Math.abs(Math.sin(rotation)),
                    rectHalfSize = {
                        x: cos*width2 + sin*height2,
                        y: sin*width2 + cos*height2
                    },

                    textX = -rectHalfSize.x,
                    textY = -rectHalfSize.y;
        
                //unrotate and unflip from center of bounding rectangle
                ctxAnnot.translate(x + width2, y + height2);
                ctxAnnot.rotate(-rotation);
                ctxAnnot.scale(enabledElement.viewport.hflip? -1 : 1, enabledElement.viewport.vflip? -1 : 1);

                //scale down at start of text
                ctxAnnot.translate( textX, textY);
                ctxAnnot.scale(1/enabledElement.viewport.scale, 1/enabledElement.viewport.scale);

                //draw text (still at start of text)
                ctxAnnot.fillText(txtObj.text, 0, 0);
            }
        }
    }

    // module exports
    cornerstone.drawAnnotation = drawAnnotation;
    cornerstone.internal.updateAnnotation = updateAnnotation;
    cornerstone.updateAnnotation = function(element){
        var  enabledElement = cornerstone.getEnabledElement(element);

        if( !enabledElement )
            throw "element must be enabled";

        updateAnnotation( enabledElement );
    };

}(cornerstone));