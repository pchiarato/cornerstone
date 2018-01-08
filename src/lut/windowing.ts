import { LutTypes, BaseLut } from './';
import { Image } from '../image';
import { LutRendererWebgl } from '../renderer/webgl';
import { LutRenderer2D } from '../renderer/2d';

export interface WindowingLut extends BaseLut {
	type: LutTypes.WINDOWING;
    center: number;
    width: number;
}

// TODO see if we use that pattern
export const WindowingLut = {
	match: (lut: BaseLut): lut is WindowingLut => lut.type === LutTypes.WINDOWING,
	isCompatible: (image: Image) => image.components === 1
}

export const WindowingLutRenderer2D: LutRenderer2D = {
    match: WindowingLut.match,

    argName: 'windowingLut',
    initStatements: 'var c = windowingLut.center - .5, w = windowingLut.width - 1',
    transformStatements: 'v = ((v - c) / w + .5) * 255'
}

export const WindowingLutRendererWebgl: LutRendererWebgl<WindowingLut> = {
    match: WindowingLut.match,

    // webgl
    initShaderStatements: 'uniform vec2 u_lut;',
    transformShaderStatements: 'float wl_color = ((v.x - u_lut.x - 0.5) / ( u_lut.y - 1.) + .5) * 255.; v = vec4(wl_color, wl_color, wl_color, 255.);',
    updateValues: (gl: WebGLRenderingContext, program: WebGLProgram, lut: WindowingLut) => {
        const lutLocation = gl.getUniformLocation(program, 'u_lut');
        if (lutLocation === -1) console.error('unable to get attribute lut');

        gl.uniform2f(lutLocation, lut.center, lut.width);
    }
}

export interface ThresholdWindowingLut extends WindowingLut {
    width: 1;
}

export const ThresholdWindowingLutRenderer2D: LutRenderer2D = {
    match: (lut: BaseLut): lut is ThresholdWindowingLut =>
        lut && (<ThresholdWindowingLut>lut).center !== undefined && (<ThresholdWindowingLut>lut).width === 1,

    argName: 'thresholdwindowingLut',
    initStatements: 'var c = thresholdwindowingLut.center - .5',
    transformStatements: 'v = v <= c ? 0 : 255'
}

export const ThresholdWindowingLutRendererWebgl: LutRendererWebgl<ThresholdWindowingLut> = {
    match: (lut: BaseLut): lut is ThresholdWindowingLut =>
        lut && (<ThresholdWindowingLut>lut).center !== undefined && (<ThresholdWindowingLut>lut).width === 1,

    initShaderStatements: 'uniform float u_center;',
    transformShaderStatements: 'v = v <= u_center ? 0. : 255.;',
    updateValues: (gl: WebGLRenderingContext, program: WebGLProgram, lut: ThresholdWindowingLut) => {
        const lutLocation = gl.getUniformLocation(program, 'u_center');
        if (lutLocation === -1) console.error('unable to get attribute center');

        gl.uniform1f(lutLocation, lut.center - .5);
    }
}
