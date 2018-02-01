import { Provider } from '@angular/core';
import { LUT_RENDERER_2D } from '../renderer/2d/index';
import { LUT_RENDERER_WEBGL } from '../renderer/webgl/index';

import { IdentityLutRenderer2D, IdentityLutRendererWebgl, InvertLutRenderer2D, InvertLutRendererWebgl, IdentityLut, InvertLut } from './invert';
import { LinearLutRenderer2D, LinearLutRendererWebgl, LinearLut } from './linear';
import { WindowingLutRenderer2D, WindowingLutRendererWebgl, ThresholdWindowingLutRenderer2D, ThresholdWindowingLutRendererWebgl, WindowingLut } from './windowing';

export type Lut = IdentityLut | InvertLut | LinearLut | WindowingLut;

export const Lut2DProviders: Provider[] = [
	{
		provide: LUT_RENDERER_2D,
		multi: true,
		useValue: IdentityLutRenderer2D
	},
	{
		provide: LUT_RENDERER_2D,
		multi: true,
		useValue: InvertLutRenderer2D
	},
	{
		provide: LUT_RENDERER_2D,
		multi: true,
		useValue: LinearLutRenderer2D
	},
	{
		provide: LUT_RENDERER_2D,
		multi: true,
		useValue: WindowingLutRenderer2D
	},
	{
		provide: LUT_RENDERER_2D,
		multi: true,
		useValue: ThresholdWindowingLutRenderer2D
	}
];

export const LutWebglProviders: Provider[] = [
	{
		provide: LUT_RENDERER_WEBGL,
		multi: true,
		useValue: IdentityLutRendererWebgl
	},
	{
		provide: LUT_RENDERER_WEBGL,
		multi: true,
		useValue: InvertLutRendererWebgl
	},
	{
		provide: LUT_RENDERER_WEBGL,
		multi: true,
		useValue: LinearLutRendererWebgl
	},
	{
		provide: LUT_RENDERER_WEBGL,
		multi: true,
		useValue: WindowingLutRendererWebgl
	},
	{
		provide: LUT_RENDERER_WEBGL,
		multi: true,
		useValue: ThresholdWindowingLutRendererWebgl
	}
];
