import { Collisions } from "./Collisions";
import { RectangleBody } from "./Bodies";

export class World {
    constructor(bounds) {
        const { width, height } = bounds; 
        this.width = width;
        this.height = height;

        this.bodies = [];
        this.collisionResolutionMem = {}; 
        
        this.initBoundaries();
    }

    static getCollisionResolutionMemId = (bodyA, bodyB) => {
        const { x: Ax, y: Ay, velocity: vA } = bodyA;
        const { id, x: Bx, y: By, velocity: vB } = bodyB;
        return `${Ax}-${Ay}-${vA.x}-${vA.y}-${id}-${Bx}-${By}-${vB.x}-${vB.y}`;
    };
    
    addBody(body) {
        this.bodies.push(body);
    }

    initBoundaries() {
        const topBoundary = new RectangleBody(this.width, 0);
        topBoundary.moveTo(0, 0);
        topBoundary.name = 'top boundary';
        topBoundary.setFixed();

        const rightBoundary = new RectangleBody(0, this.height);
        rightBoundary.moveTo(this.width, 0);
        rightBoundary.name = 'right boundary';
        rightBoundary.setFixed();

        const bottomBoundary = new RectangleBody(this.width, 0);
        bottomBoundary.moveTo(0, this.height);
        bottomBoundary.name = 'bottom boundary';
        bottomBoundary.setFixed();

        const leftBoundary = new RectangleBody(0, this.height);
        leftBoundary.moveTo(0, 0);
        leftBoundary.name = 'left boundary';
        leftBoundary.setFixed();


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

    updateBody(body) {
        if (!body.isMoving()) return;

        const collisionEvents = this.getCollisionEvents(body);

        const sortedCollisionEvents = collisionEvents.sort((a, b) => a.timeOfCollision - b.timeOfCollision);

        if (!sortedCollisionEvents.length) {
            // no collisions; progress velocity
            const { x, y, velocity } = body;
            body.moveTo(x + velocity.x, y + velocity.y);

            // because this body has moved, any new collision is inherently different and should
            // be processed
            this.forgetCollision(body);

            return;
        }

        for (const collisionEvent of sortedCollisionEvents) {
            // prevent resolving the same collision back-to-back (causes bug of infinite reversal)
            if (this.hasAlreadyProcessedCollision(body, collisionEvent.collisionBody)) continue;

            Collisions.resolveCollision(collisionEvent);
            this.rememberCollision(body, collisionEvent.collisionBody);

            return;
        }
    }

    getCollisionEvents(body) {
        // TODO: implement quadtree to prevent O(n^2)
        return this.bodies.reduce((acc, otherBody) => {
            if (body === otherBody) return acc;

            // broad phase collision detection
            if (!Collisions.isMovingTowardsBody(body, otherBody)) {
                return acc;
            }

            if (body.isCircle) {
                if (otherBody.isCircle) {
                    const collisionEvent = Collisions.getCircleVsCircleCollisionEvent(body, otherBody);
                    if (collisionEvent) {
                        acc.push(collisionEvent);
                    }
                } else {
                    const collisionEvents = Collisions.getCircleVsRectangleCollisionEvents(body, otherBody);
                    acc.push(...collisionEvents);
                }
            } else {
                if (otherBody.isCircle) {
                    const collisionEvents = Collisions.getRectangleVsCircleCollisionEvents(body, otherBody);
                    acc.push(...collisionEvents);
                } else {
                    const collisionEvents = Collisions.getRectangleVsRectangleCollisionEvents(body, otherBody);
                    acc.push(...collisionEvents);
                }
            }

            return acc;
        }, []);
    }

    rememberCollision(bodyA, bodyB) {
        // both bodyA and bodyB are likely to encounter one another again after collision 
        // resolution; important that both remember they already processed collision
        this.collisionResolutionMem[bodyA.id] = World.getCollisionResolutionMemId(bodyA, bodyB);
        this.collisionResolutionMem[bodyB.id] = World.getCollisionResolutionMemId(bodyB, bodyA);
    }

    hasAlreadyProcessedCollision(bodyA, bodyB) {
        return this.collisionResolutionMem[bodyA.id] === World.getCollisionResolutionMemId(bodyA, bodyB);
    }

    forgetCollision(body) {
        delete this.collisionResolutionMem[body.id];
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
}
