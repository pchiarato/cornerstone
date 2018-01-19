import { Image } from '../../src/image';

import * as dcmParser from 'dicom-parser';

async function downloadFile(path: string) {
    return new Promise<ArrayBuffer>( (resolve, reject) => {
        const xhr = new XMLHttpRequest();
            xhr.addEventListener('readystatechange', function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error('fail request. Status: ' + xhr.status));
                    }
                }
            });
            xhr.addEventListener('error', err => reject(err));
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', `/base/${path}`);
            xhr.send();
    });
}

export async function loadImage(imgName: string) {
    return downloadFile(`test/images/${imgName}.dcm`)
        .then( buffer => {
            const dataset = dcmParser.parseDicom(new Uint8Array(buffer));
            const pixelDataElement = dataset.elements.x7fe00010;

            return {
                width: dataset.uint16('x00280011'),
                height: dataset.uint16('x00280010'),
                components: dataset.string('x00280004').startsWith('MONOCHROME') ? 1 : 3,
                pixelData: new Uint16Array(buffer, pixelDataElement.dataOffset),
            };
        });
}

export async function loadResult(imgName: string) {
    return downloadFile(`test/images/${imgName}_result.raw`);
}

export async function loadTestSet(ctx: CanvasRenderingContext2D | WebGLRenderingContext, imgName: string) {
    return Promise.all([
        loadImage(imgName).then(img => {
            const canvas = ctx.canvas;
            canvas.width = img.width;
            canvas.height = img.height;

            return img;
        }),
        loadResult(imgName)
    ]);
}
