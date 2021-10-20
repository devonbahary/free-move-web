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

            if (otherBody.isCircle) {
                const timeOfCollision = 
                    // broad phase to prevent actingBody from tunneling through objects
                    Collisions.isCircleCollidedWithRectangle(otherBody, movementBoundingBox) 
                        // narrow phase to actually get time of collision
                        ? Collisions.getTimeOfCircleVsCircleCollision(actingBody, otherBody)
                        : null;

                if (timeOfCollision === null) continue; 

                // if otherBody is actingBody's collision partner, that means no movement or 
                // collision (change to velocity) has occurred and therefore we shouldn't 
                // resolve the collision back-to-back (this is a bug of infinite reversal)
                if (this.isCollisionPartner(actingBody, otherBody)) return;

                Collisions.resolveCircleVsCircleCollision(actingBody, otherBody, timeOfCollision);

                this.addCollisionPartner(actingBody, otherBody);
                
                return;
            } else { // isRectangle
                const timeOfCollision = 
                    // broad phase to prevent actingBody from tunneling through objects
                    Collisions.areRectanglesColliding(movementBoundingBox, otherBody)
                        // narrow phase to actually get time of collision
                        ? Collisions.getTimeOfCircleVsRectangleCollision(actingBody, otherBody)
                        : null;

                if (timeOfCollision === null) continue;

                // if otherBody is actingBody's collision partner, that means no movement or 
                // collision (change to velocity) has occurred and therefore we shouldn't 
                // resolve the collision back-to-back (this is a bug of infinite reversal)
                if (this.isCollisionPartner(actingBody, otherBody)) return;

                Collisions.resolveCircleVsRectangleCollision(actingBody, otherBody, timeOfCollision);

                this.addCollisionPartner(actingBody, otherBody);

                return;
            }
        }
        
        // no collisions; progress velocity
        const { x, y, velocity } = actingBody;
        actingBody.moveTo(x + velocity.x, y + velocity.y);

        // actingBody's collision partner can now safely collide into actingBody again
        this.removeCollisionPartner(actingBody);
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
