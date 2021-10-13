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
        const topBoundary = new RectangleBody(this.width, 0);
        topBoundary.moveTo(0, 0);

        const rightBoundary = new RectangleBody(0, this.height);
        rightBoundary.moveTo(this.width, 0);

        const bottomBoundary = new RectangleBody(this.width, 0);
        bottomBoundary.moveTo(0, this.height);

        const leftBoundary = new RectangleBody(0, this.height);
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