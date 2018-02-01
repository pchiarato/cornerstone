import { Image } from '../../image/index';
import { ImageRendererWebgl } from './';
import { LRUMap } from '../../external/lrumap';
import { SkipSelf, Optional, Provider, Inject } from '@angular/core';
import { GL_CONTEXT } from './context';

interface TextureContext {
	id: number;
	texture: WebGLTexture;
	image: Image; // TODO just id and size
}

export class TextureManager {

	private freeIds: number[] = [];
	private texContext: LRUMap<Symbol, TextureContext>;

	constructor(private gl: any) {
		const maxTexture = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
		const freeIds = [];

		for (let i = maxTexture - 1; i >= 0 ; i--) {
			freeIds.push(i);
		}

		this.texContext = new LRUMap<Symbol, TextureContext>(maxTexture);
		this.freeIds = freeIds;
	}

	bindTexture(symbol: Symbol, image: Image, imgRenderer: ImageRendererWebgl) {
		let context = this.texContext.get(symbol);
		if (context === undefined) {
			context = this.createTextureContext(image, imgRenderer);
			this.texContext.set(symbol, context);
		}

		if (context.image !== image) {
			this.gl.activeTexture(this.gl.TEXTURE0 + context.id);
			imgRenderer.buildTexture(this.gl, image);
		}

		return context.id;
	}

	clearTexture(symbol: Symbol) {
		// TODO activateTexture and bind to null ?
		const ctx = this.texContext.delete(symbol);
		this.freeTexture(ctx);
	}

	private createTextureContext(image: Image, imgRenderer: ImageRendererWebgl) {
		if (this.freeIds.length === 0) {
			this.freeSpace();
		}

		const id = this.freeIds.pop();
		if (id === undefined) {
			throw new Error('unable to free space');
		}

		this.gl.activeTexture(this.gl.TEXTURE0 + id);

		let texture: WebGLTexture | number;
		do {
			texture = this.createTexture(image, imgRenderer);
			if (texture === this.gl.OUT_OF_MEMORY) {
				if (this.texContext.size === 0) {
					throw new Error('out of memory error but no texture to free');
				}

				this.freeSpace();
			} else if (typeof texture === 'number') {
				throw new Error('error building texture. gl constant : ' + texture);
			}
		} while ( !(texture instanceof WebGLTexture) );

		return {
			id,
			texture,
			image,
		};
	}

	private createTexture(image: Image, imgRenderer: ImageRendererWebgl) {
		const { gl } = this;
		const texture = gl.createTexture();

		if (texture == null) {
			return gl.OUT_OF_MEMORY;
		}

		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		imgRenderer.buildTexture(gl, image);

		const error = gl.getError();
		if (error !== gl.NO_ERROR) {
			return error;
		}

		return texture;
	}

	private freeSpace() {
		const tuple = this.texContext.shift();
		if (tuple !== undefined) {
			this.freeTexture(tuple[1]);
		}
	}

	private freeTexture(ctx?: TextureContext) {
		if (ctx !== undefined) {
			this.gl.deleteTexture(ctx.texture);
			this.freeIds.push(ctx.id);
		}
	}
}

export function factory(parent: TextureManager, gl: WebGLRenderingContext) {
	if (parent != null) return parent;
	if (gl == null) return null;

	return new TextureManager(gl);
}

export const TextureManagerProvider: Provider = {
	provide: TextureManager,
	deps: [[new SkipSelf(), new Optional(), TextureManager], GL_CONTEXT],
	useFactory: factory
};
