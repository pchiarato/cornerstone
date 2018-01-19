beforeAll(() => {
    jasmine.addMatchers({
        toDisplay(util) {
            return {
                compare(gl: WebGLRenderingContext, expected: ArrayBuffer | number[]) {
                    const dataRead = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, dataRead);

                    const expectedView = Array.isArray(expected) ? expected : new Uint8Array(expected);

                    // TODO / 4 if monochrome

                    if (dataRead.length / 4 !== expectedView.length) {
                        return {
                            pass: false,
                            message: `pixel data length was ${dataRead.length} while expecting ${expectedView.length * 4}`,
                        };
                    }

                    const index = (() => {
                        for (let y = 0; y < gl.drawingBufferHeight; y++) {
                            for (let x = 0; x < gl.drawingBufferWidth; x++) {
                                const i = y * gl.drawingBufferWidth + x;
                                const j = ((gl.drawingBufferHeight - 1 - y) * gl.drawingBufferWidth + x) * 4;

                                if (dataRead[j] !== expectedView[i] ||
                                    dataRead[j + 1] !== expectedView[i] ||
                                    dataRead[j + 2] !== expectedView[i] ||
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
            }
        },
        notBeBlank(util) {
            return {
                compare(gl: WebGLRenderingContext) {
                    const dataRead = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, dataRead);

                    for (let i = 0; i < dataRead.length; i++) {
                        if (dataRead[i] !== 255)
                            return { pass: true }
                    }

                    return {
                        pass: false,
                        message: 'Canvas is blank'
                    };
                }
            }
        }
    })
});

declare namespace jasmine {
    interface Matchers<T> {
        toDisplay<WebGLRenderingContext>(expected: ArrayBuffer | number[]): boolean;
        notBeBlank<WebGLRenderingContext>(): boolean;
    }
}
