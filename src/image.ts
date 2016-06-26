import { LUT, WindowingLUT } from './lut';

export interface ImageConstructor {
	// not sure if we absolutely wants it.
	// This is useful for sure for loader but for display purpose ?
	imageId?: string;

	rows: number;
	height: number;
	columns: number;
	width: number;

	sizeInBytes: number;

	rowPixelSpacing: number;
	columnPixelSpacing: number;
	minPixelValue: number;
	maxPixelValue: number;
}

/*
class Chunk{
	availability: Subject<boolean>;

	constructor( private buffer: TypedArray) {}
}
*/

// why isn't it part of lib.d.ts !?
export interface TypedArray {
	length: number;
	[idx: number]: number;

	slice: (begin?: number, end?: number) => TypedArray;
}

// let chunkSize = 512 * 512;

export abstract class Image {
	imageId: string;

	rows: number;
	height: number;
	columns: number;
	width: number;

	sizeInBytes: number;

	rowPixelSpacing: number;
	columnPixelSpacing: number;

	minPixelValue: number;
	maxPixelValue: number;

	// private chunks: Chunk[];

	constructor(public pixelData: TypedArray, opt: ImageConstructor) {
		for (let propName in opt)
			this[propName] = opt[propName];

		/*
		let offset = 0,
		length = pixelData.length,
		chunksize_2 = chunkSize*2;

		while (offset < length) {
			//we don't want chunk smaller than chunk size
			//so if size left is smaller that 2 chunk size we go with it to avoid having a smaller chunk size on next loop
			let size = length - offset;
			if (size > chunksize_2)
				size = chunkSize;

			this.chunks.push(new Chunk(pixelData.slice(offset, size)));

			offset += size;
		}
		*/
	}

	abstract render(canvas: HTMLCanvasElement, lut: LUT): void;

	// TODO
	getDefaultLinearLUT(): LUT {
		let maxVoi = this.maxPixelValue,
			minVoi = this.minPixelValue;

		return new WindowingLUT((maxVoi + minVoi) / 2, maxVoi - minVoi);
	}

	/*
	   Return a canvas with the image displayed on
	   Statically means
		   - we keep nothing on memory (no cache, no enabled element etc...)
		   - we won't apply any changes on the image

	   @param canvas
	   @param image
	   @param width width of the final canvas
	   @param height height of the final canvas
	   @param viewport

	   if width is undefined or equal to 0 it will be computed from image ratio and height
	   same for height.
	   if both width and height are undefined or equals to 0, we'll use image size.
	*/
	/*
	toImageCanvas(image: Image, width?: number, height?: number, viewport?: CStone.Viewport) {
		if (image === undefined) {
			throw "displayStaticImage: parameters 'canvas' and 'image' cannot be undefined";
		}

		var imgWidth = image.width,
			imgHeight = image.height;

		if (!width && !height) {
			width = image.width;
			height = image.height;
		}
		//at least one is non-null
		else {
			if (!width)
				width = height * imgWidth / imgHeight;
			else if (!height)
				height = width * imgHeight / imgWidth;
		}

		let canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		let vp = getDefaultViewport(image);
		if (viewport)
			extend(vp, viewport);

		//render the image entierely
		var renderCanvas = document.createElement('canvas');
		renderCanvas.width = imgWidth;
		renderCanvas.height = imgHeight;

		//only lut/windowing par of vp is of need here
		//transform properties are used below
		drawImage({
			id: 0,                //not used and should not be
			element: null,
			canvas: renderCanvas,
			viewport: vp,
			image: image
		});


		//draw


		// compute scale
		let scale = scaleToFit(width, height, image),
			widthScale = scale,
			heightScale = scale;

		if (image.rowPixelSpacing < image.columnPixelSpacing)
			widthScale = widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
		else if (image.columnPixelSpacing < image.rowPixelSpacing)
			heightScale = heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);

		if (vp.hflip)
			widthScale = -widthScale;
		if (vp.vflip)
			heightScale = -heightScale;


		let context = canvas.getContext('2d');

		context.translate(width / 2 + vp.translation.x, height / 2 + vp.translation.y);
		context.rotate(vp.rotation * Math.PI / 180);
		context.scale(widthScale, heightScale);
		context.translate(-imgWidth / 2, -imgHeight / 2);

		//renderCanvas must be drawn on a white background
		context.fillStyle = '#fff';
		context.fillRect(0, 0, imgWidth, imgHeight);

		//scale is done here : TODO non-squared pixel
		context.drawImage(renderCanvas, 0, 0);

		return canvas;
	}
	*/

