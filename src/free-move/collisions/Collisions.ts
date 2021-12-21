import { isCircleBody, isRectBody, isFixedBody, Rect } from '@bodies/Bodies';
import { CollisionEvents } from '@collision-events/CollisionEvents';
import { CollisionEvent, FixedCollisionEvent } from '@collision-events/types';
import { Maths } from '@utils/Maths';
import { Vector, Vectors } from '@vectors/Vectors';
import {
    CircleVsCircleCollisionPair,
    CircleVsRectCollisionPair,
    CollisionPair,
    RectVsCircleCollisionPair,
    RectVsRectCollisionPair,
} from '@collisions/types';
import { BodyType, CircleBodyType, RectBodyType } from '@bodies/types';

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

        const rect = new Rect(width, height);
        rect.moveTo({ x: rectX0, y: rectY0 });

        return rect;
    };

    static resolveCollision = (collisionEvent: CollisionEvent) => {
        const { collisionPair, timeOfCollision } = collisionEvent;
        const { movingBody, collisionBody } = collisionPair;

        Collisions.moveBodyToPointOfCollision(movingBody, timeOfCollision);

        if (CollisionEvents.isFixedCollisionEvent(collisionEvent)) {
            return Collisions.resolveFixedCollision(collisionEvent);
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

        const diffPositions = Collisions.getCollisionRelativePositionVector(collisionEvent);
        const { mass: mA, velocity: vA } = movingBody;
        const { mass: mB, velocity: vB } = collisionBody;

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
            Vectors.mult(finalVelocityA, mA),
        );
        const finalVelocityB = Vectors.divide(sum, mB);

        if (!movingBody.isFixed) movingBody.setVelocity(finalVelocityA);
        collisionBody.setVelocity(finalVelocityB);
    };

    static resolveFixedCollision = (collisionEvent: FixedCollisionEvent) => {
        const { collisionPair } = collisionEvent;

        if (Collisions.isFixedVsFixed(collisionPair)) {
            throw new Error(`fixed bodies should not be moving bodies`);
        }

        const { movingBody } = collisionPair;

        const diffPositions = Collisions.getCollisionRelativePositionVector(collisionEvent);

        if (Collisions.isCircleVsCircle(collisionPair)) {
            movingBody.setVelocity(Vectors.rescale(diffPositions, Vectors.magnitude(movingBody.velocity)));
        } else {
            const { x, y } = movingBody.velocity;
            // TODO: remove roundFloatingPoint here, smell of bad diffPositions
            if (Maths.roundFloatingPoint(diffPositions.x) === 0) {
                movingBody.setVelocity({ x, y: -y });
                if (Collisions.isMovingTowardsBody(collisionPair)) {
                    movingBody.setVelocity({ x: -x, y: -y });
                }
            } else if (Maths.roundFloatingPoint(diffPositions.y) === 0) {
                movingBody.setVelocity({ x: -x, y });
                if (Collisions.isMovingTowardsBody(collisionPair)) {
                    movingBody.setVelocity({ x: -x, y: -y });
                }
            } else {
                movingBody.setVelocity(Vectors.rescale(diffPositions, Vectors.magnitude(movingBody.velocity)));
            }
        }
    };

    static isOverlapping = (collisionPair: CollisionPair) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const { movingBody, collisionBody } = collisionPair;
            
            const totalRadiiLength = movingBody.radius + collisionBody.radius;
            
            const diffPos = Vectors.subtract(movingBody.center, collisionBody.center); 
            const diffPosLength = Vectors.magnitude(diffPos);
            
            return Maths.roundFloatingPoint(diffPosLength) < totalRadiiLength;
        }

        if (Collisions.isCircleVsRect(collisionPair)) {
            const { movingBody: circle, collisionBody: rect } = collisionPair;
            return Collisions.areCircleAndRectIntersecting(circle, rect);
        }

        if (Collisions.isRectVsCircle(collisionPair)) {
            const { movingBody: rect, collisionBody: circle } = collisionPair;
            return Collisions.areCircleAndRectIntersecting(circle, rect);
        }

        if (Collisions.isRectVsRect(collisionPair)) {
            return Collisions.areRectsIntersecting(collisionPair);
        }

        throw new Error(`cannot determine if overlap exists for collisionPair: ${JSON.stringify(collisionPair)}`);
    }

    // TODO: revisit, isn't working intuitively for rectangle vs any collisions
    static isMovingTowardsBody = (collisionPair: CollisionPair) => {
        const { movingBody, collisionBody } = collisionPair;
        const { velocity: movingBodyVel } = movingBody;

        if (!movingBodyVel.x && !movingBodyVel.y) return false;

        if (Collisions.isCircleVsCircle(collisionPair)) {
            return Collisions.isPointMovingTowardsPoint(movingBody.center, collisionBody.center, movingBody.velocity);
        }

        if (Collisions.isRectVsRect(collisionPair)) {
            const isMovingInXDirection =
                movingBodyVel.x > 0 ? movingBody.x1 <= collisionBody.x0 : movingBody.x0 >= collisionBody.x1;
            const isMovingInYDirection =
                movingBodyVel.y > 0 ? movingBody.y1 <= collisionBody.y0 : movingBody.y0 >= collisionBody.y1;
            const hasXOverlap = Maths.hasOverlap(movingBody.x0, movingBody.x1, collisionBody.x0, collisionBody.x1);
            const hasYOverlap = Maths.hasOverlap(movingBody.y0, movingBody.y1, collisionBody.y0, collisionBody.y1);

            if (!movingBodyVel.x || !movingBodyVel.y) {
                if (!movingBodyVel.x) {
                    if (!hasXOverlap) return false;
                    return isMovingInYDirection;
                } else if (!movingBodyVel.y) {
                    if (!hasYOverlap) return false;
                    return isMovingInXDirection;
                }
            }

            if (hasXOverlap) {
                if (movingBodyVel.y > 0 && movingBody.y1 <= collisionBody.y0) return true;
                if (movingBodyVel.y < 0 && movingBody.y0 >= collisionBody.y1) return true;
            }

            if (hasYOverlap) {
                if (movingBodyVel.x > 0 && movingBody.x1 <= collisionBody.x0) return true;
                if (movingBodyVel.x < 0 && movingBody.x0 >= collisionBody.x1) return true;
            }

            return isMovingInXDirection && isMovingInYDirection;
        }

        // account for bodies already in contact that the movingBody is not moving towards
        if (Collisions.isCircleVsRect(collisionPair)) {
            const collisionEvents = CollisionEvents.getCircleVsRectCollisionEvents(collisionPair);
            const alreadyTouchingEvent = collisionEvents.find(
                (event) => Maths.roundFloatingPoint(event.timeOfCollision) === 0,
            );

            if (alreadyTouchingEvent) {
                return Collisions.isPointMovingTowardsPoint(
                    movingBody.center,
                    alreadyTouchingEvent.collisionPoint,
                    movingBodyVel,
                );
            }
        } else if (Collisions.isRectVsCircle(collisionPair)) {
            const collisionEvents = CollisionEvents.getRectVsCircleCollisionEvents(collisionPair);
            const alreadyTouchingEvent = collisionEvents.find(
                (event) => Maths.roundFloatingPoint(event.timeOfCollision) === 0,
            );

            if (alreadyTouchingEvent) {
                return Collisions.isPointMovingTowardsPoint(
                    alreadyTouchingEvent.collisionPoint,
                    collisionBody.center,
                    movingBodyVel,
                );
            }
        }

        if (movingBodyVel.x > 0 && movingBody.center.x <= collisionBody.x0) return true;
        if (movingBodyVel.x < 0 && movingBody.center.x >= collisionBody.x1) return true;
        if (movingBodyVel.y > 0 && movingBody.center.y <= collisionBody.y0) return true;
        if (movingBodyVel.y < 0 && movingBody.center.y >= collisionBody.y1) return true;

        return false;
    };

    // https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
    private static areCircleAndRectIntersecting = (circle: CircleBodyType, rect: RectBodyType) => {
        const diffX = Math.abs(rect.center.x - circle.center.x);
        const diffY = Math.abs(rect.center.y - circle.center.y);
        const { width, height } = rect;
        const { radius } = circle;

        if (diffX >= width / 2 + radius || diffY >= height / 2 + radius) {
            return false;
        }

        if (diffX < width / 2 || diffY < height / 2) {
            return true;
        }

        const distanceToRectCorner = (diffX - width / 2) ** 2 + (diffY - height / 2) ** 2;

        return distanceToRectCorner < radius ** 2;
    };

    private static areRectsIntersecting = (collisionPair: RectVsRectCollisionPair) => {
        const { movingBody: rectA, collisionBody: rectB } = collisionPair;
        if (
            rectB.x1 <= rectA.x0 ||
            rectB.x0 >= rectA.x1 || 
            rectB.y1 <= rectA.y0 ||
            rectB.y0 >= rectA.y1
        ) {
            return false;
        }
        return true;
    }

    private static getCollisionRelativePositionVector = (collisionEvent: CollisionEvent): Vector => {
        const { collisionPair } = collisionEvent;
        const { movingBody, collisionBody } = collisionPair;

        if (Collisions.isCircleVsCircle(collisionPair)) {
            return Vectors.subtract(movingBody.center, collisionBody.center);
        }

        if (CollisionEvents.isRectVsRectCollisionEvent(collisionEvent)) {
            const { contact } = collisionEvent;
            // either x-aligned or y-aligned collision
            const x = contact.x0 ?? contact.x1;
            const y = contact.y0 ?? contact.y1;
            if (x !== undefined) {
                return Vectors.create(movingBody.center.x - x, 0);
            } else if (y !== undefined) {
                return Vectors.create(0, movingBody.center.y - y);
            }
        }

        if (CollisionEvents.isCircleVsRectCollisionEvent(collisionEvent)) {
            return Vectors.subtract(movingBody.center, collisionEvent.collisionPoint);
        } else if (CollisionEvents.isRectVsCircleCollisionEvent(collisionEvent)) {
            return Vectors.subtract(collisionEvent.collisionPoint, collisionBody.center);
        }

        throw new Error(
            `can't getCollisionRelativePositionVector() for bodies: ${JSON.stringify(movingBody)}, ${JSON.stringify(
                collisionBody,
            )}`,
        );
    };

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
    };

    static isCircleVsCircle = (collisionPair: CollisionPair): collisionPair is CircleVsCircleCollisionPair => {
        const { movingBody, collisionBody } = collisionPair;
        return isCircleBody(movingBody) && isCircleBody(collisionBody);
    };

    static isCircleVsRect = (collisionPair: CollisionPair): collisionPair is CircleVsRectCollisionPair => {
        const { movingBody, collisionBody } = collisionPair;
        return isCircleBody(movingBody) && isRectBody(collisionBody);
    };

    static isRectVsCircle = (collisionPair: CollisionPair): collisionPair is RectVsCircleCollisionPair => {
        const { movingBody, collisionBody } = collisionPair;
        return isRectBody(movingBody) && isCircleBody(collisionBody);
    };

    static isRectVsRect = (collisionPair: CollisionPair): collisionPair is RectVsRectCollisionPair => {
        const { movingBody, collisionBody } = collisionPair;
        return isRectBody(movingBody) && isRectBody(collisionBody);
    };

    private static isFixedVsFixed = (collisionPair: CollisionPair) => {
        const { movingBody, collisionBody } = collisionPair;
        return isFixedBody(movingBody) && isFixedBody(collisionBody);
    };
}
