import { Rectangle } from "./Bodies";
import { CollisionEvent } from "./CollisionEvent";
import { Vectors } from "./Vectors";

const quadratic = (a, b, c) => {
    return [
        (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
    ];
};

export class Collisions {
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

    static isValidTimeOfCollision = (timeOfCollision) => {
        return Boolean(
            timeOfCollision !== NaN &&
            timeOfCollision !== null &&
            timeOfCollision <= 1 && 
            Math.round(timeOfCollision * 1000) / 1000 >= 0 // treat floating point errors like collisions so that they are not ignored (e.g., -7.082604849269798e-7)
        );
    }

    // TODO: this function would be more clear if it didn't ALSO include the logic of filtering undesired values
    // returns ~0 < t < 1 or null, where t is the distance along movement where collision happens
    static getTimeOfCollision = (a, b, c) => {
        const roots = quadratic(a, b, c);

        // roots can be outside the range of 0 < t < 1 because our broad approximations can be 
        // wrong; only when 0 < t < 1 will a collision actually occur
        return roots.reduce((timeOfCollision, root) => {
            if (!Collisions.isValidTimeOfCollision(root)) return timeOfCollision;

            return timeOfCollision === null || root < timeOfCollision ? root : timeOfCollision;
        }, null);
    };

    static getTimeOfCircleVsCircleCollision = (A, B) => {
        const { center: centerA, radius: radiusA, velocity } = A;
        const { x: Ax, y: Ay } = centerA;
        const { x: dx, y: dy } = velocity;

        const { center: centerB, radius: radiusB } = B;
        const { x: Bx, y: By } = centerB;

        /*
            sum of both radii               ===     distance between two radii
                    
            A.radius + B.radius              =      Math.sqrt((Ax(t) - Bx)^2 + (Ay(t) - By)^2)
            (A.radius + B.radius)^2          =      (Ax(t) - Bx)^2 + (Ay(t) - By)^2
                                             =      (((dx)t + Ax) - Bx)^2 + (((dy)t + Ay) - By)^2
                                             =      ((dx)t + Ax - Bx)^2 + ((dy)t + Ay - By)^2
                                             =      ((dx)^2t^2 + 2(Ax - Bx)(dx)t + (Ax - Bx)^2) 
                                                        + ((dy)^2t^2 + 2(Ay - By)(dy)t + (Ay - By)^2) 
                                             =      (dx^2 + dy^2)t^2 + (2(Ax - Bx)(dx) + 2(Ay - By)(dy))t + (Ax - Bx)^2 + (Ay - By)^2 
                            0                =      (dx^2 + dy^2)t^2 + (2(Ax - Bx)(dx) + 2(Ay - By)(dy))t + (Ax - Bx)^2 + (Ay - By)^2
                                                        - (this.radius + entity.radius)^2

            a = dx^2 + dy^2
            b = 2(Ax - Bx)(dx) + 2(Ay - By)(dy)
            c = (Ax - Bx)^2 + (Ay - By)^2 - (A.radius + B.radius)^2
        */

        const dABx = Ax - Bx;
        const dABy = Ay - By;
        
        const a = dx ** 2 + dy ** 2;
        const b = 2 * dx * dABx + 2 * dy * dABy;
        const c = dABx ** 2 + dABy ** 2 - (radiusA + radiusB) ** 2;

        return Collisions.getTimeOfCollision(a, b, c);
    }

    static getCircleVsCircleCollisionEvent = (circleA, circleB) => {
        const timeOfCollision = Collisions.getTimeOfCircleVsCircleCollision(circleA, circleB);
        
        if (!Collisions.isValidTimeOfCollision(timeOfCollision)) return null;
        
        return new CollisionEvent(
            circleA,
            circleB,
            timeOfCollision,
        );
    }

    static getCircleVsRectangleCollisionEvents = (circle, rect) => {
        const { center, radius, velocity } = circle;
        const { x, y } = center;
        const { x: dx, y: dy } = velocity;

        const { x0, x1, y0, y1 } = rect;

        const getTimeOfAxisAlignedCollision = (circleBoundary, rectBoundary, changeInAxis) => {
            if (changeInAxis === 0) return null;

            return (rectBoundary - circleBoundary) / changeInAxis;
        };

        const validCollisionEvents = [];

        // consider collision into rectangle against any of its sides
        const timeOfX0Collision = getTimeOfAxisAlignedCollision(x + radius, x0, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX0Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX0Collision;
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfX0Collision,
                    { x0 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfX1Collision = getTimeOfAxisAlignedCollision(x - radius, x1, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX1Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX1Collision;
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfX1Collision,
                    { x1 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfY0Collision = getTimeOfAxisAlignedCollision(y + radius, y0, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY0Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY0Collision;
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfY0Collision,
                    { y0 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfY1Collision = getTimeOfAxisAlignedCollision(y - radius, y1, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY1Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY1Collision;
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfY1Collision,
                    { y1 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        // if a collision occurs with a side, then we don't need to check for corners
        if (validCollisionEvents.length) {
            return validCollisionEvents;
        }

        // consider collision into rectangle into any of its corners
        
        const getTimeOfCollisionWithCorner = (corner) => {
            const diffPos = Vectors.subtract(center, corner);
            const a = dx ** 2 + dy ** 2;
            const b = 2 * diffPos.x * dx + 2 * diffPos.y * dy;
            const c = diffPos.x ** 2 + diffPos.y ** 2 - radius ** 2;
            
            return Collisions.getTimeOfCollision(a, b, c);
        };

        // top left
        const topLeft = {
            x: x0,
            y: y0,
        };

        const topLeftCornerTimeOfCollision = getTimeOfCollisionWithCorner(topLeft);

        if (topLeftCornerTimeOfCollision !== null) {
            const dy = Math.abs(center.y - topLeft.y);
            const dx = Math.abs(center.x - topLeft.x);

            const collisionSide = dy > dx ? { y0 } : { x0 };

            const collisionEvent = new CollisionEvent(
                circle,
                rect,
                topLeftCornerTimeOfCollision,
                collisionSide
            );
            validCollisionEvents.push(collisionEvent);
        }
        
        // top right
        const topRight = {
            x: x1,
            y: y0,
        };
        
        const topRightCornerTimeOfCollision = getTimeOfCollisionWithCorner(topRight);

        if (topRightCornerTimeOfCollision !== null) {
            const dy = Math.abs(center.y - topRight.y);
            const dx = Math.abs(center.x - topRight.x);

            const collisionSide = dy > dx ? { y0 } : { x1 };

            const collisionEvent = new CollisionEvent(
                circle,
                rect,
                topRightCornerTimeOfCollision,
                collisionSide,
            );
            validCollisionEvents.push(collisionEvent);
        }

        // bottom right 
        const bottomRight = {
            x: x1,
            y: y1,
        };

        const bottomRightCornerTimeOfCollision = getTimeOfCollisionWithCorner(bottomRight);

        if (bottomRightCornerTimeOfCollision !== null) {
            const dy = Math.abs(center.y - bottomRight.y);
            const dx = Math.abs(center.x - bottomRight.x);

            const collisionSide = dy > dx ? { y1 } : { x1 };

            const collisionEvent = new CollisionEvent(
                circle,
                rect,
                bottomRightCornerTimeOfCollision,
                collisionSide,
            );
            validCollisionEvents.push(collisionEvent);
        }
        
        // botom left
        const bottomLeft = {
            x: x0,
            y: y1,
        };

        const bottomLeftCornerTimeOfCollision = getTimeOfCollisionWithCorner(bottomLeft);

        if (bottomLeftCornerTimeOfCollision !== null) {
            const dy = Math.abs(center.y - bottomLeft.y);
            const dx = Math.abs(center.x - bottomLeft.x);

            const collisionSide = dy > dx ? { y1 } : { x0 };

            const collisionEvent = new CollisionEvent(
                circle,
                rect,
                bottomLeftCornerTimeOfCollision,
                collisionSide,
            );
            validCollisionEvents.push(collisionEvent);
        }

        return validCollisionEvents;
    }

    static getRectangleVsRectangleCollisionEvents = (rectA, rectB) => {
        const { x: dx, y: dy } = rectA.velocity;

        const getTimeOfAxisAlignedCollision = (rectBoundaryA, rectBoundaryB, changeInAxis) => {
            if (changeInAxis === 0) return null;

            return (rectBoundaryB - rectBoundaryA) / changeInAxis;
        };

        const hasOverlap = (rectA0, rectA1, rectB0, rectB1) => {
            if (rectB1 < rectA0) return false;
            if (rectA1 < rectB0) return false;
            return true;
        };

        const validCollisionEvents = [];

        // consider collision into rectangle against any of its sides
        const timeOfX0Collision = getTimeOfAxisAlignedCollision(rectA.x1, rectB.x0, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX0Collision)) {
            const changeInY = dy * timeOfX0Collision;
            const y0 = rectA.y0 + changeInY;
            const y1 = rectA.y1 + changeInY;

            if (hasOverlap(y0, y1, rectB.y0, rectB.y1)) {
                const collisionEvent = new CollisionEvent(
                    rectA,
                    rectB,
                    timeOfX0Collision,
                    { x0: rectB.x0 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfX1Collision = getTimeOfAxisAlignedCollision(rectA.x0, rectB.x1, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX1Collision)) {
            const changeInY = dy * timeOfX1Collision;
            const y0 = rectA.y0 + changeInY;
            const y1 = rectA.y1 + changeInY;

            if (hasOverlap(y0, y1, rectB.y0, rectB.y1)) {
                const collisionEvent = new CollisionEvent(
                    rectA,
                    rectB,
                    timeOfX1Collision,
                    { x1: rectB.x1 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfY0Collision = getTimeOfAxisAlignedCollision(rectA.y1, rectB.y0, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY0Collision)) {
            const changeInX = dx * timeOfY0Collision;
            const x0 = rectA.x0 + changeInX;
            const x1 = rectA.x1 + changeInX;

            if (hasOverlap(x0, x1, rectB.x0, rectB.x1)) {
                const collisionEvent = new CollisionEvent(
                    rectA,
                    rectB,
                    timeOfY0Collision,
                    { y0: rectB.y0 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfY1Collision = getTimeOfAxisAlignedCollision(rectA.y0, rectB.y1, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY1Collision)) {
            const changeInX = dx * timeOfY1Collision;
            const x0 = rectA.x0 + changeInX;
            const x1 = rectA.x1 + changeInX;

            if (hasOverlap(x0, x1, rectB.x0, rectB.x1)) {
                const collisionEvent = new CollisionEvent(
                    rectA,
                    rectB,
                    timeOfY1Collision,
                    { y1: rectB.y1 },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        return validCollisionEvents;
    }

    static getRectangleVsCircleCollisionEvents = (rect, circle) => {
        const { center, radius } = circle;
        const { x, y } = center;

        const { x0, x1, y0, y1, velocity } = rect;
        const { x: dx, y: dy } = velocity;

        const getTimeOfAxisAlignedCollision = (rectBoundary, circleBoundary, changeInAxis) => {
            if (changeInAxis === 0) return null;

            return (circleBoundary - rectBoundary) / changeInAxis;
        };

        const validCollisionEvents = [];

        // consider collision into circle against any of it's 4 axis-aligned "corners"
        const timeOfX1Collision = getTimeOfAxisAlignedCollision(x1, x - radius, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX1Collision)) {
            const changeInY = dy * timeOfX1Collision;
            const y0 = rect.y0 + changeInY;
            const y1 = rect.y1 + changeInY;
            
            if (y0 <= y && y <= y1) {
                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfX1Collision,
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfX0Collision = getTimeOfAxisAlignedCollision(x0, x + radius, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX0Collision)) {
            const changeInY = dy * timeOfX0Collision;
            const y0 = rect.y0 + changeInY;
            const y1 = rect.y1 + changeInY;
            
            if (y0 <= y && y <= y1) {
                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfX0Collision,
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfY1Collision = getTimeOfAxisAlignedCollision(y1, y - radius, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY1Collision)) {
            const changeInX = dx * timeOfY1Collision;
            const x0 = rect.x0 + changeInX;
            const x1 = rect.x1 + changeInX;
            
            if (x0 <= x && x <= x1) {
                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfY1Collision,
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        const timeOfY0Collision = getTimeOfAxisAlignedCollision(y0, y + radius, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY0Collision)) {
            const changeInX = dx * timeOfY0Collision;
            const x0 = rect.x0 + changeInX;
            const x1 = rect.x1 + changeInX;
            
            if (x0 <= x && x <= x1) {
                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfY0Collision,
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        // if a collision occurs with a circle "corner", then we don't need further checks
        if (validCollisionEvents.length) {
            return validCollisionEvents;
        }

        // consider collision into rectangle into any of its corners
        
        const getTimeOfCollisionWithCorner = (corner) => {
            const diffPos = Vectors.subtract(corner, center);// TODO: swap args?
            const a = dx ** 2 + dy ** 2;
            const b = 2 * diffPos.x * dx + 2 * diffPos.y * dy;
            const c = diffPos.x ** 2 + diffPos.y ** 2 - radius ** 2;
            
            return Collisions.getTimeOfCollision(a, b, c);
        };

        // top left
        const topLeft = {
            x: x0,
            y: y0,
        };

        const topLeftCornerTimeOfCollision = getTimeOfCollisionWithCorner(topLeft);

        if (topLeftCornerTimeOfCollision !== null) {
            const collisionEvent = new CollisionEvent(
                rect,
                circle,
                topLeftCornerTimeOfCollision,
            );
            validCollisionEvents.push(collisionEvent);
        }
        
        // top right
        const topRight = {
            x: x1,
            y: y0,
        };
        
        const topRightCornerTimeOfCollision = getTimeOfCollisionWithCorner(topRight);

        if (topRightCornerTimeOfCollision !== null) {
            const collisionEvent = new CollisionEvent(
                rect,
                circle,
                topRightCornerTimeOfCollision,
            );
            validCollisionEvents.push(collisionEvent);
        }

        // bottom right 
        const bottomRight = {
            x: x1,
            y: y1,
        };

        const bottomRightCornerTimeOfCollision = getTimeOfCollisionWithCorner(bottomRight);

        if (bottomRightCornerTimeOfCollision !== null) {
            const collisionEvent = new CollisionEvent(
                rect,
                circle,
                bottomRightCornerTimeOfCollision,
            );
            validCollisionEvents.push(collisionEvent);
        }
        
        // botom left
        const bottomLeft = {
            x: x0,
            y: y1,
        };

        const bottomLeftCornerTimeOfCollision = getTimeOfCollisionWithCorner(bottomLeft);

        if (bottomLeftCornerTimeOfCollision !== null) {
            const collisionEvent = new CollisionEvent(
                rect,
                circle,
                bottomLeftCornerTimeOfCollision,
            );
            validCollisionEvents.push(collisionEvent);
        }
        
        return validCollisionEvents;
    }

    static moveBodyToPointOfCollision = (body, timeOfCollision) => {
        const dx = body.velocity.x * timeOfCollision;
        const dy = body.velocity.y * timeOfCollision;
        body.moveTo(body.x + dx, body.y + dy);
    };

    static resolveCollision = (collisionEvent) => {
        const { movingBody, collisionBody, timeOfCollision, contact } = collisionEvent;

        /*
            2D Elastic Collision (angle-free)
            https://stackoverflow.com/questions/35211114/2d-elastic-ball-collision-physics

                                mass scalar      dot product (scalar)        magnitude        pos diff vector
                vA` = vA - (2mB / (mA + mB)) * (<vA - vB | xA - xB> / (|| xA - xB || ** 2)) * (xA - xB)
                  where v = velocity
                        m = mass
                        x = position (at time of collision)
        */

        Collisions.moveBodyToPointOfCollision(movingBody, timeOfCollision);

        const { center: xA, mass: mA, velocity: vA } = movingBody;
        const { center: xB, mass: mB, velocity: vB } = collisionBody;

        const diffVelocities = Vectors.subtract(vA, vB);
        const diffPositions = Vectors.subtract(xA, xB);
        const dotProduct = Vectors.dot(diffVelocities, diffPositions);
        const magnitude = Vectors.magnitude(diffPositions) ** 2;

        if (collisionBody.isFixed) {
            if (collisionBody.isCircle) {
                const redirectedVector = Vectors.subtract(movingBody.center, collisionBody.center);
                movingBody.setVelocity(Vectors.rescale(redirectedVector, Vectors.magnitude(vA)));
            } else {
                if (contact.hasOwnProperty('x0') || contact.hasOwnProperty('x1')) { // collision with left / right side
                    movingBody.setVelocity({ x: -vA.x, y: vA.y });
                    if (Collisions.isMovingTowardsBody(movingBody, collisionBody)) {
                        movingBody.setVelocity({ x: -vA.x, y: -vA.y });
                    }
                } else if (contact.hasOwnProperty('y0') || contact.hasOwnProperty('y1')) { // collision with top / bottom side
                    movingBody.setVelocity({ x: vA.x, y: -vA.y });
                    if (Collisions.isMovingTowardsBody(movingBody, collisionBody)) {
                        movingBody.setVelocity({ x: -vA.x, y: -vA.y });
                    }
                } else {
                    const redirectedVector = Vectors.subtract(vA, Vectors.mult(diffPositions, (dotProduct / magnitude )));
                    movingBody.setVelocity(Vectors.rescale(redirectedVector, Vectors.magnitude(vA)));
                }
            }
            
            return;
        }

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
        
        if (bodyA.isCircle && bodyB.isCircle) {
            // https://math.stackexchange.com/questions/1438002/determine-if-objects-are-moving-towards-each-other
            const diffVelocity = Vectors.neg(bodyA.velocity); // v2 - v1, except we don't want to consider whether bodyB is moving towards bodyA
            const diffPosition = Vectors.subtract(bodyB.center, bodyA.center);
            return Vectors.dot(diffVelocity, diffPosition) < 0;
        }

        if (vA.x > 0 && bodyA.center.x <= bodyB.x0) return true;
        if (vA.x < 0 && bodyA.center.x >= bodyB.x1) return true;
        if (vA.y > 0 && bodyA.center.y <= bodyB.y0) return true;
        if (vA.y < 0 && bodyA.center.y >= bodyB.y1) return true;

        return false;
    }

}