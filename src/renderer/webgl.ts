import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operator/map';
import { Subject } from 'rxjs/Subject';

import { Image } from '../image';
import { Lut } from '../lut';
import { Renderer, RenderItem } from './';
import { Lookupable, RenderersManager } from './manager';

export interface ImageRendererWebgl extends Lookupable<Image> {
    // TODO highp when available
    colorStatements: string;

    buildTexture(gl: WebGLRenderingContext, image: Image): void;
}

export const IMAGE_RENDERER_WEBGL = new InjectionToken<ImageRendererWebgl[]>('Image webgl Renderer');

export interface LutRendererWebgl<T extends Lut> extends Lookupable<Lut> {
    initShaderStatements: string,
    transformShaderStatements: string,
    updateValues(gl: WebGLRenderingContext, program: WebGLProgram, lut: T): void
    match(v: Lut): v is T;
}

export const LUT_RENDERER_WEBGL = new InjectionToken<LutRendererWebgl<Lut>[]>('Lut renderer webgl');

// TODO: we could probably reduce the computation if we passed windowCenter and windowWidth as float on a [0-1] or [0-2] range.
// instead of reconverting the color in the range [0-255] to apply the lut and then back in [0-1]
// But to do that I need to setup a test and be sure the output is **exactly** the same.
const fragShader = (initStatements: string, colorStatements: string, transformStatements: string) => `
    precision mediump float;

    varying vec2 v_texcoord;
    uniform sampler2D u_texture;

   ${initStatements}

    void main() {
        vec4 t = texture2D(u_texture, v_texcoord);
        vec4 v;

        ${colorStatements}
        ${transformStatements}

        gl_FragColor = v / 255.0;
    }
`;

const vertShader = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;

    varying vec2 v_texcoord;

    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texcoord = a_texcoord;
    }
`;

// TODO use it
/*
function getHighpPrecision(gl: WebGLRenderingContext) {
    if (gl.getShaderPrecisionFormat) {
        const precisionFormat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (precisionFormat !== null)
            return precisionFormat.precision;
    }

    return 0;
}
*/

// TODO make it faster for preview ?
// TODO single webgl context on an offscreen canvas

export class WebGLRenderer implements Renderer {

    private image?: Image;
    private luts: Lut[];

    private shaderCache: {[id: number]: WebGLProgram} = {};
    private shader: WebGLProgram;

    private pipeline = new Subject<RenderItem>();

    output: Observable<Error | Image> = map.call(this.pipeline, (item: RenderItem) => this.render(item));

    constructor(private gl: WebGLRenderingContext, private rendering: RenderersManager) {
         this.initTexture();
    }

    draw(image: Image, luts = []) {
        this.pipeline.next({image, luts})
    }

    destroy() {
        this.pipeline.unsubscribe();

        // TODO better way to clean
        const extension = this.gl.getExtension('WEBGL_lose_context');
        if (extension != null)
            extension.loseContext();
	}

    protected render({image, luts}: RenderItem) {
        try {
            const [id, imageRenderer, lutsRenderer] = this.rendering.getWebglRenderers(image, luts);
            const newShader = this.setShaderProgram(id, imageRenderer, lutsRenderer);

            // update lut
            if (newShader || luts !== this.luts) {
                for (let i = 0, l = luts.length; i < l; i++)
                    lutsRenderer[i].updateValues(this.gl, this.shader, luts[i]);
            }

            // update image
            if (newShader || image !== this.image) {
                // we don't need to bind which texture to change because there is only 1 texture
                this.gl.viewport(0, 0, image.width, image.height);
                imageRenderer.buildTexture(this.gl, image);
            }

            // this was previously outside the if(image !== undefined)
            this.image = image;
            this.luts = luts;

            // TODO protect against too much refresh call
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

            return image;
        } catch (e) {
            return e;
        }
    }

    private initTexture() {
        const gl = this.gl;
        const texture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    /**
     * Set the current shader program to use if necessary according to id.
     * This will do one of the following :
     *  - do nothing and return false
     *  - reuse a previously cached shader program and return true
     *  - create a new shader program and return true
     */
    private setShaderProgram(id: number, imageRenderer: ImageRendererWebgl, lutsRenderer: LutRendererWebgl<Lut>[]) {
        let shader = this.shaderCache[id];

        if (shader === undefined) {
            shader = this.shaderCache[id] = this.createShaderProgram(imageRenderer, lutsRenderer);
        }

        if (shader !== this.shader) {
            this.gl.useProgram(shader);
            this.shader = shader;
            return true;
        }

        return false;
    }

    private createShaderProgram(imageRenderer: ImageRendererWebgl, lutsRenderer: LutRendererWebgl<Lut>[]) {
        const gl = this.gl;
        const program = gl.createProgram();

        if (program === null)
            throw new Error('Unable to create a program');

        /* Compile Shaders */
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertShader);
        gl.compileShader(vertexShader);

        if ( !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) )
            throw new Error('Vertex shader error: ' + gl.getShaderInfoLog(vertexShader));

        gl.attachShader(program, vertexShader);

        let initStatements = '';
        let transformstatements = '';
        for (let lutRenderer of lutsRenderer) {
            initStatements += lutRenderer.initShaderStatements;
            transformstatements += lutRenderer.transformShaderStatements;
        }
        const fragmentShaderSource = fragShader(initStatements, imageRenderer.colorStatements, transformstatements);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if ( !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) )
            throw new Error('Fragment shader error ' + gl.getShaderInfoLog(fragmentShader) + '\n' + fragmentShaderSource);

        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);
        if ( !gl.getProgramParameter(program, gl.LINK_STATUS) )
            throw new Error(gl.getProgramInfoLog(program)!);

        /* Bind draw and texture positions */
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            1, 1,
            -1, 1,
            1, -1,
            -1, -1
        ]), gl.STATIC_DRAW);

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            1, 0,
            0, 0,
            1, 1,
            0, 1
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'a_position');
        if (positionLocation === -1) throw new Error('unable to get attribute a_position');
        gl.enableVertexAttribArray(positionLocation);

        const texCoordLocation = gl.getAttribLocation(program, 'a_texcoord');
        if (texCoordLocation === -1) throw new Error('unable to get attribute a_texcoord');
        gl.enableVertexAttribArray(texCoordLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


        return program;
    }
}
