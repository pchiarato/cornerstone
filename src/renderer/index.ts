import { Observable } from 'rxjs/Observable';

import { Lut } from '../lut';
import { Image } from '../image';
import { InjectionToken } from '@angular/core';

export interface Renderer {

	output: Observable<Error | Image>;

	draw(image: Image, luts?: Lut[]): void;

	destroy(): void;
}

export interface RendererBuilder {
	create(ctx: CanvasRenderingContext2D): Renderer;
}

export const RENDERER_BUILDER = new InjectionToken<RendererBuilder>('');
