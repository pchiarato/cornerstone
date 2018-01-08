import { Provider } from '@angular/core';
import { Image } from './';
import { ImageRenderer2D, IMAGE_RENDERER_2D } from '../renderer/2d';

// TODO benchmark: we are doing an optimized loop when image and canvas have same size

/* TODO transformsStatement don't have the same requirement
 * not same var created to be consume:
 *  greyscale => v
 *  color => r,g,b
 */

export class GrayscaleRenderer implements ImageRenderer2D {
    match(image: Image) { return image.components === 1 }

    loopStatements(transformStatements: string) {
        // ~~ is not much faster nowaday but it's not slower either so keep it for older browsers.
        return `
            var displayIndex = 3,
                scale = Math.min(image.width / display.width, image.height / display.height);
            if (scale === 1) {
                var imageIndex = 0;
                while (displayIndex < displayLength) {
                    var v = imageData[imageIndex];
                    ${transformStatements}
                    displayData[displayIndex] = 255 - v;
                    displayIndex += 4;
                    imageIndex ++;
                }
            }
            else
                for (var y = 0, yl = display.height; y < yl; y++) {
                    for (var x = 0, xl = display.width; x < xl; x++) {
                        var v = imageData[ ~~(y*scale)*image.width + ~~(x*scale) ];
                        ${transformStatements}
                        displayData[ displayIndex ] = 255 - v;
                        displayIndex += 4;
                    }
                }
        `;
    }
}

export class ColorRenderer implements ImageRenderer2D {
    match(image: Image) { return image.components === 3 }

    loopStatements(transformStatements: string) {
        return `
            var displayIndex = 0,
                scale = Math.min(image.width / display.width, image.height / display.height);
            if (scale === 1) {
                var imageIndex = 0;
                while (displayIndex < displayLength) {
                    var r = imageData[imageIndex++],
                        g = imageData[imageIndex++],
                        b = imageData[imageIndex++];
                    ${transformStatements}
                    displayData[displayIndex++] = r;
                    displayData[displayIndex++] = g;
                    displayData[displayIndex++] = b;
                    displayData[displayIndex++] = 255;
                }
            }
            else {
                for (var y = 0, yl = display.height; y < yl; y++) {
                    for (var x = 0, xl = display.width; x < xl; x++) {
                        var imageIndex = (~~(y*scale)*image.width + ~~(x*scale))*3;
                        var r = imageData[imageIndex++],
                            g = imageData[imageIndex++],
                            b = imageData[imageIndex];
                        ${transformStatements}
                        displayData[displayIndex++] = r;
                        displayData[displayIndex++] = g;
                        displayData[displayIndex++] = b;
                        displayData[displayIndex++] = 255;
                    }
                }
            }
        `;
    }
}

export const Image2DProviders: Provider[] = [
    {
        provide: IMAGE_RENDERER_2D,
        multi: true,
        useClass: GrayscaleRenderer
    },
    {
        provide: IMAGE_RENDERER_2D,
        multi: true,
        useClass: ColorRenderer
    }
];
