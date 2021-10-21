const PIXELS_IN_SQUARE = 24;

export class Element {
    static create(htmlElement, elementClass, elementId) {
        const element = document.createElement(htmlElement);
        if (elementClass) element.classList.add(elementClass);
        if (elementId) element.setAttribute('id', elementId);
        return element;
    }

    static setDimensions(element, width, height) {
        Object.assign(element.style, {
            width: Element.convertSizeToPixels(width),
            height: Element.convertSizeToPixels(height),  
        });
    }

    static createWorld(world) {
        const worldElement = Element.create('div', undefined, 'world');

        const { width, height } = world;
        
        Element.setDimensions(worldElement, width, height);

        for (let i = 1; i < height; i++) {
            const row = Element.create('div', 'row');
            row.style.top = Element.convertSizeToPixels(i);
            worldElement.appendChild(row);
        }
        
        for (let i = 1; i < width; i++) {
            const column = Element.create('div', 'column');
            column.style.left = Element.convertSizeToPixels(i);
            worldElement.appendChild(column);
        }

        return worldElement;
    }

    static convertSizeToPixels = (size) => `${size * PIXELS_IN_SQUARE}px`;

    static moveToGameCoordinates = (element, x, y) => {
        element.style.left = Element.convertSizeToPixels(x);
        element.style.top = Element.convertSizeToPixels(y);
    }
}
