import { Injector, SkipSelf, Optional, Provider, Inject } from '@angular/core';
import { ImageRendererWebgl, LutRendererWebgl } from './';
import { Lut } from '../../lut/index';
import { Image } from '../../image/index';
import { RenderersManager } from '../manager';
import { TextureManager } from './texture.manager';
import { GL_CONTEXT } from './context';

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

// TODO we should somehow give it a lifecycle or at least clear as much as possible when there is no more components alive

export class OffscreenWebglRenderer {
	private shaderCache: {[id: number]: WebGLProgram} = {};

	private lastShader: WebGLProgram;
	private lastLuts: Lut[];

	// Workaround : having WebGLRenderingContext on the constructor creates an error
	private gl: WebGLRenderingContext;

	constructor(gl: any, private texManager: TextureManager, private rendering: RenderersManager) {
		this.gl = gl;
	}

	draw(symbol: Symbol, image: Image, luts: Lut[]) {
		const { gl } = this;

		try {
			const [id, imageRenderer, lutsRenderer] = this.rendering.getWebglRenderers(image, luts);
			const shader = this.setShaderProgram(id, imageRenderer, lutsRenderer);

			// update lut
			if (shader !== this.lastShader || luts !== this.lastLuts) {
				for (let i = 0, l = luts.length; i < l; i++)
					lutsRenderer[i].updateValues(gl, shader, luts[i]);

				this.lastShader = shader;
				this.lastLuts = luts;
			}

			if (gl.canvas.width !== image.width || gl.canvas.height !== image.height) {
				gl.canvas.width = image.width;
				gl.canvas.height = image.height;

				gl.viewport(0, 0, image.width, image.height);
			}

			// TODO cache it ?
			const texLocation = gl.getUniformLocation(shader, 'u_texture');
			const texId = this.texManager.bindTexture(symbol, image, imageRenderer);
			// TODO only if different ?
			gl.uniform1i(texLocation, texId);

			this.texManager.bindTexture(symbol, image, imageRenderer);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			return gl.canvas;
		} catch (e) {
			console.warn('error during rendering', e);
			// TODO clear everything on error ?
			throw e;
		}
	}

	clear(id: Symbol) {
		this.texManager.clearTexture(id);
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

		if (shader !== this.lastShader) {
			this.gl.useProgram(shader);
		}

		return shader;
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

export function factory(parent: OffscreenWebglRenderer | null, gl: WebGLRenderingContext | null, injector: Injector) {
	if (parent != null) return parent;

	if (gl == null) {
		return null;
	}

	return new OffscreenWebglRenderer(gl, injector.get(TextureManager), injector.get(RenderersManager));
}

export const OffscreenWebglProvider: Provider = {
	provide: OffscreenWebglRenderer,
	deps: [[new SkipSelf(), new Optional(), OffscreenWebglRenderer], GL_CONTEXT, Injector],
	useFactory: factory
};
