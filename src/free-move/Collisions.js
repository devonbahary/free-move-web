import { Rectangle } from "./Bodies";
import { CollisionEvents } from "./CollisionEvents";
import { Maths } from "./Maths";
import { Vectors } from "./Vectors";

export class Collisions {
    static isCircleVsCircle = (bodyA, bodyB) => {
        return bodyA.isCircle && bodyB.isCircle;
    }

    static isRectangleVsRectangle = (bodyA, bodyB) => {
        return !bodyA.isCircle && !bodyB.isCircle;
    }

    // TODO: use in quad-tree optimization
    static getMovementBoundingBox = (body) => {
        const { center, x0, x1, y0, y1, velocity } = body;
        const { x: dx, y: dy } = velocity;

        const rectX0 = dx === 0 ? x0 : dx > 0 ? center.x : x0 + dx;
        const rectX1 = dx === 0 ? x1 : dx > 0 ? x1 + dx : center.x;
        const rectY0 = dy === 0 ? y0 : dy > 0 ? center.y : y0 + dy;
        const rectY1 = dy === 0 ? y1 : dy > 0 ? y1 + dy : center.y;

        const width = rectX1 - rectX0;
        const height = rectY1 - rectY0;

        const rect = new Rectangle(width, height);
        rect.moveTo(rectX0, rectY0);

        return rect;
    }

    static resolveCollision = (collisionEvent) => {
        const { movingBody, collisionBody, timeOfCollision } = collisionEvent;

        Collisions.#moveBodyToPointOfCollision(movingBody, timeOfCollision);

        const diffPositions = Collisions.#getCollisionRelativePositionVector(movingBody, collisionBody, collisionEvent);
        const { mass: mA, velocity: vA } = movingBody;
        const { mass: mB, velocity: vB } = collisionBody;


        if (collisionBody.isFixed) {
            if (Collisions.isCircleVsCircle(movingBody, collisionBody)) {
                movingBody.setVelocity(Vectors.rescale(diffPositions, Vectors.magnitude(vA)));   
            } else {
                if (Maths.roundFloatingPoint(diffPositions.x) === 0) {
                    movingBody.setVelocity({ x: vA.x, y: -vA.y });
                    if (Collisions.isMovingTowardsBody(movingBody,  collisionBody)) {
                        movingBody.setVelocity({ x: -vA.x, y: -vA.y });
                    }
                } else if (Maths.roundFloatingPoint(diffPositions.y === 0)) {
                    movingBody.setVelocity({ x: -vA.x, y: vA.y });
                    if (Collisions.isMovingTowardsBody(movingBody,  collisionBody)) {
                        movingBody.setVelocity({ x: -vA.x, y: -vA.y });
                    }
                } else {
                    movingBody.setVelocity(Vectors.rescale(diffPositions, Vectors.magnitude(vA)));
                }
            }
            
            return;
        }

        /*
            2D Elastic Collision (angle-free)
            https://stackoverflow.com/questions/35211114/2d-elastic-ball-collision-physics

                                mass scalar      dot product (scalar)        magnitude        pos diff vector
                vA` = vA - (2mB / (mA + mB)) * (<vA - vB | xA - xB> / (|| xA - xB || ** 2)) * (xA - xB)
                  where v = velocity
                        m = mass
                        x = position (at time of collision)
        */

        const diffVelocities = Vectors.subtract(vA, vB);
        
        const dotProduct = Vectors.dot(diffVelocities, diffPositions);
        const magnitude = Vectors.magnitude(diffPositions) ** 2;
        const massScalar = (2 * mB) / (mA + mB);
        const coefficient = massScalar * (dotProduct / magnitude);
        
        const finalVelocityA = Vectors.subtract(vA, Vectors.mult(diffPositions, coefficient));

        /* 
            conservation of momentum
                mAvA` + mBvB` = mAvA + mBvB
                                sum
                vB` = (mAvA + mBvB - mAvA`) / mB
        */
            
        const sum = Vectors.subtract(
            Vectors.add(Vectors.mult(vA, mA), Vectors.mult(vB, mB)), 
            Vectors.mult(finalVelocityA, mA)
        );
        const finalVelocityB = Vectors.divide(sum, mB);
        
        movingBody.setVelocity(finalVelocityA);
        collisionBody.setVelocity(finalVelocityB);
    }

