import { Collisions } from "../../utilities/Collisions";
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
            this.updateBody(body);
        }
    }

    updateBody(actingBody) {
        if (!actingBody.isMoving()) return;

        const movementBoundingBox = Collisions.getMovementBoundingBox(actingBody);

        // TODO: implement quadtree to prevent O(n^2)
        // TODO: what if multiple collisions possible in movement and should react to closest?
        for (const otherBody of this.bodies) {
            if (otherBody === actingBody) continue;

            const wasCollision = 
                otherBody.hasOwnProperty('radius') // isCircle TODO: where to put this logic?
                    ? Collisions.resolveCircleVsCircleCollision(actingBody, movementBoundingBox, otherBody)
                    : Collisions.resolveCircleVsRectangleCollision(actingBody, movementBoundingBox, otherBody);

            if (wasCollision) return;
        }
        
        // no collisions; progress velocity
        const { x, y, velocity } = actingBody;
        actingBody.moveTo(x + velocity.x, y + velocity.y);
    }

    getSaveableWorldState() {
        return {
            bodies: this.bodies.map(body => body.toSaveableState()),
        };
    }

    loadWorldState(saveableWorldState) {
        for (const saveableBody of saveableWorldState.bodies) {
            const body = this.bodies.find(body => body.id === saveableBody.id);
            body.moveTo(saveableBody.x, saveableBody.y);
            body.setVelocity(saveableBody.velocity);
        }
    }
}
