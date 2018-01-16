import { NgModule } from '@angular/core';

import { RenderersManager } from './renderer/manager';
import { Image2DProviders } from './image/2d_renderer';
import { ImageWebglProviders } from './image/webgl_renderer';
import { Lut2DProviders, LutWebglProviders } from './lut/index';

import { ImageViewComponent } from './component/imageview.component';
import { ImagePreviewComponent } from './component/preview.component';

@NgModule({
	declarations: [
		ImageViewComponent,
		ImagePreviewComponent
	],
	providers: [
		RenderersManager,

		Image2DProviders,
		ImageWebglProviders,

		Lut2DProviders,
		LutWebglProviders
	],
	exports: [
		ImageViewComponent,
		ImagePreviewComponent
	]
})
export class HealthyModule {}
