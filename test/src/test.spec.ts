import { LutTypes } from '../../src/lut/base';
import { WindowingLutRendererWebgl } from '../../src/lut/windowing';
import { IdentityLutRendererWebgl } from '../../src/lut/invert';
import { loadTestSet, loadImage } from './loader';

import { Image } from '../../src/image';
import { Lut } from '../../src/lut';
import { ImageRendererWebgl, WebGLRenderer, LutRendererWebgl } from '../../src/renderer/webgl';
import { GrayscaleInt16Renderer, GrayscaleUint16Renderer } from '../../src/image/webgl_renderer';
import { RenderersManager } from '../../src/renderer/manager';

import { saveCanvas } from './generateMode';

import './matchers';


function mockRendererManager<T extends Lut>(imgRenderer: ImageRendererWebgl, lutRenderer?: LutRendererWebgl<T>): RenderersManager {
    return {
        getWebglRenderers(image: Image, lut: Lut) {
            return [0, imgRenderer, [lutRenderer || IdentityLutRendererWebgl]];
        }
    } as any;
}

function getGl() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    if (gl == null) {
        throw new Error('can\'t get webgl context');
    }

    return gl;
}

describe('Webgl Renderer', () => {

    describe('unsigned 16bit monochrome image', () => {
        it('It should not alter orinal pixel data on display', () => {
            const gl = getGl();
            const renderer = new WebGLRenderer(gl, mockRendererManager(GrayscaleUint16Renderer));
            const data = [
                10,  15,  125, 75,  86,   120, 58,  6,
                95,  121, 26,  224, 12,   255, 102, 3,
                12,  165, 45,  96,  52,   24,  26,  21,
                10,  225, 168, 52,  14,   186, 201, 93,
                52,  163, 59,  255, 1005, 120, 25,  75,
                152, 63,  159, 0,   95,   20,  125, 175,
                56,  86,  214, 2,   25,   65,  75,  769,
                45,  525, 10,  124, 163,  120, 215, 52,
            ];

            gl.canvas.width = 8;
            gl.canvas.height = 8;

            renderer.draw({
                width: 8,
                height: 8,
                components: 1,
                pixelData: new Uint16Array(data)
            });

            expect(gl).toDisplay( data.map(v => Math.min(v, 255)) );
        })
    })

    describe('signed 16bit monochrome image', () => {
        it('It should not alter orinal pixel data on display', () => {
            const gl = getGl();
            const renderer = new WebGLRenderer(gl, mockRendererManager(GrayscaleInt16Renderer));
            const data = [
                10,  15,  125, 75,  86,   120, 58,  6,
                95,  121, -26,  224, 12,   255, 102, 3,
                12,  165, 45,  96,  52,   -24,  26,  21,
                -10,  225, 168, 52,  14,   186, 201, 93,
                52,  163, 59,  255, -1005, 120, 25,  75,
                -152, 63,  159, 0,   95,   -20,  125, 175,
                56,  86,  214, 2,   1025,   65,  75,  769,
                45,  525, 10,  124, 163,  120, 215, 52,
            ];

            gl.canvas.width = 8;
            gl.canvas.height = 8;

            renderer.draw({
                width: 8,
                height: 8,
                components: 1,
                pixelData: new Int16Array(data)
            });

            expect(gl).toDisplay( data.map(v => Math.max(Math.min(v, 255), 0) ));
        })

        it('should apply windowing lut', () => {
            const gl = getGl();
            const renderer = new WebGLRenderer(gl, mockRendererManager(GrayscaleInt16Renderer, WindowingLutRendererWebgl));

            return loadTestSet(gl, 'MR')
                .then(([img, result]) => {
                    renderer.draw(img, [{type: LutTypes.WINDOWING, width: 87, center: 1068}]);

                    expect(gl).toDisplay(result);
                });
        })
    })

    it('should not have context conflicts', () => {
        return loadImage('MR')
            .then(img => {
                const firstGl = getGl();
                const debugInfo = firstGl.getExtension('WEBGL_debug_renderer_info');

                const hardwareId =
                    firstGl.getParameter(firstGl.RENDERER) + ' ' +
                    firstGl.getParameter(firstGl.VENDOR) + ' ' +
                    firstGl.getParameter(firstGl.VERSION) + ' ' +
                    firstGl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + ' ' +
                    firstGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                ;

                // TODO better test, maybe add a test that needs to fail to be sure our hardware is not too powerful
                if (hardwareId !== 'WebKit WebGL WebKit WebGL 1.0 (OpenGL ES 2.0 Chromium) Google Inc. Google SwiftShader')
                    console.warn('Your hardware seems to have changed since the creation of the test. That test may not fail due to a more powerfull hardware !')

                for (let i = 0; i < 50; i++) {
                    const gl = i === 0 ? firstGl : getGl();

                    gl.canvas.width = img.width;
                    gl.canvas.height = img.height;
                    new WebGLRenderer(gl, mockRendererManager(GrayscaleInt16Renderer, WindowingLutRendererWebgl))
                        .draw(img);
                }

                expect(firstGl).notBeBlank();
            })
    })
})
