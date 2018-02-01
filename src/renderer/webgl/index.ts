import { EventEmitter, InjectionToken, Injector, SkipSelf, Optional, Provider } from '@angular/core';

import { Image } from '../../image';
import { Lut } from '../../lut';
import { Renderer } from '../';
import { Lookupable } from '../manager';

import { OffscreenWebglRenderer } from './offscreen';
import { Canvas2DRendererBuilder } from '../2d';

export interface ImageRendererWebgl extends Lookupable<Image> {
	// TODO highp when available
	colorStatements: string;

	buildTexture(gl: WebGLRenderingContext, image: Image): void;
}

export const IMAGE_RENDERER_WEBGL = new InjectionToken<ImageRendererWebgl[]>('Image webgl Renderer');

export interface LutRendererWebgl<T extends Lut> extends Lookupable<Lut> {
	initShaderStatements: string;
	transformShaderStatements: string;
	updateValues(gl: WebGLRenderingContext, program: WebGLProgram, lut: T): void;
	match(v: Lut): v is T;
}

export const LUT_RENDERER_WEBGL = new InjectionToken<LutRendererWebgl<Lut>[]>('Lut renderer webgl');

export class WebGLRenderer implements Renderer {

	output = new EventEmitter<Error | Image>();

	private readonly id = Symbol();

	private _fallback: Renderer | undefined;

	constructor(private ctx: CanvasRenderingContext2D, private renderer: OffscreenWebglRenderer, private injector: Injector) { }

	draw(image: Image, luts = []) {
		try {
			const renderedImg = this.renderer.draw(this.id, image, luts);
			this.ctx.drawImage(renderedImg, 0, 0);
		} catch {
			// TODO give up webgl if this occurs too often ?
			this.getFallback().draw(image, luts);
		}
	}

	destroy() {
		this.renderer.clear(this.id);
		this.output.unsubscribe();

		if (this._fallback !== undefined) {
			this._fallback.destroy();
		}
	}

	private getFallback() {
		if (this._fallback === undefined) {
			// TODO shouldn't need typing
			this._fallback = (<Canvas2DRendererBuilder>this.injector.get(Canvas2DRendererBuilder)).create(this.ctx);
			this._fallback.output.subscribe(this.output);
		}

		return this._fallback;
	}
}

export class WebGLRendererBuilder {
	constructor(private offscreenRenderer: OffscreenWebglRenderer, private injector: Injector) {}

	create(ctx: CanvasRenderingContext2D) {
		return new WebGLRenderer(ctx, this.offscreenRenderer, this.injector);
	}
}

export function factory(parent: WebGLRendererBuilder | null, injector: Injector) {
	if (parent != null) {
		return parent;
	}

	const offscreenRenderer = injector.get(OffscreenWebglRenderer);
	if (offscreenRenderer == null) {
		return null;
	}

	return new WebGLRendererBuilder(offscreenRenderer, injector);
}

export const WebGLRendererProvider: Provider = {
	provide: WebGLRendererBuilder,
	deps: [[new SkipSelf(), new Optional(), WebGLRendererBuilder], Injector],
	useFactory: factory
};
