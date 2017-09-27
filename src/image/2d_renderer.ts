import { Provider } from '@angular/core';
import { Image } from './';
import { ImageRenderer2D, IMAGE_RENDERER_2D } from '../renderer/2d';

// TODO transformsStatement don't have the same requirement

function Grayscale(): ImageRenderer2D {
    return {
        match: (image: Image) => image.components === 1,

        initStatements: `
            var pixelData = img.pixelData,
                imgDataData = imgData.data,
                i_imgData = 3,
                i_pixelData = 0,
                length = pixelData.length;
        `,
        loopStatements(transformStatements: string) {
            return `
                while (i_pixelData < length) {
                    var v = pixelData[i_pixelData++];
                    ${transformStatements}
                    imgDataData[i_imgData] = 255 - v;
                    i_imgData += 4;
                }
            `;
        }
    };
}

function Color(): ImageRenderer2D {
    return {
        match: (image: Image) => image.components === 3,

        initStatements: `
            var pixelData = img.pixelData,
                imgDataData = imgData.data,
                i_imgData = 0,
                i_pixelData = 0,
                length = pixelData.length;
        `,
        loopStatements(transformStatements: string) {
            return `
                while (i_pixelData < length) {
                    var r = pixelData[i_pixelData++],
                        g = pixelData[i_pixelData++],
                        b = pixelData[i_pixelData++];
                    ${transformStatements}
                    imgDataData[i_imgData++] = r;
                    imgDataData[i_imgData++] = g;
                    imgDataData[i_imgData++] = b;
                    imgDataData[i_imgData++] = 255;
                }
            `;
        }
    };
}

// we use factory function and not value directly so it can be lazy loaded
// TODO same could be achieve with classes, would it be better ?
export const Image2DProviders: Provider[] =
    [
        Grayscale,
        Color
    ]
    .map(f => ({
        provide: IMAGE_RENDERER_2D,
        multi: true,
        useFactory: f
    }) );
