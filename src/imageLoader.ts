/**
 * This module deals with ImageLoaders, loading images and caching images
 */
import { getImagePromise, putImagePromise } from './imageCache';

type ImageLoader = (imageId: string) => Promise<CStone.Image>;

let imageLoaders: { [scheme: string]: ImageLoader } = {};

let unknownImageLoader;

export function loadImageFromImageLoader(imageId: string): Promise<CStone.Image> {
    let colonIndex = imageId.indexOf(":");
    let scheme = imageId.substring(0, colonIndex);
    let loader = imageLoaders[scheme];
    let imagePromise;
    if(loader === undefined || loader === null) {
        if(unknownImageLoader !== undefined) {
            imagePromise = unknownImageLoader(imageId);
            return imagePromise;
        }
        else {
            return undefined;
        }
    }
    imagePromise = loader(imageId);

    // broadcast an image loaded event once the image is loaded
    // This is based on the idea here: http://stackoverflow.com/questions/3279809/global-custom-events-in-jquery
    //imagePromise.then(image => $(cornerstone).trigger('CornerstoneImageLoaded', {image: image}));

    return imagePromise;
}

// Loads an image given an imageId and returns a promise which will resolve
// to the loaded image object or fail if an error occurred.  The loaded image
// is not stored in the cache
export function loadImage(imageId: string): Promise<CStone.Image> {
    if(imageId === undefined) {
        throw "loadImage: parameter imageId must not be undefined";
    }

    let imagePromise = getImagePromise(imageId);
    if(imagePromise !== undefined) {
        return imagePromise;
    }

    imagePromise = loadImageFromImageLoader(imageId);
    if(imagePromise === undefined) {
        throw "loadImage: no image loader for imageId";
    }

    return imagePromise;
}

// Loads an image given an imageId and returns a promise which will resolve
// to the loaded image object or fail if an error occurred.  The image is
// stored in the cache
export function loadAndCacheImage(imageId: string): Promise<CStone.Image> {
    if(imageId === undefined) {
        throw "loadAndCacheImage: parameter imageId must not be undefined";
    }

    let imagePromise = getImagePromise(imageId);
    if(imagePromise !== undefined) {
        return imagePromise;
    }

    imagePromise = loadImageFromImageLoader(imageId);
    if(imagePromise === undefined) {
        throw "loadAndCacheImage: no image loader for imageId";
    }

    putImagePromise(imageId, imagePromise);

    return imagePromise;
}


// registers an imageLoader plugin with cornerstone for the specified scheme
export function registerImageLoader(scheme: string, imageLoader: ImageLoader) {
    imageLoaders[scheme] = imageLoader;
}

// Registers a new unknownImageLoader and returns the previous one (if it exists)
export function registerUnknownImageLoader(imageLoader: ImageLoader): ImageLoader {
    let oldImageLoader = unknownImageLoader;
    unknownImageLoader = imageLoader;
    return oldImageLoader;
}