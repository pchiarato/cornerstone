function compareMonochrome(dataRead: Uint8Array | Uint8ClampedArray, expected: ArrayBufferView, width: number, height: number) {
	if (dataRead.length / 4 !== (<any>expected).length) {
		return {
			pass: false,
			message: `pixel data length was ${dataRead.length} while expecting ${(<any>expected).length * 4}`,
		};
	}

	const index = (() => {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = y * width + x;
				const j = i * 4;

				if (dataRead[j] !== expected[i] ||
					dataRead[j + 1] !== expected[i] ||
					dataRead[j + 2] !== expected[i] ||
					dataRead[j + 3] !== 255) {
					return i;
				}
			}
		}
	})();

	if (index != null) {
		return {
			pass: false,
			message: `Pixels not matching, first error at index ${index}`,
		};
	}

	return { pass: true };
}

function compare2D(ctx: CanvasRenderingContext2D, expected: Uint8Array) {
	return {
		pass: true
	};
}

beforeAll(() => {
	jasmine.addMatchers({
		toDisplay(util) {
			return {
				compare(canvas: HTMLCanvasElement, expected: ArrayBufferView | ArrayBuffer | number[]) {
					if (canvas == null) {
						return {
							pass: false,
							message: 'canvas is null.'
						};
					}

					const width = canvas.width;
					const height = canvas.height;
					const normalizedExpected = ArrayBuffer.isView(expected) ? expected : new Uint8Array(expected);

					let dataRead: Uint8Array | Uint8ClampedArray;
					const gl = canvas.getContext('webgl');

					if (gl != null ) {
						dataRead = new Uint8Array(width * height * 4);
						gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, dataRead);

						// code from https://stackoverflow.com/a/41973289/873229
						const halfHeight = height / 2 | 0; // the | 0 keeps the result an int
						const bytesPerRow = width * 4;

						const row = new Uint8Array(width * 4);
						for (let y = 0; y < halfHeight; ++y) {
							const topOffset = y * bytesPerRow;
							const bottomOffset = (height - y - 1) * bytesPerRow;

							row.set(dataRead.subarray(topOffset, topOffset + bytesPerRow));
							dataRead.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);
							dataRead.set(row, bottomOffset);
						}
					} else {
						dataRead = canvas.getContext('2d')
							.getImageData(0, 0, width, height).data;
					}

					// TODO other
					return compareMonochrome(dataRead, normalizedExpected, width, height);
				}
			};
		},
		notBeBlank(util) {
			return {
				compare(canvas: HTMLCanvasElement) {
					if (canvas = null)
						return {
							pass: false,
							message: 'Canvas is null.'
						};

					let dataRead: Uint8Array | Uint8ClampedArray;
					const gl = canvas.getContext('webgl');

					if (gl != null) {
						dataRead = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
						gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, dataRead);
					} else {
						const ctx = canvas.getContext('2d');
						dataRead = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
					}

					for (let i = 0; i < dataRead.length; i++) {
						if (dataRead[i] !== 255)
							return { pass: true };
					}

					return {
						pass: false,
						message: 'Canvas is blank'
					};
				}
			};
		}
	});
});

export interface CanvasMatchers {
	toDisplay(expected: ArrayBufferView | ArrayBuffer | number[]): boolean;
	notBeBlank<WebGLRenderingContext>(): boolean;
}

declare global {
	function expect(canvas: HTMLCanvasElement): CanvasMatchers;
}
