import { Injector, SkipSelf, Optional, Provider } from '@angular/core';
import { WebGLRendererBuilder } from './webgl';
import { Canvas2DRendererBuilder } from './2d';
import { RendererBuilder, RENDERER_BUILDER } from './index';

export function factory(parent: RendererBuilder | null, injector: Injector) {
	if (parent != null) return parent;

	const webglFactory = injector.get(WebGLRendererBuilder);
	if (webglFactory != null)
		return webglFactory;

	return injector.get(Canvas2DRendererBuilder);
}

export const RendererFactoryProvider: Provider = {
	provide: RENDERER_BUILDER,
	deps: [[new SkipSelf(), new Optional(), RENDERER_BUILDER], Injector],
	useFactory: factory
};
