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
        const topBoundary = { x0: 0, y0: 0, x1: this.width, y1: 0 };
        const rightBoundary = { x0: this.width, y0: 0, x1: this.width, y1: this.height };
        const bottomBoundary = { x0: 0, y0: this.height, x1: this.width, y1: this.height };
        const leftBoundary = { x0: 0, y0: 0, x1: 0, y1: this.height };

        this.bodies.push(
            topBoundary,
            rightBoundary,
            bottomBoundary,
            leftBoundary,
        );
    }    

    update() {
        for (const body of this.bodies) {
            // TODO
            if (body.update) body.update(this);
        }
    }
}