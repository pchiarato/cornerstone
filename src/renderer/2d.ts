import { InjectionToken } from '@angular/core';
import { Transform } from '../transform';
import { BaseLut, Lut } from '../lut';
import { Image } from '../image';
import { RenderersManager, Lookupable } from './manager';
import { Renderer } from './';

declare var __zone_symbol__requestAnimationFrame: (f: Function) => number;

export interface ImageRenderer2D extends Lookupable<Image> {
	initStatements: string;
	loopStatements: (transformStatements: string) => string;
}

export const IMAGE_RENDERER_2D = new InjectionToken<ImageRenderer2D[]>('Image 2D Renderer');

export interface LutRenderer2D<T extends Lut> extends Lookupable<Lut> {
	argName: string;
	initStatements: string;
	transformStatements: string;
}

export const LUT_RENDERER_2D = new InjectionToken<LutRenderer2D<Lut>[]>('Lut renderer 2d');

export class Canvas2DRenderer implements Renderer {

	protected isDrawing = false;
	protected nextDraw: [Image, BaseLut[]] | null = null;

	protected renderingFunc: Function;

	constructor(private context: CanvasRenderingContext2D, private rendering: RenderersManager) {}

	refresh(image: Image, luts: BaseLut[]) {
		if (this.isDrawing)
			// only keep the last image/lut to be drawn
			this.nextDraw = [image, luts];
		else
			this._refresh(image, luts);
	}

	protected _refresh(image: Image, luts: BaseLut[]) {
		this.isDrawing = true;

		// run outside Angular zone
		__zone_symbol__requestAnimationFrame( () => {
			let imgData = this.context.createImageData(image.width, image.height);

			this.renderingFunc.apply(null, [image, imgData, ...luts]);

			this.context.putImageData(imgData, 0, 0);

			// Rendering loop
			if (this.nextDraw !== null) {
				const drawArgs = this.nextDraw;
				this.nextDraw = null;

				this._refresh.apply(this, drawArgs);
			}
			else {
				this.isDrawing = false;
			}
		});
	}

	draw(image?: Image, luts = []) {
		if ( image !== undefined ) {
			this.renderingFunc = this.rendering.get2DRenderingFunction(image, luts);
			this.refresh(image, luts);
		}
		/* else canvas has width = height = 0 so don't need to bother
		else {
			this.context.fillStyle = '#000';
			this.context.fillRect(0, 0, canvas.width, canvas.height);
		}
		*/
	}
}
