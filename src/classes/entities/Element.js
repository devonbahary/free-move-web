import { PIXELS_IN_SQUARE } from "../../constants";

export class Element {
    constructor() {
        this.element = null;
        this.x = 0;
        this.y = 0;
    }

    setElementId(id) {
        this.element.setAttribute('id', id);
    }

    setElementDimensions(width, height) {
        Object.assign(this.element.style, {
            width: Element.convertSizeToPixels(width),
            height: Element.convertSizeToPixels(height),  
        });
    }

    update() {
        this.updateElementPosition();
    }

    updateElementPosition() {
        this.element.style.left = Element.convertSizeToPixels(this.x0);
        this.element.style.top = Element.convertSizeToPixels(this.y0);
    }

    static convertSizeToPixels = (size) => `${size * PIXELS_IN_SQUARE}px`;

    static createCharacter() {
        return Element.createElement('span', 'character');
    }

    static createGridRow() {
        return Element.createElement('div', 'row');
    }

    static createGridColumn() {
        return Element.createElement('div', 'column');
    }

    static createElement(htmlElement, elementClass) {
        const element = document.createElement(htmlElement);
        if (elementClass) element.classList.add(elementClass);
        return element;
    }
}