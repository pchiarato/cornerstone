/**
 * This module is responsible for drawing an image to an enabled elements canvas element
 */


/**
 * Internal API function to draw an image to a given enabled element
 * @param enabledElement
 * @param invalidated - true if pixel data has been invalidated and cached rendering should not be used
 */
export function drawImage(enabledElement: CStone.EnabledElement, invalidated?: boolean) {

    let start = new Date().getTime();

    enabledElement.image.render(enabledElement, invalidated);

    let context = enabledElement.canvas.getContext('2d');

    let end = new Date().getTime();
    let diff = end - start;
    //console.log(diff + ' ms');

    let eventData = {
        viewport : enabledElement.viewport,
        element : enabledElement.element,
        image : enabledElement.image,
        enabledElement : enabledElement,
        canvasContext: context,
        renderTimeInMs : diff
    };

    //$(enabledElement.element).trigger("CornerstoneImageRendered", eventData);
    enabledElement.invalid = false;
}