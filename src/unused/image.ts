// only keep partial change to apply to image.ts

/* Divide big images into chunks and use webworkers for rendering
	Was never really tried, just an idea.
	worker does not seem to be viable for fast computing (~<100ms)
	The overload of webworker cancel the speed advantage we could get (same as for WorkerRenderer)
*/

class Chunk{
	availability: Subject<boolean>;

	constructor( private buffer: TypedArray) {}
}

let chunkSize = 512 * 512;

export abstract class Image {

	private chunks: Chunk[];

	constructor(public pixelData: TypedArray, opt: ImageConstructor) {
		for (let propName in opt)
			this[propName] = opt[propName];

		let offset = 0,
		length = pixelData.length,
		chunksize_2 = chunkSize * 2;

		while (offset < length) {
			// we don't want chunk smaller than chunk size
			// so if size left is smaller that 2 chunk size we go with it to avoid having a smaller chunk size on next loop
			let size = length - offset;
			if (size > chunksize_2)
				size = chunkSize;

			this.chunks.push(new Chunk(pixelData.slice(offset, size)));

			offset += size;
		}
	}
}

/* */

/* rendering using a different pixel data representation
   pixel value becomes the table index and pixel position the value.
   That way we can skip all pixel values that'll render black.
   Also we just need to compute a lut value once for all pixel of same value

   Now this introduce others problem:
   	- we can't use luminance anymore if we want to skip black pixel rendering
   	- we will either
   		- double the memory needed per image
   		- or dump and lost original pixel data representation (can still rebuild it afterwards)
   	- In the end we have 4 array access in our main loop vs 2 in current rendering

   	Worth spending some more time on it. We could decide wich rendering system to use depending on the image.
   	For example image with >25% of pixels with value 'close' to minPixelValue.
*/

export class GrayscaleImage extends Image {

	constructor(public pixelData: TypedArray, opt: ImageConstructor) {
		super(pixelData, opt);

		let buff = [];

		for (let i = 0, l = pixelData.length; i < l; i++) {
			let v = pixelData[i];

			let arr = buff[v];
			if (!arr)
				arr = buff[v] = [];

			arr.push(i);
			// arr.push(i * 4 + 3);
		}

		this.pixelData2 = buff;
	}

	render2(canvas: HTMLCanvasElement, lut: LUT) {
		let context = canvas.getContext('2d');
		let imgData = context.createImageData(canvas.width, canvas.height);

		// let imgDataBuffer = imgData.data,
		let imgDataBuffer = new Uint32Array(imgData.data.buffer);
		//let	pixelData = this.pixelData;
		let	pixelData2 = this.pixelData2;

		let	minPix = this.minPixelValue,
			maxPix = this.maxPixelValue,

			max = lut.max - 1;

		let i = lut.min + 1;

		while (i < max) {
			let valueArr = pixelData2[i++];
			if ( valueArr !== undefined ) {
				let pixV = lutArr[ i + offset ];
				let v = 0xFF000000 | (pixV << 16) | (pixV << 8) | pixV;
				for (let j = 0, l = valueArr.length; j < l; j++)
					imgDataBuffer[ valueArr[j] ] = v;
			}
		}

		while (i <= maxPix) {
			let valueArr = pixelData2[i++];
			if ( valueArr !== undefined) {
				for (let j = 0, l = valueArr.length; j < l; j++)
					imgDataBuffer[ valueArr[j] ] = 0xFFFFFFFFF;
			}
		}

		context.putImageData(imgData, 0, 0);
	}
}
