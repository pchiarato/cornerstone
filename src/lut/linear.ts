import { BaseLut, LutTypes } from './index';
import { Image } from '../image';
import { LutRenderer2D } from '../renderer/2d';
import { LutRendererWebgl } from '../renderer/webgl';

export interface LinearLut extends BaseLut {
	type: LutTypes.LINEAR;
    slope: number;
    intercept: number;
}

export const LinearLut = {
	match: (lut: BaseLut): lut is LinearLut =>
		(<LinearLut>lut).slope !== undefined && (<LinearLut>lut).intercept !== undefined,
	isCompatible: (image: Image) => image.components === 1
}

export function LinearLutRenderer2D(): LutRenderer2D<LinearLut> {
    return {
        match: LinearLut.match,

        argName: 'linearLut',
        initStatements: 'var slope = linearLut.slope, intercept = linearLut.intercept',
        transformStatements: 'v = v * slope + intercept'
    };
}

export function LinearLutRendererWebgl(): LutRendererWebgl<LinearLut> {
    return {
        match: LinearLut.match,

        initShaderStatements: 'uniform vec2 u_lut;',
        transformShaderStatements: 'v = v * u_lut.x + u_lut.y;',
        updateValues: (gl: WebGLRenderingContext, program: WebGLProgram, lut: LinearLut) => {
            const lutLocation = gl.getUniformLocation(program, 'u_lut');
            if (lutLocation === -1) console.error('unable to get attribute u_lut');

            gl.uniform2f(lutLocation, lut.slope, lut.intercept);
        }
    };
}
