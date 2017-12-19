import { Provider } from '@angular/core/core';
import { LUT_RENDERER_2D } from '../renderer/2d';
import { LUT_RENDERER_WEBGL } from '../renderer/webgl';

import { IdentityLutRenderer2D, IdentityLutRendererWebgl, InvertLutRenderer2D, InvertLutRendererWebgl, IdentityLut, InvertLut } from './invert';
import { LinearLutRenderer2D, LinearLutRendererWebgl, LinearLut } from './linear';
import { WindowingLutRenderer2D, WindowingLutRendererWebgl, ThresholdWindowingLutRenderer2D, ThresholdWindowingLutRendererWebgl, WindowingLut } from './windowing';


export interface BaseLut {
	type: LutTypes;
}

export const enum LutTypes {
	INVERSE,
	LINEAR,
	WINDOWING
}

export type Lut = IdentityLut | InvertLut | LinearLut | WindowingLut;

export const Lut2DProviders: Provider[] =
	[
		IdentityLutRenderer2D,
		InvertLutRenderer2D,
		LinearLutRenderer2D,
		WindowingLutRenderer2D,
		ThresholdWindowingLutRenderer2D
	]
	.map( f => ({
			provide: LUT_RENDERER_2D,
			multi: true,
			useFactory: f
	}) );

export const LutWebglProviders: Provider[] =
	[
		IdentityLutRendererWebgl,
		InvertLutRendererWebgl,
		LinearLutRendererWebgl,
		WindowingLutRendererWebgl,
		ThresholdWindowingLutRendererWebgl
	]
	.map( f => ({
			provide: LUT_RENDERER_WEBGL,
			multi: true,
			useFactory: f
	}) );
