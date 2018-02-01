/* TODO component
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
		});
});
*/

const a = 0;
