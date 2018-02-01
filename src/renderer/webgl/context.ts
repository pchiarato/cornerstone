import { InjectionToken, SkipSelf, Optional } from '@angular/core';

export const GL_CONTEXT = new InjectionToken<WebGLRenderingContext | null>('');

export function factory(parent: WebGLRenderingContext | null) {
	if (parent != null) return parent;

	// Use renderer to create the canvas ? can't really inject renderer outside components :/
	const canvas: HTMLCanvasElement = document.createElement('canvas');
	const attribute: WebGLContextAttributes = { preserveDrawingBuffer: false, depth: false };

	return canvas.getContext('webgl', attribute) || canvas.getContext('experimental-webgl', attribute);
}

export const glContextProvider = {
	provide: GL_CONTEXT,
	deps: [[new SkipSelf(), new Optional(), GL_CONTEXT]],
	useFactory: factory
};
