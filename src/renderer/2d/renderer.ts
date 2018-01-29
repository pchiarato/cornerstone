import { InjectionToken, EventEmitter } from '@angular/core';
import {  Lut } from '../../lut';
import { Image } from '../../image';
import { RenderersManager, Lookupable } from '../manager';
import { Renderer, RenderItem } from '../';
import { Subscriber } from 'rxjs/Subscriber';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

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

	private context: CanvasRenderingContext2D;
	private imgData: ImageData;

	private runningId: number | null = null;
	private next: {image: Image, luts: Lut[]} | null = null;

	output = new EventEmitter<Error | Image>();

	constructor(private canvas: HTMLCanvasElement, private manager: RenderersManager) {
		const context = canvas.getContext('2d');

		if (!context)
			throw 'no 2d context';

		this.context = context;
		this.imgData = context.createImageData(1, 1);
	}

	draw(image: Image, luts = []) {
		if (this.runningId !== null) {
			this.next = {image, luts};
		} else {
			this.render(image, luts);
		}
	}

	destroy() {
		if (this.runningId !== null)
			cancelAnimationFrame(this.runningId);
	}

	private render(image: Image, luts: Lut[]) {
		this.runningId = __zone_symbol__requestAnimationFrame( () => {
			try {
				if (this.canvas.width !== this.imgData.width || this.canvas.height !== this.imgData.height) {
					this.imgData = this.context.createImageData(this.canvas.width, this.canvas.height);
				}

				this.manager.get2DRenderingFunction(image, luts)
					.apply(null, [image, this.imgData, ...luts]);
				this.context.putImageData(this.imgData, 0, 0);

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
