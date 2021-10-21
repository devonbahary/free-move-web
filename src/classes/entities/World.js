import { Collisions } from "../../utilities/Collisions";
import { RectangleBody } from "./Bodies";

export class World {
    constructor(bounds) {
        const { width, height } = bounds; 
        this.width = width;
        this.height = height;

        this.bodies = [];
        this.collisionPartnerMap = {}; 
        
        this.initBoundaries();
    }
    
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

        const movementBoundingBox = Collisions.getMovementBoundingBox(body);

        const [ closestCollisionBody, timeOfCollision ] = this.getClosestCollisionBodyAndTimeOfCollision(body, movementBoundingBox);

        if (closestCollisionBody) {
            // if closestCollisionBody is body's collision partner, that means no movement or 
            // collision (change to velocity) has occurred and therefore we shouldn't 
            // resolve the collision back-to-back (this is a bug of infinite reversal)
            if (this.isCollisionPartner(body, closestCollisionBody)) return;

            const resolveCollision = closestCollisionBody.isCircle
                ? Collisions.resolveCircleVsCircleCollision
                : Collisions.resolveCircleVsRectangleCollision;

            resolveCollision(body, closestCollisionBody, timeOfCollision);
            
            this.addCollisionPartner(body, closestCollisionBody);
        } else {
            // no collisions; progress velocity
            const { x, y, velocity } = body;
            body.moveTo(x + velocity.x, y + velocity.y);

            // body's collision partner can now safely collide into body again
            this.removeCollisionPartner(body);
        }
    }

    getClosestCollisionBodyAndTimeOfCollision(body, movementBoundingBox) {
        let closestCollisionBody = null;
        let closestCollisionTimeOfCollision = null;

        // TODO: implement quadtree to prevent O(n^2)
        for (const otherBody of this.bodies) {
            if (body === otherBody) continue;

            // broad phase to prevent actingBody from tunneling through objects
            const isCollidingWithMovementPath = otherBody.isCircle 
                ? Collisions.isCircleCollidedWithRectangle 
                : Collisions.areRectanglesColliding;
            // narrow phase to actually get time of collision
            const getTimeOfCollision = otherBody.isCircle
                ? Collisions.getTimeOfCircleVsCircleCollision
                : Collisions.getTimeOfCircleVsRectangleCollision;

            const timeOfCollision = isCollidingWithMovementPath(otherBody, movementBoundingBox) 
                ? getTimeOfCollision(body, otherBody) 
                : null;

            if (timeOfCollision === null) continue;
                
            if (timeOfCollision === 0) {
                // can't get any closer than already touching
                return [ otherBody, timeOfCollision ];
            }

            if (!closestCollisionTimeOfCollision || timeOfCollision < closestCollisionTimeOfCollision) {
                closestCollisionBody = otherBody;
                closestCollisionTimeOfCollision = timeOfCollision;
            }
        }

        return [ closestCollisionBody, closestCollisionTimeOfCollision ];
    }

    addCollisionPartner(bodyA, bodyB) {
        // bodies can only ever have one partner
        // if a body already has a partner and it collides into another, the body has 
        // updated its velocity and therefore can safely collide with its former partner again
        this.removeCollisionPartner(bodyA);
        this.removeCollisionPartner(bodyB); 

        this.collisionPartnerMap[bodyA.id] = bodyB.id;
        this.collisionPartnerMap[bodyB.id] = bodyA.id;
    }

    isCollisionPartner(bodyA, bodyB) {
        return this.collisionPartnerMap[bodyA.id] === bodyB.id;
    }

    removeCollisionPartner(body) {
        // collision partners must always point to one another or no one
        const collisionPartnerBodyId = this.collisionPartnerMap[body.id];
        delete this.collisionPartnerMap[body.id];
        delete this.collisionPartnerMap[collisionPartnerBodyId];
    }

    getSaveableWorldState() {
        return {
            bodies: this.bodies.map(body => body.toSaveableState()),
            collisionPartnerMap: this.collisionPartnerMap,
        };
    }

    loadWorldState(saveableWorldState) {
        const { bodies, collisionPartnerMap } = saveableWorldState;

        for (const saveableBody of bodies) {
            const body = this.bodies.find(body => body.id === saveableBody.id);
            body.moveTo(saveableBody.x, saveableBody.y);
            body.setVelocity(saveableBody.velocity);
        }
        
        this.collisionPartnerMap = collisionPartnerMap;
    }
}
