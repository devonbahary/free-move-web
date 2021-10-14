import { Collisions } from "../../utilities/Collisions";
import { Vectors } from "../../utilities/Vectors";
import { Body, RectangleBody } from "./Bodies";

const moveBodyToPointOfCollision = (body, timeOfCollision) => {
    const dx = body.velocity.x * timeOfCollision;
    const dy = body.velocity.y * timeOfCollision;
    body.moveTo(body.x + dx, body.y + dy);
};

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
        for (const actingBody of this.bodies) {
            if (!actingBody.isMoving()) {
                continue;
            }
    
            const movementBoundingBox = Collisions.getMovementBoundingBox(actingBody);
    
            let wasCollision = false;
    
            // TODO: implement quadtree to prevent O(n^2)
            // TODO: what if multiple collisions possible in movement and should react to closest?
            for (const otherBody of this.bodies) {
                if (otherBody === actingBody || otherBody === actingBody.collisionPartner) {
                    continue;
                }
    
                if (Body.isCircle(otherBody)) {
                    const vectorToRect = Vectors.getClosestVectorToRectFromCircle(otherBody, movementBoundingBox);
                    const distanceToRectangle = Vectors.magnitude(vectorToRect);
                    
                    if (Collisions.isCircleCollidedWithRectangle(distanceToRectangle, actingBody.radius)) {
                        const timeOfCollision = Collisions.getTimeOfCircleOnCircleCollision(actingBody, otherBody);
    
                        if (timeOfCollision !== null) {
                            moveBodyToPointOfCollision(actingBody, timeOfCollision);
    
                            if (actingBody.isElastic && otherBody.isElastic) {
                                const [
                                    finalVelocity,
                                    bodyFinalVelocity,
                                ] = Collisions.resolveElasticCircleOnCircleCollision(actingBody, otherBody);
    
                                actingBody.setVelocity(finalVelocity);
                                otherBody.setVelocity(bodyFinalVelocity);
    
                                otherBody.collisionPartner = actingBody;
                            }
    
                            wasCollision = true;
                            break;
                        }
                        
                    }
                } else { // isRectangle
                    if (Collisions.areRectanglesColliding(movementBoundingBox, otherBody)) {
                        const timeOfCollision = Collisions.getTimeOfCircleOnRectangleCollision(actingBody, otherBody);
    
                        if (timeOfCollision !== null) {
                            moveBodyToPointOfCollision(actingBody, timeOfCollision);
    
                            if (actingBody.isElastic) { // assume all rectangles are inelastic
                                const newVector = Collisions.resolveElasticCircleOnInelasticRectangleCollision(actingBody, otherBody);
                                actingBody.setVelocity(newVector);
                            }
                            
                            wasCollision = true;
                            break;
                        }
                    }
                }
            }
            
            if (!wasCollision) {
                const newX = actingBody.x + actingBody.velocity.x;
                const newY = actingBody.y + actingBody.velocity.y;
                actingBody.moveTo(newX, newY);
            }
    
            actingBody.collisionPartner = null;
        }
    }
}