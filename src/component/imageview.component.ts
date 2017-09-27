import { Component, ViewChild, Input, ElementRef, AfterViewInit, SimpleChanges, OnChanges, ChangeDetectionStrategy, isDevMode, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { BaseLut } from '../lut';
import { Image } from '../image';
import { RenderersManager, InvalidImageError } from '../renderer/manager';
import { WebGLRenderer } from '../renderer/webgl';
import { Canvas2DRenderer } from '../renderer/2d';
import { Renderer } from '../renderer';
import { Transform, toCSSString } from '../transform';

// TODO harmonise names
export enum STATUS {
    valid = 'VALID',
    no_renderer = 'NO_RENDERER',
    rendering_error = 'RENDERING_ERROR',
    invalid_image = 'INVALID_IMAGE'
}

@Component({
    selector: 'img-view',
    template: '<canvas #canvas [style.transform]="transformStr"></canvas>',
    styles: [`
		canvas{
			background: white;

			position: absolute;
			top: 50%;
			left: 50%;

			transform: translate(-50%,-50%);

			-webkit-touch-callout: none;
			-webkit-user-select: none;
			-khtml-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
		}
	`],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewComponent implements OnChanges {
    @ViewChild('canvas')
	private canvasRef: ElementRef;

    transformStr: SafeStyle;
    @Input() set transform(tr: Transform){
        this.transformStr = this.sanitizer.bypassSecurityTrustStyle( toCSSString(tr) );
    };

    private _luts: BaseLut[] = [];

    @Input() set lut(lut: BaseLut[] | BaseLut | undefined | null) {
        if (lut === null || lut === undefined) {
            if (this._luts.length !== 0)
                this._luts = [];
        }
        else if (Array.isArray(lut))
            this._luts = lut;
        else
            this._luts = [lut];
    }

	@Input() image: Image;

    renderer: Renderer | null;

    private lastStatus: STATUS;
    @Output() status = new EventEmitter<STATUS>();

    constructor(private sanitizer: DomSanitizer, private rendering: RenderersManager) {}

    getRenderer(): Renderer | null {
        if (this.renderer !== undefined)
            return this.renderer;

        const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
        try {
            const attribute = { preserveDrawingBuffer: true, depth: false };
            const gl = <WebGLRenderingContext>(canvas.getContext('webgl', attribute) || canvas.getContext('experimental-webgl', attribute));

            return this.renderer = this.init3DRendering(gl);
        }catch (e) {
            if (isDevMode)
                console.warn('Can\'t create 3D context, falling back to 2D', e);
        }

        try {
            return this.renderer = this.init2DRendering( canvas.getContext('2d') );
        } catch (e) {
            if (isDevMode)
                console.warn('Can\'t create 2D context', e);
        }

        return null;
    }

    init3DRendering(gl: WebGLRenderingContext | null) {
        if (gl === null)
            throw 'no webgl context';

        return new WebGLRenderer(gl, this.rendering);
    }

    init2DRendering(context: CanvasRenderingContext2D | null) {
        if (context === null)
            throw 'no 2d context';

        return new Canvas2DRenderer(context, this.rendering);
    }


    ngOnChanges(changes: SimpleChanges) {
        const renderer = this.getRenderer();
        if (renderer === null) {
            this.emitStatus(STATUS.no_renderer);
            return;
        }

        if ('image' in changes) {
            const canvas = this.canvasRef.nativeElement;
            if (this.image !== undefined) {
                canvas.width = this.image.width;
                canvas.height = this.image.height;
            }
            else
                canvas.width = canvas.height = 0;
        }

        // TODO if there is an error during update and we're using webgl renderer
        // => fallback to 2d renderer
        if ('image' in changes || 'lut' in changes) {
            try {
                renderer!.draw(this.image, this._luts);
                this.emitStatus(STATUS.valid);
            } catch (e) {
                console.warn(e);
                this.emitStatus(e instanceof InvalidImageError ? STATUS.invalid_image : STATUS.rendering_error);
            }
        }
    }

    emitStatus(status: STATUS) {
        if (status !== this.lastStatus)
            this.status.emit(this.lastStatus = status);
    }
}
