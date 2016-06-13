/**
 * This module deals with caching images
 */
//TODO namespace imageCache

interface ImgCache{
    loaded: boolean;
    imageId : string;
    sharedCacheKey: string;
    imagePromise : any;
    timeStamp: Date;
    sizeInBytes: number;
}

// dictionary of imageId to cachedImage objects
let imageCache: { [imageId: string]: ImgCache } = {};
// dictionary of sharedCacheKeys to number of imageId's in cache with this shared cache key
let sharedCacheKeys: { [sharedCacheKey: string]: number } = {};

// array of cachedImage objects
export let cachedImages: ImgCache[] = [];

let maximumSizeInBytes = 1024 * 1024 * 1024; // 1 GB
let cacheSizeInBytes = 0;

export function setMaximumSizeBytes(numBytes: number) {
    if (numBytes === undefined) {
        throw "setMaximumSizeBytes: parameter numBytes must not be undefined";
    }
    if (numBytes.toFixed === undefined) {
        throw "setMaximumSizeBytes: parameter numBytes must be a number";
    }

    maximumSizeInBytes = numBytes;
    purgeCacheIfNecessary();
}

function purgeCacheIfNecessary() {
    // if max cache size has not been exceeded, do nothing
    if (cacheSizeInBytes <= maximumSizeInBytes) {
        return;
    }

    // cache size has been exceeded, create list of images sorted by timeStamp
    // so we can purge the least recently used image
    cachedImages.sort((a, b) => {
        if (a.timeStamp > b.timeStamp) {
            return -1;
        }
        if (a.timeStamp < b.timeStamp) {
            return 1;
        }
        return 0;
    });

    // remove images as necessary
    while(cacheSizeInBytes > maximumSizeInBytes) {
        let lastCachedImage = cachedImages[cachedImages.length - 1];
        cacheSizeInBytes -= lastCachedImage.sizeInBytes;
        delete imageCache[lastCachedImage.imageId];
        lastCachedImage.imagePromise.reject();
        cachedImages.pop();
        
        //$(cornerstone).trigger('CornerstoneImageCachePromiseRemoved', {imageId: lastCachedImage.imageId});
    }

    /*
    let cacheInfo = getCacheInfo();
    $(cornerstone).trigger('CornerstoneImageCacheFull', cacheInfo);
    */
}

export function putImagePromise(imageId: string, imagePromise: Promise<CStone.Image>) {
    if (imageId === undefined) {
        throw "getImagePromise: imageId must not be undefined";
    }
    if (imagePromise === undefined) {
        throw "getImagePromise: imagePromise must not be undefined";
    }

    if (imageCache.hasOwnProperty(imageId) === true) {
        throw "putImagePromise: imageId already in cache";
    }

    let cachedImage = {
        loaded : false,
        imageId : imageId,
        sharedCacheKey: undefined, // the sharedCacheKey for this imageId.  undefined by default
        imagePromise : imagePromise,
        timeStamp : new Date(),
        sizeInBytes: 0
    };

    imageCache[imageId] = cachedImage;
    cachedImages.push(cachedImage);

    imagePromise.then( image => {
        cachedImage.loaded = true;

        if (image.sizeInBytes === undefined) {
            throw "putImagePromise: image does not have sizeInBytes property or";
        }
        if (image.sizeInBytes.toFixed === undefined) {
            throw "putImagePromise: image.sizeInBytes is not a number";
        }

        // If this image has a shared cache key, reference count it and only
        // count the image size for the first one added with this sharedCacheKey
        if(image.sharedCacheKey) {
          cachedImage.sizeInBytes = image.sizeInBytes;
          cachedImage.sharedCacheKey = image.sharedCacheKey;
          if(sharedCacheKeys[image.sharedCacheKey]) {
            sharedCacheKeys[image.sharedCacheKey]++;
          } else {
            sharedCacheKeys[image.sharedCacheKey] = 1;
            cacheSizeInBytes += cachedImage.sizeInBytes;
          }
        }
        else {
          cachedImage.sizeInBytes = image.sizeInBytes;
          cacheSizeInBytes += cachedImage.sizeInBytes;
        }
        purgeCacheIfNecessary();
    });
}

export function getImagePromise(imageId: string): Promise<CStone.Image> {
    if (imageId === undefined) {
        throw "getImagePromise: imageId must not be undefined";
    }
    let cachedImage = imageCache[imageId];
    if (cachedImage === undefined) {
        return undefined;
    }

    // bump time stamp for cached image
    cachedImage.timeStamp = new Date();
    return cachedImage.imagePromise;
}

export function removeImagePromise(imageId: string): Promise<CStone.Image> {
    if (imageId === undefined) {
        throw "removeImagePromise: imageId must not be undefined";
    }
    let cachedImage = imageCache[imageId];
    if (cachedImage === undefined) {
        throw "removeImagePromise: imageId must not be undefined";
    }
    cachedImages.splice( cachedImages.indexOf(cachedImage), 1);

    // If this is using a sharedCacheKey, decrement the cache size only
    // if it is the last imageId in the cache with this sharedCacheKey
    if(cachedImage.sharedCacheKey) {
      if(sharedCacheKeys[cachedImage.sharedCacheKey] === 1) {
        cacheSizeInBytes -= cachedImage.sizeInBytes;
        delete sharedCacheKeys[cachedImage.sharedCacheKey];
      } else {
        sharedCacheKeys[cachedImage.sharedCacheKey]--;
      }
    } else {
      cacheSizeInBytes -= cachedImage.sizeInBytes;
    }
    delete imageCache[imageId];

    decache(cachedImage.imagePromise, cachedImage.imageId);

    return cachedImage.imagePromise;
}

export function getCacheInfo(): { maximumSizeInBytes: number, cacheSizeInBytes: number, numberOfImagesCached: number } {
    return {
        maximumSizeInBytes : maximumSizeInBytes,
        cacheSizeInBytes : cacheSizeInBytes,
        numberOfImagesCached: cachedImages.length
    };
}

function decache(imagePromise: Promise<CStone.Image>, imageId: string) {
  imagePromise.then( image => {
    if(image.decache) {
      image.decache();
    }
    
    delete imageCache[imageId];

    //imagePromise.reject();
    //guess throw will do
    throw "Image was decached";
  })
  //same as jQuery always()
  .then( () => delete imageCache[imageId])
  .catch( () => delete imageCache[imageId]);
}

export function purgeCache() {
    while (cachedImages.length > 0) {
      let removedCachedImage = cachedImages.pop();
      decache(removedCachedImage.imagePromise, removedCachedImage.imageId);
    }
    cacheSizeInBytes = 0;
}

export function changeImageIdCacheSize(imageId: string, newCacheSize: number) {
  let cacheEntry = imageCache[imageId];
  if(cacheEntry) {
    cacheEntry.imagePromise.then( image => {
      let cacheSizeDifference = newCacheSize - image.sizeInBytes;
      image.sizeInBytes = newCacheSize;
      cacheSizeInBytes += cacheSizeDifference;
    });
  }
}
