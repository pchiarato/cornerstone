import { InjectionToken } from '@angular/core';
import {  Lut } from '../lut';
import { Image } from '../image';
import { RenderersManager, Lookupable } from './manager';
import { Renderer, RenderItem } from './';
import { Subscriber } from 'rxjs/Subscriber';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { auditMap } from '../auditMap';

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

	private pipeline = new Subject<RenderItem>();

	// TODO check that auditMap actually works... got overdose
	output: Observable<Error | Image> = auditMap.call(this.pipeline, ({image, luts}: RenderItem) => this.render(image, luts) );

	constructor(private canvas: HTMLCanvasElement, private rendering: RenderersManager) {
		const context = canvas.getContext('2d');

		if (!context)
			throw 'no 2d context';

		this.context = context;
	}

	private render(image: Image, luts: Lut[]): Observable<Image> {
		// TODO scheduler ??
		return Observable.create( (observer: Subscriber<Image>) => {
			// run outside Angular zone
			const id = __zone_symbol__requestAnimationFrame( () => {
				try {
					let imgData = this.context.createImageData(this.canvas.width, this.canvas.height);

					// TODO can we avoid that in some cases ?
					this.rendering.get2DRenderingFunction(image, luts)
						.apply(null, [image, imgData, ...luts]);

					this.context.putImageData(imgData, 0, 0);

					observer.next(image);
				} catch (e) {
					observer.next(e);
				}

				observer.complete();
			});

			return () => { cancelAnimationFrame(id); }
		});
	}

	draw(image: Image, luts = []) {
		this.pipeline.next({image, luts});
	}

	destroy() {
		this.pipeline.unsubscribe();
	}
}
