// import { Injectable } from '@angular/core';
import { OffscreenWebgl } from './offscreen.webgl';
import { Image } from '../image/index';
import { WebGLRenderer, ImageRendererWebgl } from './webgl';
import { LRUMap, Entry } from 'lru_map';

interface TextureContext {
	id: number;
	texture: WebGLTexture;
	image: Image; // TODO just id and size
}

export class TextureManager {

	private freeIds: number[] = [];
	private texContext: LRUMap<Symbol, TextureContext>;

	constructor(private gl: WebGLRenderingContext) {
		const maxTexture = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
		const freeIds = [];

		for (let i = 0; i < maxTexture; i++) {
			freeIds.push(gl.TEXTURE0 + i);
		}

		this.texContext = new LRUMap<Symbol, TextureContext>(maxTexture);
		this.freeIds = freeIds;
	}

	bindTexture(symbol: Symbol, image: Image, imgRenderer: ImageRendererWebgl) {
		let context = this.texContext.get(symbol);
		if (context !== undefined) {
			this.gl.activeTexture(context.id);

			if (context.image !== image) {
				imgRenderer.buildTexture(this.gl, image);
			}
		} else {
			this.addTexture(symbol, image, imgRenderer);
		}
	}

	clearTexture(symbol: Symbol) {
		const ctx = this.texContext.delete(symbol);
		this.freeTexture(ctx);
	}

	private addTexture(symbol: Symbol, image: Image, imgRenderer: ImageRendererWebgl) {
		if (this.freeIds.length === 0) {
			this.freeSpace();
		}

		if (this.freeIds.length === 0) {
			throw new Error('unable to free space');
		}

		const id = this.freeIds.pop();
		this.gl.activeTexture(id);

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

		this.texContext.set(symbol, {
			id,
			texture,
			image,
		});
	}

	private createTexture(image: Image, imgRenderer: ImageRendererWebgl) {
		const gl = this.gl;
		const texture = gl.createTexture();

		if (texture == null) {
			return;
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

