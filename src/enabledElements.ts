let enabledElements: CStone.EnabledElement[] = [];

export function getEnabledElement(element: HTMLElement): CStone.EnabledElement {
    if(element === undefined) {
        throw "getEnabledElement: parameter element must not be undefined";
    }
    for(var i=0; i < enabledElements.length; i++) {
        if(enabledElements[i].element == element) {
            return enabledElements[i];
        }
    }

    throw "element not enabled";
}

export function addEnabledElement(enabledElement: CStone.EnabledElement) {
    if(enabledElement === undefined) {
        throw "getEnabledElement: enabledElement element must not be undefined";
    }

    enabledElements.push(enabledElement);
}

export function getEnabledElementsByImageId(imageId: string): CStone.EnabledElement[] {
    var ees = [];
    enabledElements.forEach( enabledElement => {
        if(enabledElement.image && enabledElement.image.imageId === imageId) {
            ees.push(enabledElement);
        }
    });
    return ees;
}

export function getEnabledElements(): CStone.EnabledElement[] {
    return enabledElements;
}