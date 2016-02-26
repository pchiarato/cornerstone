/**
 * This module contains a function that will return coordinate into and from pixel coordinates system
 */

(function (cornerstone) {

    "use strict";

    function parseTransform(transform){
        return transform.split(/\(|,|\)/).slice(1,-1).map( function(v){
            return parseFloat(v);
        });
    }

    //TODO handle 3D matrix
    function applyVectorToTransform(x,y, transform){
        return {
            x: x*transform[0]+y*transform[2]+transform[4],
            y: x*transform[1]+y*transform[3]+transform[5]
        };
    }

    function applyVectorFromTransform(x,y, t/*transform*/){
        /* 
           threejs indices  |  css transform matrix indices
                
                0 3 6                      0 2 4
                1 4 7       =>             1 3 5
                2 5 8                                          
     
            from threejs Matrix3.getInverse() with 3x3 indices and removing 0/1 values  
            te[ 0 ] =  me[ 4 ];
            te[ 1 ] = -me[ 1 ];
            te[ 2 ] =   0;
            te[ 3 ] = -me[ 3 ];
            te[ 4 ] =  me[ 0 ];
            te[ 5 ] = 0;
            te[ 6 ] =   me[ 7 ] * me[ 3 ] - me[ 4 ] * me[ 6 ];
            te[ 7 ] = - me[ 7 ] * me[ 0 ] + me[ 1 ] * me[ 6 ];
            te[ 8 ] =   me[ 4 ] * me[ 0 ] - me[ 1 ] * me[ 3 ];

            det = me[ 0 ] * te[ 0 ] + me[ 1 ] * te[ 3 ];
                => me[ 0 ] * me[ 4 ] + me[ 1 ] * -me[ 3 ];

        
            x = ( x*te[0]+y*te[3]+te[6] ) / det
              => ( x*me[ 4 ] + y*-me[ 3 ] + me[ 7 ]*me[ 3 ] - me[ 4 ]*me[ 6 ] ) / det

            y = ( x*te[1]+y*te[4]+te[7] ) /det
              =>  ( x*-me[ 1 ] + y*me[ 0 ] + -me[ 7 ]*me[ 0 ] + me[ 1 ]*me[ 6 ] ) / det

        */
        /* simplification of above and converting me[x] into transform[x] */

        var det = t[0]*t[3] - t[1]*t[2];

        return {
            x: (  x*t[3] - y*t[2] + t[2]*t[5] - t[4]*t[3] )/det,
            y: ( -x*t[1] + y*t[0] + t[4]*t[1] - t[0]*t[5] )/det
        };
    }

    // Module exports
    /**
     * Return pixel from page coordinate system into pixel coordinate system
     * will not work if any of the offsetParents has transform applied (TODO)
     * 
     * @param  {Object} enabledElement 
     * @param  {Number} x              
     * @param  {Number} y              
     * @return {Object} {x: , y: }
     */
    cornerstone.toPixelCoordinateSystem = function(enabledElement, x, y){
        if(enabledElement === undefined)
            throw "toPixelCoordinateSystem: parameter enabledElement must not be undefined";

        var el = enabledElement.canvas,            
            offsetLeft = 0,
            offsetTop  = 0;
        
        do{
            offsetLeft += el.offsetLeft;
            offsetTop += el.offsetTop;

            el = el.offsetParent;
        } while( el );

       return applyVectorFromTransform( 
            (x || 0) - offsetLeft,
            (y || 0) - offsetTop,
           parseTransform( getComputedStyle(enabledElement.canvas).transform )
        );
    };

    /**
     * Return pixel from pixel coordinate system into page coordinate system
     * TODO NEVER TESTED
     * @param  {Object} enabledElement 
     * @param  {Number} x              
     * @param  {Number} y              
     * @return {Object} {x: , y: }
     */
    cornerstone.toPageCoordinateSystem = function(enabledElement, x, y){
        if(enabledElement === undefined)
            throw "toPageCoordinateSystem: parameter enabledElement must not be undefined";
        
        var el = enabledElement.canvas, 
            c = applyVectorToTransform( 
                x || 0,
                y || 0,
              parseTransform( getComputedStyle(el).transform )
            ),

            offsetLeft = 0,
            offsetTop  = 0;
        
        do{
            offsetLeft += el.offsetLeft;
            offsetTop += el.offsetTop;

            el = el.offsetParent;
        } while( el );

        return {
            x: c.x + offsetLeft,
            y: c.y + offsetTop
        };
    };

    cornerstone.internal.parseTransform = parseTransform;
    cornerstone.internal.applyVectorToTransform = applyVectorToTransform;
    cornerstone.internal.applyVectorFromTransform = applyVectorFromTransform;
    cornerstone.internal.applyNormalToTransform = function(x,y, t/*transform*/){
        //transpose means : 
        //   [0] [2] 0 [4]         [0] [1] 0  0      11 12 13 14 
        //   [1] [3] 0 [5]   ==>   [2] [3] 0  0      21 22 23 24
        //    0   0  1  0           0   0  1  0      31 32 33 34
        //    0   0  0  1          [4] [5] 0  1      41 42 43 44
        //    
        //    Now do same as applyVectorFromTransform()
        //    
        //    te[0]  = n22;
        //    te[4]  = -n12;
        //    te[8]  = 0;
        //    te[12] = 0;
        //    te[1]  = -n21;
        //    te[5]  = n11;
        //    te[9]  = 0;
        //    te[13] = 0;
        //    te[2]  = 0;
        //    te[6]  = 0;
        //    te[10] = n11*n22 - n12*n21;
        //    te[14] = 0;
        //    te[3]  = n21*n42 - n22*n41;
        //    te[7]  = n12*n41 - n11*n42;
        //    te[11] = 0;
        //    te[15] = n11*n22 - n12*n21;

        //    var det = n11 * te[ 0 ] + n21 * te[ 4 ] + n41 * te[ 12 ];

        var det = t[0]*t[3] - t[2]*t[1],
            px = x*t[3]/det - y*t[1]/det,
            py = y*t[0]/det - x*t[2]/det,
            //normalize
            l = Math.sqrt(px*px+py*py);

        return {
            x: x/l,
            y: y/l
        };
    };
   
}(cornerstone));