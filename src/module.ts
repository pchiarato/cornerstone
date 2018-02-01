import { NgModule } from '@angular/core';

import { RenderersManagerProvider } from './renderer/manager';
import { Image2DProviders } from './image/2d_renderer';
import { ImageWebglProviders } from './image/webgl_renderer';
import { Lut2DProviders, LutWebglProviders } from './lut/index';
import { ImageViewComponent } from './component/imageview.component';
import { ImagePreviewComponent } from './component/preview.component';
import { glContextProvider } from './renderer/webgl/context';
import { TextureManagerProvider } from './renderer/webgl/texture.manager';
import { OffscreenWebglProvider } from './renderer/webgl/offscreen';
import { WebGLRendererProvider } from './renderer/webgl/index';
import { Canvas2DRendererProvider } from './renderer/2d/index';
import { RendererFactoryProvider } from './renderer/export';

@NgModule({
	declarations: [
		ImageViewComponent,
		ImagePreviewComponent
	],
	providers: [
		// renderers
		RendererFactoryProvider,
		RenderersManagerProvider,
			// 2D
			Canvas2DRendererProvider,
			// webgl related
			WebGLRendererProvider,
			glContextProvider,
			TextureManagerProvider,
			OffscreenWebglProvider,

		// image providers
		Image2DProviders,
		ImageWebglProviders,

		// lut providers
		Lut2DProviders,
		LutWebglProviders
	],
	exports: [
		ImageViewComponent,
		ImagePreviewComponent
	]
})
export class HealthyModule {}
