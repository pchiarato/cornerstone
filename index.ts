import { NgModule } from '@angular/core';

import { RenderersManager } from './src/renderer/manager';
import { Image2DProviders } from './src/image/2d_renderer';
import { ImageWebglProviders } from './src/image/webgl_renderer';
import { Lut2DProviders, LutWebglProviders } from './src/lut';

import { ImageViewComponent } from './src/component/imageview.component';

@NgModule({
	declarations: [
		ImageViewComponent
	],
	providers: [
		RenderersManager,

		Image2DProviders,
		ImageWebglProviders,

		Lut2DProviders,
		LutWebglProviders
	],
	exports: [
		ImageViewComponent
	]
})
export class HealthyModule {}

export { Image } from './src/image';

export { Lut, LutTypes } from './src/lut';
export { InvertLut, IdentityLut } from './src/lut/invert';
export { LinearLut } from './src/lut/linear';
export { WindowingLut } from './src/lut/windowing';

export { Transform } from './src/transform';
