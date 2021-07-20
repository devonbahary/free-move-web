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
            width: `${width}px`,
            height: `${height}px`,  
        });
    }

    updateElementPosition() {
        this.element.style.left = `${this.x0}px`;
        this.element.style.top = `${this.y0}px`;
    }
}