    // TODO: revisit, isn't working intuitively for rectangle vs any collisions
    static isMovingTowardsBody = (bodyA, bodyB) => {
        const { velocity: vA } = bodyA;

        if (!vA.x && !vA.y) return false;
        
        if (Collisions.isCircleVsCircle(bodyA, bodyB)) {
            return Collisions.#isPointMovingTowardsPoint(bodyA.center, bodyB.center, bodyA.velocity);
        }

        if (Collisions.isRectangleVsRectangle(bodyA, bodyB)) {
            const isMovingInXDirection = vA.x > 0
                ? bodyA.x1 <= bodyB.x0
                : bodyA.x0 >= bodyB.x1;
            const isMovingInYDirection = vA.y > 0
                ? bodyA.y1 <= bodyB.y0
                : bodyA.y0 >= bodyB.y1;
            const hasXOverlap = Maths.hasOverlap(bodyA.x0, bodyA.x1, bodyB.x0, bodyB.x1);
            const hasYOverlap = Maths.hasOverlap(bodyA.y0, bodyA.y1, bodyB.y0, bodyB.y1);

            if (!vA.x || !vA.y) {
                if (!vA.x) {
                    if (!hasXOverlap) return false;
                    return isMovingInYDirection;
                } else if (!vA.y) {
                    if (!hasYOverlap) return false;
                    return isMovingInXDirection;
                }
            }

            if (hasXOverlap) {
                if (vA.y > 0 && bodyA.y1 <= bodyB.y0) return true;
                if (vA.y < 0 && bodyA.y0 >= bodyB.y1) return true;
            }

            if (hasYOverlap) {
                if (vA.x > 0 && bodyA.x1 <= bodyB.x0) return true;
                if (vA.x < 0 && bodyA.x0 >= bodyB.x1) return true;
            }

            return isMovingInXDirection && isMovingInYDirection;
        }

        // account for bodies already in contact that the movingBody is not moving towards
        if (bodyA.isCircle && !bodyB.isCircle) { // circle vs rectangle
            const collisionEvents = CollisionEvents.getCircleVsRectangleCollisionEvents(bodyA, bodyB);
            const alreadyTouchingEvent = collisionEvents.find(event => Maths.roundFloatingPoint(event.timeOfCollision) === 0);
            
            if (alreadyTouchingEvent) {
                return Collisions.#isPointMovingTowardsPoint(bodyA.center, alreadyTouchingEvent.collisionPoint, bodyA.velocity);
            }
        } else if (!bodyA.isCircle && bodyB.isCircle) { // rectangle vs circle
            const collisionEvents = CollisionEvents.getRectangleVsCircleCollisionEvents(bodyA, bodyB);
            const alreadyTouchingEvent = collisionEvents.find(event => Maths.roundFloatingPoint(event.timeOfCollision) === 0);
            
            if (alreadyTouchingEvent) {
                return Collisions.#isPointMovingTowardsPoint(alreadyTouchingEvent.collisionPoint, bodyB.center, bodyA.velocity);
            }
        }

        if (vA.x > 0 && bodyA.center.x <= bodyB.x0) return true;
        if (vA.x < 0 && bodyA.center.x >= bodyB.x1) return true;
        if (vA.y > 0 && bodyA.center.y <= bodyB.y0) return true;
        if (vA.y < 0 && bodyA.center.y >= bodyB.y1) return true;

        return false;
    }
    
    static #getCollisionRelativePositionVector = (bodyA, bodyB, collisionEvent) => {
        const { contact, collisionPoint } = collisionEvent;

        if (Collisions.isCircleVsCircle(bodyA, bodyB)) {
            return Vectors.subtract(bodyA.center, bodyB.center);
        }

        if (bodyA.isCircle && !bodyB.isCircle) { // circle vs rectangle
            return Vectors.subtract(bodyA.center, collisionPoint);
        } else if (!bodyA.isCircle && bodyB.isCircle) { // rectangle vs circle
            return Vectors.subtract(collisionPoint, bodyB.center);
        }

        // rectangle vs rectangle 
        const { x0, x1, y0, y1 } = contact;
        // either x-aligned or y-aligned collision
        if (contact.hasOwnProperty('x0') || contact.hasOwnProperty('x1')) {
            const x = contact.hasOwnProperty('x0') ? x0 : x1;
            return Vectors.create(bodyA.center.x - x, 0);
        } else if (contact.hasOwnProperty('y0') || contact.hasOwnProperty('y1')) {
            const y = contact.hasOwnProperty('y0') ? y0 : y1;
            return Vectors.create(0, bodyA.center.y - y);
        } 

        throw new Error(`cannot resolve rectangle vs rectangle collision with contact ${JSON.stringify(contact)}`);
    }

    static #moveBodyToPointOfCollision = (body, timeOfCollision) => {
        const dx = body.velocity.x * timeOfCollision;
        const dy = body.velocity.y * timeOfCollision;
        body.moveTo(body.x + dx, body.y + dy);
    };
    
    static #isPointMovingTowardsPoint = (pointA, pointB, pointAVelocity) => {
        // https://math.stackexchange.com/questions/1438002/determine-if-objects-are-moving-towards-each-other
        const diffVelocity = Vectors.neg(pointAVelocity); // v2 - v1, except we don't want to consider whether bodyB is moving towards bodyA
        const diffPosition = Vectors.subtract(pointB, pointA);
        return Vectors.dot(diffVelocity, diffPosition) < 0;
    }
}