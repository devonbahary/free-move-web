import { RectangleBody } from "./Bodies";

export class World {
    constructor(bounds) {
        const { width, height } = bounds; 
        this.width = width;
        this.height = height;

        this.bodies = [];
        this.initBoundaries();
    }
    
    addBody(body) {
        this.bodies.push(body);
    }

    initBoundaries() {
        const topBoundary = new RectangleBody(this.width, 0); // { x0: 0, y0: 0, x1: this.width, y1: 0 };
        topBoundary.moveTo(0, 0);

        const rightBoundary = new RectangleBody(0, this.height); // { x0: this.width, y0: 0, x1: this.width, y1: this.height };
        rightBoundary.moveTo(this.width, 0);

        const bottomBoundary = new RectangleBody(this.width, 0); // { x0: 0, y0: this.height, x1: this.width, y1: this.height };
        bottomBoundary.moveTo(0, this.height);

        const leftBoundary = new RectangleBody(0, this.height); // { x0: 0, y0: 0, x1: 0, y1: this.height };
        leftBoundary.moveTo(0, 0);


        this.bodies.push(
            topBoundary,
            rightBoundary,
            bottomBoundary,
            leftBoundary,
        );
    }    

    update() {
        for (const body of this.bodies) {
            body.update(this);
        }
    }
}