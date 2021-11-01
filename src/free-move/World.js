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

    static getCollisionResolutionMemId = (bodyA, bodyB, contact) => {
        const { x: Ax, y: Ay, velocity: vA } = bodyA;
        const { id, x: Bx, y: By, velocity: vB } = bodyB;
        let collisionResolutionMemId = `${Ax}-${Ay}-${vA.x}-${vA.y}-${id}-${Bx}-${By}-${vB.x}-${vB.y}`;
        if (contact) collisionResolutionMemId += `-${JSON.stringify(contact)}`;
        return collisionResolutionMemId;
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
            if (this.hasAlreadyProcessedCollision(body, collisionEvent.collisionBody, collisionEvent.contact)) {
                continue;
            } 

            Collisions.resolveCollision(collisionEvent);

            this.rememberCollision(body, collisionEvent.collisionBody, collisionEvent.contact);
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

            // TODO: implement such that the moving body can be rect
            if (otherBody.isCircle) {
                const collisionEvent = Collisions.getCircleVsCircleCollisionEvent(body, otherBody);
                if (collisionEvent) {
                    acc.push(collisionEvent);
                }
            } else {
                const collisionEvents = Collisions.getCircleVsRectangleCollisionEvents(body, otherBody);
                acc.push(...collisionEvents);
            }

            return acc;
        }, []);
    }

    rememberCollision(bodyA, bodyB, contact) {
        // both bodyA and bodyB are likely to encounter one another again after collision 
        // resolution; important that both remember they already processed collision
        this.collisionResolutionMem[bodyA.id] = World.getCollisionResolutionMemId(bodyA, bodyB, contact);
        this.collisionResolutionMem[bodyB.id] = World.getCollisionResolutionMemId(bodyB, bodyA, contact);
    }

    hasAlreadyProcessedCollision(bodyA, bodyB, contact) {
        return this.collisionResolutionMem[bodyA.id] === World.getCollisionResolutionMemId(bodyA, bodyB, contact);
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
