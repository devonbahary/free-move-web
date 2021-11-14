import { isCircleBody, isRectBody, Rectangle } from "./Bodies";
import { CollisionEvents } from "./CollisionEvents";
import { Maths } from "./Maths";
import { BodyType, CollisionEvent, Vector } from "./types";
import { Vectors } from "./Vectors";

export class Collisions {
    // TODO: use in quad-tree optimization
    static getMovementBoundingBox = (body: BodyType) => {
        const { center, x0, x1, y0, y1, velocity } = body;
        const { x: dx, y: dy } = velocity;

        const rectX0 = dx === 0 ? x0 : dx > 0 ? center.x : x0 + dx;
        const rectX1 = dx === 0 ? x1 : dx > 0 ? x1 + dx : center.x;
        const rectY0 = dy === 0 ? y0 : dy > 0 ? center.y : y0 + dy;
        const rectY1 = dy === 0 ? y1 : dy > 0 ? y1 + dy : center.y;

        const width = rectX1 - rectX0;
        const height = rectY1 - rectY0;

        const rect = new Rectangle(width, height);
        rect.moveTo({ x: rectX0, y: rectY0 });

        return rect;
    }

    static resolveCollision = (collisionEvent: CollisionEvent) => {
        const { movingBody, collisionBody, timeOfCollision } = collisionEvent;

        Collisions.moveBodyToPointOfCollision(movingBody, timeOfCollision);

        const diffPositions = Collisions.getCollisionRelativePositionVector(movingBody, collisionBody, collisionEvent);
        const { mass: mA, velocity: vA } = movingBody;
        const { mass: mB, velocity: vB } = collisionBody;

        // TODO: this presumes code will allow for velocity of a fixed body
        // TODO: actually, a body can have velocity and THEN be set to fixed, meaning this is already possible
        if (Collisions.isFixedVsFixed(movingBody, collisionBody)) {
            return; // don't resolve collisions between two fixed bodies
        }

        // TODO: pull out into a resolveFixedCollision()
        if (collisionBody.isFixed) {
            if (isCircleBody(movingBody) && isCircleBody(collisionBody)) {
                movingBody.setVelocity(Vectors.rescale(diffPositions, Vectors.magnitude(vA)));   
            } else {
                // TODO: remove roundFloatingPoint here, smell of bad diffPositions
                if (Maths.roundFloatingPoint(diffPositions.x) === 0) {
                    movingBody.setVelocity({ x: vA.x, y: -vA.y });
                    if (Collisions.isMovingTowardsBody(movingBody, collisionBody)) {
                        movingBody.setVelocity({ x: -vA.x, y: -vA.y });
                    }
                } else if (Maths.roundFloatingPoint(diffPositions.y) === 0) {
                    movingBody.setVelocity({ x: -vA.x, y: vA.y });
                    if (Collisions.isMovingTowardsBody(movingBody, collisionBody)) {
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
        
        if (!movingBody.isFixed) movingBody.setVelocity(finalVelocityA);
        collisionBody.setVelocity(finalVelocityB);
    }

    // TODO: revisit, isn't working intuitively for rectangle vs any collisions
    static isMovingTowardsBody = (bodyA: BodyType, bodyB: BodyType) => {
        const { velocity: vA } = bodyA;

        if (!vA.x && !vA.y) return false;
        
        if (isCircleBody(bodyA) && isCircleBody(bodyB)) {
            return Collisions.isPointMovingTowardsPoint(bodyA.center, bodyB.center, bodyA.velocity);
        }

        if (isRectBody(bodyA) && isRectBody(bodyB)) {
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
        if (isCircleBody(bodyA) && isRectBody(bodyB)) { 
            const collisionEvents = CollisionEvents.getCircleVsRectCollisionEvents(bodyA, bodyB);
            const alreadyTouchingEvent = collisionEvents.find(event => Maths.roundFloatingPoint(event.timeOfCollision) === 0);
            
            if (alreadyTouchingEvent) {
                return Collisions.isPointMovingTowardsPoint(bodyA.center, alreadyTouchingEvent.collisionPoint, bodyA.velocity);
            }
        } else if (isRectBody(bodyA) && isCircleBody(bodyB)) {
            const collisionEvents = CollisionEvents.getRectVsCircleCollisionEvents(bodyA, bodyB);
            const alreadyTouchingEvent = collisionEvents.find(event => Maths.roundFloatingPoint(event.timeOfCollision) === 0);
            
            if (alreadyTouchingEvent) {
                return Collisions.isPointMovingTowardsPoint(alreadyTouchingEvent.collisionPoint, bodyB.center, bodyA.velocity);
            }
        }

        if (vA.x > 0 && bodyA.center.x <= bodyB.x0) return true;
        if (vA.x < 0 && bodyA.center.x >= bodyB.x1) return true;
        if (vA.y > 0 && bodyA.center.y <= bodyB.y0) return true;
        if (vA.y < 0 && bodyA.center.y >= bodyB.y1) return true;

        return false;
    }

    private static getCollisionRelativePositionVector = (bodyA: BodyType, bodyB: BodyType, collisionEvent: CollisionEvent): Vector => {
        const { contact, collisionPoint } = collisionEvent;

        if (isCircleBody(bodyA) && isCircleBody(bodyB)) {
            return Vectors.subtract(bodyA.center, bodyB.center);
        }

        if (isRectBody(bodyA) && isRectBody(bodyB)) {
            if (!contact) {
                throw new Error(
                    `can't getCollisionRelativePositionVector() for rect vs rect collision from collision event without contact: ${JSON.stringify(collisionEvent)}`,
                );
            }
            
            // either x-aligned or y-aligned collision
            const x = contact.x0 ?? contact.x1;
            const y = contact.y0 ?? contact.y1;
            if (x !== undefined) {
                return Vectors.create(bodyA.center.x - x, 0);
            } else if (y !== undefined) {
                return Vectors.create(0, bodyA.center.y - y);
            } 

            throw new Error(`can't getCollisionRelativePositionVector() for rect vs rect collision from contact without side: ${JSON.stringify(contact)}`);
        }

        if (!collisionPoint) {
            throw new Error(
                `can't getCollisionRelativePositionVector() for circle vs rect collision from collision event without collisionPoint: ${JSON.stringify(collisionEvent)}`,
            );
        }

        if (isCircleBody(bodyA) && isRectBody(bodyB)) { 
            return Vectors.subtract(bodyA.center, collisionPoint);
        } else if (isRectBody(bodyA) && isCircleBody(bodyB)) {
            return Vectors.subtract(collisionPoint, bodyB.center);
        }

        throw new Error(`can't getCollisionRelativePositionVector() for bodies: ${JSON.stringify(bodyA)}, ${JSON.stringify(bodyB)}`);
    }

    private static moveBodyToPointOfCollision = (body: BodyType, timeOfCollision: number) => {
        const { x, y, velocity } = body;
        body.moveTo({ 
            x: x + velocity.x * timeOfCollision, 
            y: y + velocity.y * timeOfCollision,
        });
    };
    
    private static isPointMovingTowardsPoint = (pointA: Vector, pointB: Vector, pointAVelocity: Vector) => {
        // https://math.stackexchange.com/questions/1438002/determine-if-objects-are-moving-towards-each-other
        const diffVelocity = Vectors.neg(pointAVelocity); // v2 - v1, except we don't want to consider whether bodyB is moving towards bodyA
        const diffPosition = Vectors.subtract(pointB, pointA);
        return Vectors.dot(diffVelocity, diffPosition) < 0;
    }

    private static isFixedVsFixed = (bodyA: BodyType, bodyB: BodyType) => {
        return bodyA.isFixed && bodyB.isFixed;
    }
}