	/*
		return an <image> element
		@param opt object list of option which may contain :
			viewport:       viewport to apply to the srcImage

			width:          width of the imageElement default width of srcImage
			height:         height of the imageElement default height of srcImage
			imageType:      type of the imageElement @see canvas.toDataURL()
			imageQuality:   quality of the imageElement @see canvas.toDataURL()
	 */
	/*
	toImageElement(srcImage: Image,
		opt: { viewport?: CStone.Viewport, width?: number, height?: number, imageType?: string, imageQuality?: number } = {}): HTMLImageElement {

		var img = document.createElement('img');
		img.src = this.toImageCanvas(srcImage, opt.width, opt.height, opt.viewport)
			.toDataURL(opt.imageType, opt.imageQuality);

		return img;
	}
	*/
}

export class GrayscaleImage extends Image {

	storedPixelDataToCanvasImageData(lut: LUT, canvasImageDataData: Uint8ClampedArray) {
		let pixelData = this.pixelData;
		let canvasImageDataIndex = 3;
		let storedPixelDataIndex = 0;
		let localNumPixels = pixelData.length;

		while (storedPixelDataIndex < localNumPixels) {
			canvasImageDataData[canvasImageDataIndex] = lut.apply(pixelData[storedPixelDataIndex++]); // alpha
			canvasImageDataIndex += 4;
		}
	}

	render(canvas: HTMLCanvasElement, lut: LUT) {
		/* There is a bug when applying transform on canvas with chrome/chromium (most likely all webkit/blink browsers)
			@see https://code.google.com/p/chromium/issues/detail?id=562973
		 	So depending on how this bug will be handled we may need to revert back drawing black on white this means
			- fill all bytes of imageData (rgba)
			or
			- use a second canvas and do c2.fillRect() -> c2.getImageData() -> c2.putImageData() -> c1.drawImage(c2)
		*/
		let context = canvas.getContext('2d'),
			canvasData = context.createImageData(canvas.width, canvas.height);

		this.storedPixelDataToCanvasImageData(lut, canvasData.data);

		context.putImageData(canvasData, 0, 0);
	}
}


/*
export class ColorImage extends Image {

	canvas = document.createElement('canvas');

	storedColorPixelDataToCanvasImageData(lut: LUT, canvasImageDataData: Uint8ClampedArray) {
		let minPixelValue = this.minPixelValue;
		let canvasImageDataIndex = 0;
		let storedPixelDataIndex = 0;
		let numPixels = this.width * this.height * 4;
		let storedPixelData = this.pixelData;
		let localCanvasImageDataData = canvasImageDataData;

		while (storedPixelDataIndex < numPixels) {
			localCanvasImageDataData[canvasImageDataIndex++] = lut.apply(storedPixelData[storedPixelDataIndex++]); // red
			localCanvasImageDataData[canvasImageDataIndex++] = lut.apply(storedPixelData[storedPixelDataIndex++]); // green
			localCanvasImageDataData[canvasImageDataIndex] = lut.apply(storedPixelData[storedPixelDataIndex]); // blue
			storedPixelDataIndex += 2;
			canvasImageDataIndex += 2;
		}
	}

	render(renderCanvas: HTMLCanvasElement, lut: LUT) {

		let context = renderCanvas.getContext('2d');

		if (lut changed)
			// the color image voi/invert has not been modified, request the canvas that contains
			// it so we can draw it directly to the display canvas
			context.drawImage(this.canvas, 0, 0);
		else {
			//may be faster to replace fillrect() and getImageData() with createImageData() and fill the alpha channel on storedColorPixelDataToCanvasImageData()
			context.fillStyle = "#000";
			context.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
			let canvasData = context.getImageData(0, 0, renderCanvas.width, renderCanvas.height);

			this.storedColorPixelDataToCanvasImageData(
				lut,
				canvasData.data);

			context.putImageData(canvasData, 0, 0);
		}
	}
}
*/

/*
export class WebImage extends ColorImage {

	render(canvas: HTMLCanvasElement) {

		// get the canvas context and reset the transform
		// context type as any to avoid complains about imageSmoothingEnabled and mozImageSmoothingEnabled
		let context: any = canvas.getContext('2d');
		context.setTransform(1, 0, 0, 1, 0, 0);

		// clear the canvas
		context.fillStyle = 'black';
		context.fillRect(0, 0, canvas.width, canvas.height);

		// save the canvas context state and apply the viewport properties
		setToPixelCoordinateSystem(enabledElement, context);

		// if the viewport ww/wc and invert all match the initial state of the image, we can draw the image
		// directly.  If any of those are changed, we call renderColorImage() to apply the lut
		if (enabledElement.viewport.voi.windowWidth === enabledElement.image.windowWidth &&
			enabledElement.viewport.voi.windowCenter === enabledElement.image.windowCenter &&
			enabledElement.viewport.invert === false) {
			context.drawImage(this.getImage(), 0, 0, this.width, this.height, 0, 0, this.width, this.height);
		} else {
			super.render(canvas);
		}

	}
}
*/
