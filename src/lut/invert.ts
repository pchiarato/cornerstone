import { BaseLut, LutTypes } from './base';
import { LutRenderer2D } from '../renderer/2d';
import { LutRendererWebgl } from '../renderer/webgl';

export interface InvertLut extends BaseLut {
	type: LutTypes.INVERSE;
	invert?: boolean;
}

export const InvertLut = {
	match: (lut: BaseLut): lut is InvertLut =>
		lut.type === LutTypes.INVERSE && (<InvertLut>lut).invert !== false,
	isCompatible: () => true
}

export const InvertLutRenderer2D: LutRenderer2D = {
    match: InvertLut.match,

    argName: 'invertLut',
    initStatements: '',
    transformStatements: 'v = 255 - v;',
}

export const InvertLutRendererWebgl: LutRendererWebgl<InvertLut> = {
    match: InvertLut.match,

    initShaderStatements: '',
    // TODO probably more efficient way to do that
    transformShaderStatements: 'v = vec4(255. - v.r, 255. - v.g, 255. - v.b, v.a);',
    updateValues: () => { }
}

/************ Identity (special invert) ************/
export interface IdentityLut extends BaseLut {
	type: LutTypes.INVERSE;
	invert: false;
}

export const IdentityLut = {
	match: (lut: BaseLut): lut is IdentityLut =>
		lut.type === LutTypes.INVERSE && (<IdentityLut>lut).invert === false,
	isCompatible: () => true
}

export const IdentityLutRenderer2D: LutRenderer2D = {
    match: IdentityLut.match,

    argName: 'identityLut',
    initStatements: '',
    transformStatements: ''
}

export const IdentityLutRendererWebgl: LutRendererWebgl<IdentityLut> = {
    match: IdentityLut.match,

    initShaderStatements: '',
    transformShaderStatements: '',
    updateValues: () => { }
}

