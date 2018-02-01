import { InjectionToken, EventEmitter, SkipSelf, Optional, Provider, forwardRef } from '@angular/core';
import {  Lut } from '../../lut';
import { Image } from '../../image';
import { RenderersManager, Lookupable } from '../manager';
import { Renderer } from '../';

declare var __zone_symbol__requestAnimationFrame: (f: Function) => number;

export interface ImageRenderer2D extends Lookupable<Image> {
	loopStatements: (transformStatements: string) => string;
}

export const IMAGE_RENDERER_2D = new InjectionToken<ImageRenderer2D[]>('Image 2D Renderer');

export interface LutRenderer2D extends Lookupable<Lut> {
	argName: string;
	initStatements: string;
	transformStatements: string;
}

export const LUT_RENDERER_2D = new InjectionToken<LutRenderer2D[]>('Lut renderer 2d');

export class Canvas2DRenderer implements Renderer {

	private imgData: ImageData;

	private runningId: number | null = null;
	private next: {image: Image, luts: Lut[]} | null = null;

	output = new EventEmitter<Error | Image>();

	constructor(private ctx: CanvasRenderingContext2D, private manager: RenderersManager) {
		this.imgData = ctx.createImageData(1, 1);
	}

	draw(image: Image, luts = []) {
		if (this.runningId !== null) {
			this.next = {image, luts};
		} else {
			this.render(image, luts);
		}
	}

	destroy() {
		this.output.unsubscribe();

		if (this.runningId !== null)
			cancelAnimationFrame(this.runningId);
	}

	private render(image: Image, luts: Lut[]) {
		this.runningId = __zone_symbol__requestAnimationFrame( () => {
			try {
				if (image.width !== this.imgData.width || image.height !== this.imgData.height) {
					this.imgData = this.ctx.createImageData(image.width, image.height);
				}

				this.manager.get2DRenderingFunction(image, luts)
					.apply(null, [image, this.imgData, ...luts]);
				this.ctx.putImageData(this.imgData, 0, 0);

				this.output.emit(image);
			} catch (e) {
				this.output.next(e);
			}

			this.runningId = null;
			if (this.next !== null) {
				this.render(this.next.image, this.next.luts);
				this.next = null;
			}
		});
	}
}

export class Canvas2DRendererBuilder {
	constructor(private renderer: RenderersManager) { }

	create(ctx: CanvasRenderingContext2D) {
		return new Canvas2DRenderer(ctx, this.renderer);
	}
}

export function factory(parent: Canvas2DRendererBuilder, renderer: RenderersManager) {
	return parent || new Canvas2DRendererBuilder(renderer);
}

// TODO rollup module order is wrong, using RenderersManager before its definition
// forwardRef save us here

export const Canvas2DRendererProvider: Provider = {
	provide: Canvas2DRendererBuilder,
	deps: [[new SkipSelf(), new Optional(), Canvas2DRendererBuilder], forwardRef( () => RenderersManager )],
	useFactory: factory
};
