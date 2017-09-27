export interface Coord2D {
    x: number;
    y: number;
}

export interface Transform {
    scale?: number;
	translation?: Coord2D;
	rotation?: number;
	hflip?: boolean
	vflip?: boolean
}

/* Usage of Number() + !isNan() is for sanitization */
export function toCSSString(transform: Transform): string {

    let transformStr = 'translate(-50%,-50%)';

    if (transform.translation !== undefined) {
        const x = Number(transform.translation.x);
        const y = Number(transform.translation.y);

        if ( !isNaN(x) && !isNaN(y) )
            transformStr += `translate(${x}px,${y}px)`;
    }

    // We dont need to translate to center to apply scale/rotation thanks to transform-origin

    const rotation = Number(transform.rotation);
    if (!isNaN(rotation))
      transformStr += 'rotate(' + transform.rotation + 'rad)';

    // use rotation for flip so we can animate it
    transformStr +=
        `rotateY(${transform.hflip === true ? Math.PI : 0}rad)` +
        `rotateX(${transform.vflip === true ? Math.PI : 0}rad)`;

    // scale
    const scale = Number(transform.scale);
    if (!isNaN(scale)) {
      let widthScale = transform.scale;
      let heightScale = transform.scale;
      /* TODO
      if (image) {
          if (image.rowPixelSpacing < image.columnPixelSpacing)
              widthScale = widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
          else if (image.columnPixelSpacing < image.rowPixelSpacing)
              heightScale = heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);
      }
      */

      transformStr += `scale(${widthScale},${heightScale})`;
    }

    return transformStr;
}
