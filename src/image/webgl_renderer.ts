import { Provider } from '@angular/core';
import { Image } from './';
import { ImageRendererWebgl, IMAGE_RENDERER_WEBGL } from '../renderer/webgl/index';

// must be exported for metadata.json...
export function buildTexture16(gl: WebGLRenderingContext, image: Image) {
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2);
	gl.pixelStorei(gl.PACK_ALIGNMENT, 2);

	const { pixelData } = image;
	const data = new Uint8Array(pixelData.buffer, pixelData.byteOffset, pixelData.byteLength);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, image.width, image.height, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, data);
}
// must be exported for metadata.json...
export function colorStatements16(signed = false) {
	let statement = 'float color = t.r*255.0 + t.a*255.*256.;';

	if (signed) {
		statement += 'if(color > 32767.) color = color - 65536.;';
	}

	statement += 'v = vec4(color, color, color, 255.);';

	return statement;
}

export const GrayscaleUint16Renderer: ImageRendererWebgl = {
	colorStatements: colorStatements16(),

	match(image: Image) { return image.components === 1 && image.pixelData instanceof Uint16Array; },

	// webgl
	buildTexture: buildTexture16
};

export const GrayscaleInt16Renderer: ImageRendererWebgl = {
	colorStatements: colorStatements16(true),

	match(image: Image) { return image.components === 1 && image.pixelData instanceof Int16Array; },

	// webgl
	buildTexture: buildTexture16
};

export const ColorUint8Renderer: ImageRendererWebgl = {
	colorStatements: 'v = vec4(t.r*255., t.g*255., t.b*255., 255.);',

	match(image: Image) { return image.components === 3 &&
		(image.pixelData instanceof Uint8Array || image.pixelData instanceof Uint8ClampedArray);
	},

	// webgl
	buildTexture(gl: WebGLRenderingContext, image: Image) {
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.pixelStorei(gl.PACK_ALIGNMENT, 1);

		const { pixelData } = image;
		// see https://github.com/KhronosGroup/WebGL/issues/1533
		const data = pixelData instanceof Uint8ClampedArray ?
			new Uint8Array(pixelData.buffer, pixelData.byteOffset, pixelData.byteLength) :
			pixelData;

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, image.width, image.height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
	}
};

export const ImageWebglProviders: Provider[] = [
	{
		provide: IMAGE_RENDERER_WEBGL,
		multi: true,
		useValue: GrayscaleUint16Renderer
	},
	{
		provide: IMAGE_RENDERER_WEBGL,
		multi: true,
		useValue: GrayscaleInt16Renderer
	},
	{
		provide: IMAGE_RENDERER_WEBGL,
		multi: true,
		useValue: ColorUint8Renderer
	}
];
