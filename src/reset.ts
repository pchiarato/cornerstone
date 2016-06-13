/**
 */
 import { getEnabledElement } from './enabledElements';
 import { getDefaultViewport } from './internal/getDefaultViewport';
 import { updateImage } from './updateImage';

/**
 * Resets the viewport to the default settings
 *
 * @param element
 */
export function reset(element: HTMLElement)
{
  let enabledElement = getEnabledElement(element);

  enabledElement.viewport = 
    enabledElement.initialViewport || getDefaultViewport(enabledElement.image);

  updateImage(element);
}
