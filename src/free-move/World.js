import { Collisions } from "./Collisions";
import { RectangleBody } from "./Bodies";
import { CollisionEvents } from "./CollisionEvents";

export class World {
    constructor(bounds) {
        const { width, height } = bounds; 
        this.width = width;
        this.height = height;

        this.bodies = [];
        this.collisionResolutionMem = {}; 
        
        this.#initBoundaries();
    }

    addBody(body) {
        this.bodies.push(body);
    }

    update() {
        for (const body of this.bodies) {
            this.#updateBody(body);
        }
    }

    getSaveableWorldState() {
        return {
            bodies: this.bodies.map(body => body.toSaveableState()),
            collisionResolutionMem: this.collisionResolutionMem,
        };
    }

    loadWorldState(saveableWorldState) {
        const { bodies, collisionResolutionMem } = saveableWorldState;

        for (const saveableBody of bodies) {
            const body = this.bodies.find(body => body.id === saveableBody.id);
            body.moveTo(saveableBody.x, saveableBody.y);
            body.setVelocity(saveableBody.velocity);
        }
        
        this.collisionResolutionMem = collisionResolutionMem;
    }

    static #getCollisionResolutionMemId = (bodyA, bodyB) => {
        const { x: Ax, y: Ay, velocity: vA } = bodyA;
        const { id, x: Bx, y: By, velocity: vB } = bodyB;
        return `${Ax}-${Ay}-${vA.x}-${vA.y}-${id}-${Bx}-${By}-${vB.x}-${vB.y}`;
    };    

    #initBoundaries() {
        const topBoundary = new RectangleBody(this.width, 0);
        topBoundary.moveTo(0, 0);
        topBoundary.name = 'top boundary';

        const rightBoundary = new RectangleBody(0, this.height);
        rightBoundary.moveTo(this.width, 0);
        rightBoundary.name = 'right boundary';

        const bottomBoundary = new RectangleBody(this.width, 0);
        bottomBoundary.moveTo(0, this.height);
        bottomBoundary.name = 'bottom boundary';

        const leftBoundary = new RectangleBody(0, this.height);
        leftBoundary.moveTo(0, 0);
        leftBoundary.name = 'left boundary';

        const boundaries = [topBoundary, rightBoundary, bottomBoundary, leftBoundary];
        
        for (const boundary of boundaries) {
            boundary.setFixed();
        }

        this.bodies.push(...boundaries);
    }    

    #updateBody(body) {
        if (!body.isMoving()) return;

        const collisionEvents = CollisionEvents.getCollisionEventsInChronologicalOrder(this.bodies, body);

        if (!collisionEvents.length) {
            // no collisions; progress velocity
            const { x, y, velocity } = body;
            body.moveTo(x + velocity.x, y + velocity.y);

            // because this body has moved, any new collision is inherently different and should
            // be processed
            this.#forgetCollision(body);

            return;
        }

        for (const collisionEvent of collisionEvents) {
            // prevent resolving the same collision back-to-back (causes "stickiness" bug of infinite reversal)
            if (this.#hasAlreadyProcessedCollision(body, collisionEvent.collisionBody)) continue;

            Collisions.resolveCollision(collisionEvent);
            this.#rememberCollision(body, collisionEvent.collisionBody);

            return;
        }
    }

    #rememberCollision(bodyA, bodyB) {
        // both bodyA and bodyB are likely to encounter one another again after collision 
        // resolution; important that both remember they already processed collision
        this.collisionResolutionMem[bodyA.id] = World.#getCollisionResolutionMemId(bodyA, bodyB);
        this.collisionResolutionMem[bodyB.id] = World.#getCollisionResolutionMemId(bodyB, bodyA);
    }

    #hasAlreadyProcessedCollision(bodyA, bodyB) {
        return this.collisionResolutionMem[bodyA.id] === World.#getCollisionResolutionMemId(bodyA, bodyB);
    }

    #forgetCollision(body) {
        delete this.collisionResolutionMem[body.id];
    }
}
