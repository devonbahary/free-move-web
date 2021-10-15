import { Collisions } from "../../utilities/Collisions";
import { Body, RectangleBody } from "./Bodies";

export class World {
    constructor(bounds) {
        const { width, height } = bounds; 
        this.width = width;
        this.height = height;

        this.bodies = [];
        this.initBoundaries();

        this.resolvedCollisionsMemory = {};
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
            this.updateBody(body);
            delete this.resolvedCollisionsMemory[body.id];
        }
    }

    updateBody(actingBody) {
        if (!actingBody.isMoving()) return;

        const movementBoundingBox = Collisions.getMovementBoundingBox(actingBody);

        // TODO: implement quadtree to prevent O(n^2)
        // TODO: what if multiple collisions possible in movement and should react to closest?
        for (const otherBody of this.bodies) {
            if (
                otherBody === actingBody || otherBody.id === this.resolvedCollisionsMemory[actingBody.id]
            ) {
                continue;
            }

            const wasCollision = 
                Body.isCircle(otherBody)
                    ? Collisions.resolveCircleVsCircleCollision(actingBody, movementBoundingBox, otherBody)
                    : Collisions.resolveCircleVsRectangleCollision(actingBody, movementBoundingBox, otherBody);

            if (wasCollision) {
                // don't recognize the same collision twice between any consecutive updates of
                // a colliding pair or else they cancel
                this.resolvedCollisionsMemory[otherBody.id] = actingBody.id;
                return;
            }
        }
        
        // progress velocity
        const { x, y, velocity } = actingBody;
        actingBody.moveTo(x + velocity.x, y + velocity.y);
    }
}
