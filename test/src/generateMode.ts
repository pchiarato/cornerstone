import { saveAs } from 'file-saver';

export function showCanvas(canvas: HTMLCanvasElement) {
	document.getElementsByTagName('body')[0].appendChild(canvas);
}

export function saveCanvas(canvas: HTMLCanvasElement, name = 'result') {
	const tmpCanvas = document.createElement('canvas');
	tmpCanvas.width = canvas.width;
	tmpCanvas.height = canvas.height;
	const tmpCtx = tmpCanvas.getContext('2d');

	tmpCtx.drawImage(canvas, 0, 0);

	showCanvas(tmpCanvas);

	const imgData = tmpCtx.getImageData(0, 0, canvas.width, canvas.height).data;

	// for monochrome
	const fileData = new Uint8Array(canvas.width * canvas.height);
	for (let i = 0; i < fileData.length; i++)
		fileData[i] = imgData[i * 4];

	saveAs(new Blob([fileData], {type : 'application/octet-stream'}), name);
}
