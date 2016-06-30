import { Injectable } from '@angular/core';

import { Image } from '../image';
import { LUT, WindowingLUT } from '../lut';

// TODO synchrone Renderer using RequestAnimationFrame
// TODO openGL Renderer
/*
export interface Renderer {
	drawImage(img: Image, lut: LUT, imgData: Uint8ClampedArray);
}
*/

export let Renderers: {
	[imgType: number]: (img: Image, a: number, b: number, imgData: Uint8ClampedArray) => void;
} = {};

export interface RendererManager {
	drawImage(img: Image, lut: LUT, canvas: HTMLCanvasElement, id?: number);
}

// WorkerManager is not really worthy. The overload of webworker cancel the speed advantage we could get.
// It' may be worth it  for slow rendering > 100ms.
// Also this is tricky when rendering multiple images (where it was supposed to be good I mean paralelle !!) 
// We must regroup images in bundles of ~100ms. We could get 1 worker handling 3 images and another worker handling just 1.
// this would depend on the renderer time of each image.
//
/*
@Injectable()
export class WorkerManager implements RendererManager {
	// Renderer should be a singleton but well won't hurt
	static workerURL: string;

	defaultWorker: Worker;

	running: boolean;

	workers = [];

	static generateRenderFuncs() {
		let result = '';

		for (let imgType in Renderers)
			result += `
				case ${imgType}:
					(${Renderers[imgType].toString()})(data.img, data.a, data.b, imgData);
					break;
			`;

		return result;
	}

	constructor() {

		if ( ! WorkerManager.workerURL ) {
			WorkerManager.workerURL = URL.createObjectURL( new Blob([`
			self.addEventListener('message', function(e) {

				let imgData = new Uint8ClampedArray(e.data.img.width * e.data.img.height * 4);
				let data = e.data;
				if (data) {
					switch(data.img.type) {
						${WorkerManager.generateRenderFuncs()}
						default:
							throw "No renderer found for image type: " + data.img.type;
					}

					postMessage({ img: data.img, imgData: imgData}, [data.img.pixelData.buffer, imgData.buffer]);
				}
			});
			`], {type: 'text/javascript'}));
		}

		// this.defaultWorker = new Worker(WorkerManager.workerURL);
		this.workers = [
			{
				running: false,
				next: null,
				w: new Worker(WorkerManager.workerURL)
			},
			{
				running: false,
				next: null,
				w: new Worker(WorkerManager.workerURL)
			}
		];
	}

	drawImage(img: Image, lut: LUT, canvas: HTMLCanvasElement, id?: number) {
		// console.log('drawImage ', id);

		let currW = this.workers[id];

		currW.next = {
			img: img,
			a: (<WindowingLUT>lut).a,
			b: (<WindowingLUT>lut).b,
		};

		if (currW.running)
			return;

		// let start = new Date().getTime();

		currW.w.onmessage = event => {
			// console.log( new Date().getTime() - start );

			img.pixelData = event.data.img.pixelData;
			canvas.getContext('2d').putImageData(new ImageData(event.data.imgData, canvas.width, canvas.height), 0, 0);

			this.handleNext(currW);
		};

		this.handleNext(currW);
	}

	handleNext(currW) {
		if (currW.next) {

			currW.w.postMessage(currW.next, [currW.next.img.pixelData.buffer]);
			delete currW.next;
			currW.running = true;
		}
		else
			currW.running = false;
	}
}
*/
