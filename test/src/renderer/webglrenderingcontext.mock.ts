export type Spy<T> = T & {
	[K in keyof T]: jasmine.Spy;
};

function isFunction(f: any) {
	return ;
}

function WebGlTextureMock() {
	Object.setPrototypeOf(this, WebGLTexture.prototype);
}

// could be slow to do this for every test
const proto = WebGLRenderingContext.prototype;

const properties = Object.getOwnPropertyNames(proto);

const fields = properties.filter(p => typeof Object.getOwnPropertyDescriptor(proto, p).value !== 'function')
	.map(p => ({ [p]: Object.getOwnPropertyDescriptor(proto, p).value}))
	.reduce( (obj, p) => ({...obj, ...p}), {});
const functions = properties.filter(p => typeof Object.getOwnPropertyDescriptor(proto, p).value === 'function');

const glFields: Partial<WebGLRenderingContext> = {
	...fields,
};
//

export function createWebglSpy(maxTexCount = 5): Spy<WebGLRenderingContext> {
	const gl = {
		...glFields,
		...jasmine.createSpyObj(functions)
	};

	gl.getParameter.and.callFake( (flag: number) => {
		switch (flag) {
			case gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS:
				return maxTexCount;
			default:
				return 0;
		}
	});
	gl.getError.and.returnValue(0);
	gl.createTexture.and.returnValue( new WebGlTextureMock() );

	return gl;
}
