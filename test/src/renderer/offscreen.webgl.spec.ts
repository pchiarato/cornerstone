import { Lut } from '../../../src/lut/index';
import { ImageRendererWebgl, LutRendererWebgl } from '../../../src/renderer/webgl';
import { IdentityLutRendererWebgl } from '../../../src/lut/invert';
import { Image } from '../../../src/image/index';
import { RenderersManager } from '../../../src/renderer/manager';
import { OffscreenWebglRenderer } from '../../../src/renderer/webgl/offscreen';
import { TextureManager } from '../../../src/renderer/webgl/texture.manager';
import { GrayscaleUint16Renderer, GrayscaleInt16Renderer } from '../../../src/image/webgl_renderer';
import { WindowingLutRendererWebgl } from '../../../src/lut/windowing';
import { LutTypes } from '../../../src/lut/base';
import { loadTestSet } from '../loader';
import { showCanvas } from '../generateMode';
import '../matchers';


function mockRendererManager<T extends Lut>(imgRenderer: ImageRendererWebgl, lutRenderer?: LutRendererWebgl<T>): RenderersManager {
	return {
		getWebglRenderers(image: Image, lut: Lut) {
			return [0, imgRenderer, [lutRenderer || IdentityLutRendererWebgl]];
		}
	} as any;
}

function getGl() {
	const canvas = document.createElement('canvas');
	canvas.width = 10;
	canvas.height = 10;
	showCanvas(canvas);

	const gl = canvas.getContext('webgl');

	if (gl == null) {
		throw new Error('can\'t get webgl context');
	}

	return gl;
}

function getWebglRenderer<T extends Lut>(imgRenderer: ImageRendererWebgl, lutRenderer?: LutRendererWebgl<T>) {
	const gl = getGl();

	return new OffscreenWebglRenderer(gl, new TextureManager(gl), mockRendererManager(imgRenderer, lutRenderer));
}

describe('Webgl Renderer', () => {

	describe('texture related', () => {
		fit('It should correctly swap between images', () => {
			const renderer = getWebglRenderer(GrayscaleUint16Renderer);
			const data1 = [
				10,  15,  125, 75,  86,   120, 58,  6,
				95,  121, 26,  224, 12,   255, 102, 3,
				12,  165, 45,  96,  52,   24,  26,  21,
				10,  225, 168, 52,  14,   186, 201, 93,
				52,  163, 59,  255, 1005, 120, 25,  75,
				152, 63,  159, 0,   95,   20,  125, 175,
				56,  86,  214, 2,   25,   65,  75,  769,
				46,  525, 10,  124, 163,  120, 215, 52,
			];

			const data2 = [
				10,  45,  125, 75,  86,   120, 58,  6,
				95,  121, 26,  224, 12,   255, 102, 3,
				12,  165, 55,  96,  52,   58,  26,  21,
				10,  225, 168, 32,  14,   186, 201, 93,
				52,  163, 59,  255, 1005, 120, 25,  75,
				152, 63,  159, 0,   58,   20,  125, 175,
				56,  86,  214, 2,   25,   36,  75,  769,
				46,  525, 10,  124, 163,  120, 215, 52,
			];

			const symbol1 = Symbol();
			const img1 = {
				width: 8,
				height: 8,
				components: 1,
				pixelData: new Uint16Array(data1)
			};

			const symbol2 = Symbol();
			const img2 = {
				width: 8,
				height: 8,
				components: 1,
				pixelData: new Uint16Array(data2)
			};

			expect(
				renderer.draw(symbol1, img1, [])
			).toDisplay( data1.map(v => Math.min(v, 255)) );

			expect(
				renderer.draw(symbol2, img2, [])
			).toDisplay( data2.map(v => Math.min(v, 255)) );

			expect(
				renderer.draw(symbol1, img1, [])
			).toDisplay( data1.map(v => Math.min(v, 255)) );

			expect(
				renderer.draw(symbol2, img2, [])
			).toDisplay( data2.map(v => Math.min(v, 255)) );
		});
	});

	describe('unsigned 16bit monochrome image', () => {
		it('It should not alter orinal pixel data on display', () => {
			const renderer = getWebglRenderer(GrayscaleUint16Renderer);
			const data = [
				10,  15,  125, 75,  86,   120, 58,  6,
				95,  121, 26,  224, 12,   255, 102, 3,
				12,  165, 45,  96,  52,   24,  26,  21,
				10,  225, 168, 52,  14,   186, 201, 93,
				52,  163, 59,  255, 1005, 120, 25,  75,
				152, 63,  159, 0,   95,   20,  125, 175,
				56,  86,  214, 2,   25,   65,  75,  769,
				46,  525, 10,  124, 163,  120, 215, 52,
			];

			expect(
				renderer.draw(Symbol(), {
					width: 8,
					height: 8,
					components: 1,
					pixelData: new Uint16Array(data)
				}, [])
			).toDisplay( data.map(v => Math.min(v, 255)) );
		});
	});

	describe('signed 16bit monochrome image', () => {
		it('It should not alter orinal pixel data on display', () => {
			const renderer = getWebglRenderer(GrayscaleInt16Renderer);
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

			expect(
				renderer.draw(Symbol(), {
					width: 8,
					height: 8,
					components: 1,
					pixelData: new Int16Array(data)
				}, [])
			).toDisplay( data.map(v => Math.max(Math.min(v, 255), 0) ));
		});

		it('should apply windowing lut', () => {
			const renderer = getWebglRenderer(GrayscaleInt16Renderer, WindowingLutRendererWebgl);

			return loadTestSet('MR')
				.then(([img, result]) => {
					expect(
						renderer.draw(Symbol(), img, [{type: LutTypes.WINDOWING, width: 87, center: 1068}])
					).toDisplay(result);
				});
		});

		/* TODO
			- update luts when lut changes
			- update shader when image/lut renderer combinaison changes
			- update lut when shader has changed
			- does not mix textures
		*/
	});
});

