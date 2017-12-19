import { ViewChild, ElementRef, Input, OnDestroy, isDevMode } from '@angular/core';
import { Lut } from '../lut/index';
import { Image } from '../image/index';
import { Renderer } from '../renderer/index';
import { RenderersManager } from '../renderer/manager';
import { WebGLRenderer } from '../renderer/webgl';
import { Canvas2DRenderer } from '../renderer/2d';

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

        private renderer: Renderer | undefined;

        constructor(private rendering: RenderersManager) {}

        private harmoniseLutInput(lut: Lut[] | Lut | undefined | null): Lut[] {
            if (lut === null || lut === undefined)
                return [];

            if (Array.isArray(lut))
                return lut;

            return [lut];
        }

        protected getRenderer(useGl?: boolean) {
            if (this.renderer === undefined) {
                let renderer: Renderer | undefined;

                if (useGl === true)
                    renderer = this.init3DRendering();

                if (renderer === undefined)
                   renderer = this.init2DRendering();

                if (renderer !== undefined) {
                    renderer.output.subscribe( (<any>this).handleRendererStatus)
                    this.renderer = renderer;
                }
            }

            return this.renderer;
        }

        private init3DRendering() {
            try {
                const attribute = { preserveDrawingBuffer: true, depth: false };
                const gl = <WebGLRenderingContext>(this.canvas.getContext('webgl', attribute) || this.canvas.getContext('experimental-webgl', attribute));

                if (gl === null)
                    throw 'no webgl context';

                return new WebGLRenderer(gl, this.rendering);
            } catch (e) {
                if (isDevMode)
                    console.warn('Can\'t create 3D context, falling back to 2D', e);
            }
        }

        private init2DRendering() {
            try {
                return new Canvas2DRenderer(this.canvas, this.rendering);
            } catch (e) {
                if (isDevMode)
                    console.warn('Can\'t create 2D context', e);
            }
        }

        ngOnDestroy() {
            if (this.renderer !== undefined)
                this.renderer.destroy();
        }
}
