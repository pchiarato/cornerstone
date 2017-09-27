import { Provider } from '@angular/core';
import { Image } from './';
import { ImageRendererWebgl, IMAGE_RENDERER_WEBGL } from '../renderer/webgl';

function GrayscaleUint16(): ImageRendererWebgl {
    return {
        match: (image: Image) => image.components === 1 && image.pixelData instanceof Uint16Array,

        // webgl
        buildTexture: (gl: WebGLRenderingContext, image: Image) => {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2);
        gl.pixelStorei(gl.PACK_ALIGNMENT, 2);

        const data = new Uint8Array(image.pixelData.buffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, image.width, image.height, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, data);
        },
        colorStatements: 'float color = t.r*255.0 + t.a*255.*256.; v = vec4(color, color, color, 255.);'
    };
}

function GrayscaleInt16(): ImageRendererWebgl {
    return {
        match: (image: Image) => image.components === 1 && image.pixelData instanceof Int16Array,

        // webgl
        buildTexture: (gl: WebGLRenderingContext, image: Image) => {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2);
        gl.pixelStorei(gl.PACK_ALIGNMENT, 2);

        const data = new Uint8Array(image.pixelData.buffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, image.width, image.height, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, data);
        },
        colorStatements: `
            float color = t.r*255.0 + t.a*255.*256.;
            if(color > 32767.) color = color - 65536.;
            v = vec4(color, color, color, 255.);
        `
    };
}

function ColorUint8(): ImageRendererWebgl {
    return {
        match: (image: Image) => image.components === 3 &&
            (image.pixelData instanceof Uint8Array || image.pixelData instanceof Uint8ClampedArray),

        // webgl
        buildTexture: (gl: WebGLRenderingContext, image: Image) => {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);

        // see https://github.com/KhronosGroup/WebGL/issues/1533
        const data = image.pixelData instanceof Uint8ClampedArray ?
            new Uint8Array(image.pixelData.buffer) :
            image.pixelData;

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, image.width, image.height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
        },
        colorStatements: 'v = vec4(t.r*255., t.g*255., t.b*255., 255.);'
    };
}

/** export **/

// we use factory function and not value directly so it can be lazy loaded
// TODO same could be achieve with classes, would it be better ?
export const ImageWebglProviders: Provider[] =
    [
        GrayscaleUint16,
        GrayscaleInt16,
        ColorUint8
    ]
    .map(f => ({
        provide: IMAGE_RENDERER_WEBGL,
        multi: true,
        useFactory: f
    }) );
