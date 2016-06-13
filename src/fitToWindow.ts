/**
 * This module will fit an image to fit inside the canvas displaying it such that all pixels
 * in the image are viewable
 */
import {getEnabledElement} from './enabledElements';
import { updateTransform } from './updateTransform';

export function getImageSize(enabledElement: CStone.EnabledElement) {
  if(enabledElement.viewport.rotation === 0 ||enabledElement.viewport.rotation === 180) {
    return {
      width: enabledElement.image.width,
      height: enabledElement.image.height
    };
  } else {
    return {
      width: enabledElement.image.height,
      height: enabledElement.image.width
    };
  }
}

/**
 * Deprecated
 * Adjusts an images scale and center so the image is centered and completely visible
 * @param element
 * @param [Number] elWidth  element width in px unit
 * @param [Number] elHeight element height in px unit
 */
export function fitToWindow(element: HTMLElement, elwidth: number, elHeight: number)
{
    var enabledElement = getEnabledElement(element);

    var imageSize = getImageSize(enabledElement);

    enabledElement.viewport.scale = scaleToFit(
        elwidth,          elHeight, // element size
        imageSize.width,  imageSize.height);        // image size

    enabledElement.viewport.translation.x = 0;
    enabledElement.viewport.translation.y = 0;
    updateTransform(element);
}

export function scaleToFit(elWidth: number, elHeight: number, imgWidthOrImage:number|CStone.Image, imgHeight?:number): number{
  let imgWidth: number;

  if (isNaN(<number>imgWidthOrImage)) {
    imgHeight = (<CStone.Image>imgWidthOrImage).rows;
    imgWidth =  (<CStone.Image>imgWidthOrImage).columns;
  }
  else
    imgWidth = <number>imgWidthOrImage;

  return Math.min(elWidth / imgWidth, elHeight / imgHeight);
}

