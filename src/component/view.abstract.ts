import { ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { Lut } from '../lut/index';
import { Image } from '../image/index';
import { Renderer, RendererBuilder } from '../renderer/index';

export interface AbstractView {
	handleRendererStatus?: ((v: Error | Image) => void);
}

export class AbtractView implements OnDestroy {

		@ViewChild('canvas')
		private canvasRef: ElementRef;

		get canvas() {
			return this.canvasRef.nativeElement as HTMLCanvasElement;
		}

		private _luts: Lut[] = [];

		@Input() set lut(lut: Lut[] | Lut | undefined | null) {
			this._luts = this.harmoniseLutInput(lut);
		}

		get luts() {
			return this._luts;
		}

		@Input() image: Image;

		protected renderer: Renderer | undefined;

		constructor(private rendererBuilder: RendererBuilder) {}

		ngOnInit() {
			const ctx = this.canvas.getContext('2d');
			if (ctx == null) {
				console.warn('No Context');
				// TODO noop renderer ?
			} else {
				this.renderer = this.rendererBuilder.create(ctx);
				// TODO a bit weird
				if ((<any>this).handleRendererStatus)
					this.renderer.output.subscribe(v => (<any>this).handleRendererStatus(v));
			}
		}

		ngOnDestroy() {
			if (this.renderer !== undefined) {
				this.renderer.destroy();
			}
		}

		private harmoniseLutInput(lut: Lut[] | Lut | undefined | null): Lut[] {
			if (lut == null)
				return [];

			if (Array.isArray(lut))
				return lut;

			return [lut];
		}
}
