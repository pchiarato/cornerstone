import { createWebglSpy, Spy } from './webglrenderingcontext.mock';
import { TextureManager } from '../../../src/renderer/webgl/texture.manager';
import { GrayscaleUint16Renderer } from '../../../src/image/webgl_renderer';
import { Image } from '../../../src/image/index';

const imgRenderer = GrayscaleUint16Renderer;

// TODO utils
function emptyImage(width = 5, height = 5): Image {
	return {
		width, height,
		components: 1,
		pixelData: new Uint16Array(width * height)
	};
}

const defaultMaxTexCount = 5;

describe('Texture Manager', () => {
	let gl: Spy<WebGLRenderingContext>;
	let texManager: TextureManager;
	let imgBuildSpy: jasmine.Spy;

	function checkActiveTextureCall(maxTextureCount = defaultMaxTexCount) {
		expect(gl.activeTexture).toHaveBeenCalled();
		expect(gl.activeTexture.calls.first().args).toBeGreaterThanOrEqual(gl.TEXTURE0);
		expect(gl.activeTexture.calls.first().args).toBeLessThanOrEqual(gl.TEXTURE0 + maxTextureCount);
	}

	beforeEach(() => {
		gl = createWebglSpy(defaultMaxTexCount);
		texManager = new TextureManager(gl);

		imgBuildSpy = spyOn(imgRenderer, 'buildTexture');
	});

	// gl.getError.and.returnValue(gl.OUT_OF_MEMORY);

	it('should create and activate the texture', () => {
		texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);

		checkActiveTextureCall();
		expect(gl.createTexture).toHaveBeenCalled();
		expect(imgBuildSpy).toHaveBeenCalled();
	});

	it('should use new texture for unknown symbol', () => {
		texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);

		const texId = gl.activeTexture.calls.first().args[0];
		gl.createTexture.calls.reset();
		gl.activeTexture.calls.reset();
		imgBuildSpy.calls.reset();

		texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);

		checkActiveTextureCall();
		expect(gl.activeTexture).not.toHaveBeenCalledWith(texId);
		expect(gl.createTexture).toHaveBeenCalled();
		expect(imgBuildSpy).toHaveBeenCalled();
	});

	it('should reuse cached texture as in', () => {
		const symbol = Symbol();
		const image = emptyImage();

		texManager.bindTexture(symbol, image, imgRenderer);

		const texId = gl.activeTexture.calls.first().args[0];
		gl.createTexture.calls.reset();
		gl.activeTexture.calls.reset();
		imgBuildSpy.calls.reset();

		texManager.bindTexture(symbol, image, imgRenderer);

		expect(gl.activeTexture).not.toHaveBeenCalled();
		expect(gl.createTexture).not.toHaveBeenCalled();
		expect(imgBuildSpy).not.toHaveBeenCalled();
	});

	it('should reuse cached texture and refresh image', () => {
		const symbol = Symbol();

		texManager.bindTexture(symbol, emptyImage(), imgRenderer);

		const texId = gl.activeTexture.calls.first().args[0];
		gl.createTexture.calls.reset();
		gl.activeTexture.calls.reset();
		imgBuildSpy.calls.reset();

		texManager.bindTexture(symbol, emptyImage(), imgRenderer);

		expect(gl.createTexture).not.toHaveBeenCalled();
		expect(gl.activeTexture).toHaveBeenCalledWith(texId);
		expect(imgBuildSpy).toHaveBeenCalled();
	});

	it('should clear the texture', () => {
		const symbol = Symbol();

		texManager.bindTexture(symbol, emptyImage(), imgRenderer);

		const texture = gl.createTexture.calls.mostRecent().returnValue;

		texManager.clearTexture(symbol);

		expect(gl.deleteTexture).toHaveBeenCalledWith(texture);
	});

	it('should clear the least used texture when there is no more available', () => {
		const ctx = [];
		for (let i = 0; i < defaultMaxTexCount; i++) {
			texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);
			const id = gl.activeTexture.calls.mostRecent().args[0];
			const texture = gl.createTexture.calls.mostRecent().returnValue;

			ctx.push({id, texture});
		}

		for (let i = 0; i < defaultMaxTexCount; i++) {
			const c = ctx[i];

			texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);
			expect(gl.deleteTexture).toHaveBeenCalledWith(c.texture);
			expect(gl.activeTexture).toHaveBeenCalledWith(c.id);
		}
	});

	it('should clear the least used textures until there is enough memory', () => {
		const ctx = [];
		for (let i = 0; i < defaultMaxTexCount; i++) {
			texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);
			const id = gl.activeTexture.calls.mostRecent().args[0];
			const texture = gl.createTexture.calls.mostRecent().returnValue;

			ctx.push({id, texture});
		}

		let count = 0;
		gl.getError.and.callFake( () =>
			count++ < 2 ? gl.OUT_OF_MEMORY : gl.NO_ERROR
		);

		texManager.bindTexture(Symbol(), emptyImage(), imgRenderer);

		expect(gl.deleteTexture).toHaveBeenCalledWith(ctx[0].texture);
		expect(gl.deleteTexture).toHaveBeenCalledWith(ctx[1].texture);
		checkActiveTextureCall();
	});

	it('should throw for any error other than out of memory', () => {
		[gl.INVALID_ENUM, gl.INVALID_VALUE, gl.INVALID_OPERATION,
			gl.INVALID_FRAMEBUFFER_OPERATION, gl.CONTEXT_LOST_WEBGL]
			.forEach( err => {
				gl.getError.and.returnValue(err);

				expect( () => texManager.bindTexture(Symbol(), emptyImage(), imgRenderer))
					.toThrow();
			});
	});

});
