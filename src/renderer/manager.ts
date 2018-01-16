import { Injectable, Injector } from '@angular/core';
import { Image } from '../image';
import { Lut, } from '../lut';
import { ImageRenderer2D, IMAGE_RENDERER_2D, LutRenderer2D, LUT_RENDERER_2D } from './2d';
import { ImageRendererWebgl, IMAGE_RENDERER_WEBGL, LutRendererWebgl, LUT_RENDERER_WEBGL } from './webgl';

export interface Lookupable<T> {
    match(v: T): boolean;
}

export class InvalidImageError {
    constructor(public image: Image) {}
}

export class InvalidLutError<T extends Lut> {
    constructor(public lut: T) {}
}

@Injectable()
export class RenderersManager {
    private renderingFuncCache: { [id: number]: Function } = {};

    private _image2D: ImageRenderer2D[];
    get images2D() {
        return this._image2D === undefined ?
            this._image2D = this.injector.get(IMAGE_RENDERER_2D) :
            this._image2D;
    }

    private _Luts2D: LutRenderer2D[];
    get luts2D() {
        return this._Luts2D === undefined ?
            this._Luts2D = this.injector.get(LUT_RENDERER_2D) :
            this._Luts2D;
    }

    private _imageWebgl: ImageRendererWebgl[];
    get imagesWebgl() {
        return this._imageWebgl === undefined ?
            this._imageWebgl = this.injector.get(IMAGE_RENDERER_WEBGL) :
            this._imageWebgl;
    }

    private _LutsWebgl: LutRendererWebgl<Lut>[];
    get lutsWebgl() {
        return this._LutsWebgl === undefined ?
            this._LutsWebgl = this.injector.get(LUT_RENDERER_WEBGL) :
            this._LutsWebgl;
    }

    constructor(private injector: Injector) { }

    getWebglRenderers(image: Image, luts: Lut[]) {
        return this.getRenderers(image, luts, this.imagesWebgl, this.lutsWebgl);
    }

    /* The renderingFunction stuff should be part of 2D renderer but since we need to cache it
     * we moved it here (singleton service)
     */
    get2DRenderingFunction(image: Image, luts: Lut[]) {
        const [id, imageRenderer, lutRenderers] = this.getRenderers(image, luts, this.images2D, this.luts2D);
        let func = this.renderingFuncCache[id];

        if (func === undefined) {
            const args = ['image', 'display'];
            let functionBody = `
                var imageData = image.pixelData,
                    imagelength = imageData.length
                    displayData = display.data,
                    displayLength = displayData.length;
            `;
            let transformsStatements = '';

            for (let lutRenderer of lutRenderers) {
                args.push(lutRenderer.argName);
                functionBody += lutRenderer.initStatements;
                transformsStatements += lutRenderer.transformStatements;
            }

            functionBody += imageRenderer.loopStatements( transformsStatements );

            args.push(functionBody);
                                                 // don't need new ? check all browsers
            func = this.renderingFuncCache[id] = Function.apply(null, args);
        }

        return func;
    }

    // util static funcs

    private getRenderers<T extends Lut, R extends ImageRenderer2D | ImageRendererWebgl, S extends LutRenderer2D | LutRendererWebgl<T>>
        (image: Image, luts: T[], imageRenderers: R[], lutRenderers: S[]): [number, R, S[]] {

        const [imgIdx, imageRenderer] = this.lookup(image, imageRenderers, InvalidImageError);

        const imgSize = imageRenderers.length;
        const lutSize = lutRenderers.length;
        // TODO test id generation
        return luts.reduce<[number, R, S[]]>( (result, lut, idx) => {
            const [rendererIdx, renderer] = this.lookup(lut, lutRenderers, InvalidLutError);

            result[0] += rendererIdx * (imgSize + idx * lutSize );
            result[2].push(renderer);

            return result;
        }, [imgIdx, imageRenderer, []]);
    }

    private lookup<T, R extends {match(v: T): boolean}, E>(value: T, renderers: R[], errorCtor: new (v: T) => E): [number, R] {
        /*
        const renderer = renderers.find(r => r.match(value))
        if( renderer === null)
            throw new errorCtor(value);

        return renderer;
        */

        for (let i = renderers.length - 1; i >= 0; i--) {
            const renderer = renderers[i];
            if (renderer.match(value))
                return [i, renderer];
        }

        throw new errorCtor(value);
    }
}
