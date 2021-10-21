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
        const { center: cA, velocity: vA } = bodyA;
        const { id, center: cB, velocity: vB } = bodyB;
        return `${cA.x}-${cA.y}-${vA.x}-${vA.y}-${id}-${cB.x}-${cB.y}-${vB.x}-${vB.y}`;
    };
    
    addBody(body) {
        this.bodies.push(body);
    }

    initBoundaries() {
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

        const [ closestCollisionBody, timeOfCollision ] = this.getClosestCollisionBodyAndTimeOfCollision(body);

        if (closestCollisionBody) {
            // prevent resolving the same collision back-to-back (causes bug of infinite reversal)
            if (this.hasAlreadyProcessedCollision(body, closestCollisionBody)) {
                return;
            }

            if (closestCollisionBody.isCircle) {
                Collisions.resolveCircleVsCircleCollision(body, closestCollisionBody, timeOfCollision);
            } else {
                Collisions.resolveCircleVsRectangleCollision(body, closestCollisionBody, timeOfCollision);
            }
            
            this.rememberCollision(body, closestCollisionBody);
        } else {
            // no collisions; progress velocity
            const { x, y, velocity } = body;
            body.moveTo(x + velocity.x, y + velocity.y);

            // because this body has moved, any new collision is inherently different and should
            // be processed
            this.forgetCollision(body);
        }
    }

    getClosestCollisionBodyAndTimeOfCollision(body) {
        let closestCollisionBody = null;
        let closestCollisionTimeOfCollision = null;

        // TODO: implement quadtree to prevent O(n^2)
        for (const otherBody of this.bodies) {
            if (body === otherBody) continue;

            // broad phase collision detection
            if (!Collisions.isMovingTowardsBody(body, otherBody)) continue;

            // narrow phase to actually get time of collision
            const getTimeOfCollision = otherBody.isCircle
                ? Collisions.getTimeOfCircleVsCircleCollision
                : Collisions.getTimeOfCircleVsRectangleCollision;
    
            const timeOfCollision = getTimeOfCollision(body, otherBody);

            if (timeOfCollision === null) continue;
                
            if (timeOfCollision === 0) {
                // can't get any closer than already touching
                return [ otherBody, timeOfCollision ];
            }

            if (closestCollisionTimeOfCollision === null || timeOfCollision < closestCollisionTimeOfCollision) {
                closestCollisionBody = otherBody;
                closestCollisionTimeOfCollision = timeOfCollision;
            }
        }

        return [ closestCollisionBody, closestCollisionTimeOfCollision ];
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
