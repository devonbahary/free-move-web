import { Rectangle } from "./Bodies";
import { CollisionEvent } from "./CollisionEvent";
import { Vectors } from "./Vectors";

const quadratic = (a, b, c) => {
    return [
        (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
    ];
};

const hasOverlap = (a0, a1, b0, b1) => {
    if (b1 < a0) return false;
    if (a1 < b0) return false;
    return true;
};

 // treat floating point errors like collisions so that they are not ignored (e.g., -7.082604849269798e-7 should be 0)
const roundFloatingPoint = (timeOfCollision) => {
    return Math.round(timeOfCollision * 1000) / 1000;
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
            roundFloatingPoint(timeOfCollision) >= 0 // treat floating point errors like collisions so that they are not ignored (e.g., -7.082604849269798e-7)
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

        // consider collision into rectangle against any of circle's 4 axis-aligned "corners"

        // circle right-most point into rectangle left side
        const timeOfX0Collision = getTimeOfAxisAlignedCollision(x + radius, x0, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX0Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX0Collision;
            
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                const circleX1AtTimeOfCollision = circle.x1 + dx * timeOfX0Collision;
                const circleCenterYAtTimeOfCollision = circle.center.y + dy * timeOfX0Collision;

                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfX0Collision,
                    { x0 },
                    { 
                        x: circleX1AtTimeOfCollision, 
                        y: circleCenterYAtTimeOfCollision,
                    },
                );

                validCollisionEvents.push(collisionEvent);
            }
        }

        // circle left-most point into rectangle right side
        const timeOfX1Collision = getTimeOfAxisAlignedCollision(x - radius, x1, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX1Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX1Collision;
            
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                const circleX0AtTimeOfCollision = circle.x0 + dx * timeOfX1Collision;
                const circleCenterYAtTimeOfCollision = circle.center.y + dy * timeOfX1Collision;

                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfX1Collision,
                    { x1 },
                    {
                        x: circleX0AtTimeOfCollision,
                        y: circleCenterYAtTimeOfCollision,
                    },
                );
                
                validCollisionEvents.push(collisionEvent);
            }
        }

        // circle bottom-most point into rectangle top side
        const timeOfY0Collision = getTimeOfAxisAlignedCollision(y + radius, y0, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY0Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY0Collision;
            
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                const circleCenterXAtTimeOfCollision = circle.center.x + dx * timeOfY0Collision;
                const circleY1AtTimeOfCollision = circle.y1 + dy * timeOfY0Collision;

                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfY0Collision,
                    { y0 },
                    {
                        x: circleCenterXAtTimeOfCollision,
                        y: circleY1AtTimeOfCollision,
                    },
                );
                
                validCollisionEvents.push(collisionEvent);
            }
        }

        // circle top-most point into rectangle bottom side
        const timeOfY1Collision = getTimeOfAxisAlignedCollision(y - radius, y1, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY1Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY1Collision;
            
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                const circleCenterXAtTimeOfCollision = circle.center.x + dx * timeOfY1Collision;
                const circleY0AtTimeOfCollision = circle.y0 + dy * timeOfY1Collision;

                const collisionEvent = new CollisionEvent(
                    circle,
                    rect,
                    timeOfY1Collision,
                    { y1 },
                    {
                        x: circleCenterXAtTimeOfCollision,
                        y: circleY0AtTimeOfCollision,
                    },
                );

                validCollisionEvents.push(collisionEvent);
            }
        }

        // if a collision occurs with a rectangle side, then we don't need to check for rectangle corners
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
                collisionSide,
                topLeft,
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
                topRight,
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
                bottomRight,
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
                bottomLeft,
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

        const getCirclePointYsFromCircleX = (x) => {
            // (x  - h)^2 + (y - k)^2 = r^2
            const { center, radius: r } = circle;
            const { x: h, y: k } = center;
            // y^2 - 2yk + k^2 - r^2 + (x - h)^2 = 0
            const b = -2 * k;
            const c = k ** 2 - r ** 2 + (x - h) ** 2;
            return quadratic(1, b, c);
        };

        const getCirclePointXsFromCircleY = (y) => {
            // (x  - h)^2 + (y - k)^2 = r^2
            const { center, radius: r } = circle;
            const { x: h, y: k } = center;
            // x^2 - 2xh + h^2 - r^2 + (y - k)^2 = 0
            const b = -2 * h;
            const c = h ** 2 - r ** 2 + (y - k) ** 2;
            return quadratic(1, b, c);
        };
        
        // rectangle right side into circle left-most point
        const timeOfX1Collision = getTimeOfAxisAlignedCollision(x1, x - radius, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX1Collision)) {
            const changeInY = dy * timeOfX1Collision;
            const y0 = rect.y0 + changeInY;
            const y1 = rect.y1 + changeInY;
            
            if (y0 <= y && y <= y1) {
                const circleXAtTimeOfCollision = x1 + dx * timeOfX1Collision;
                const [ circleYAtTimeOfCollision ] = getCirclePointYsFromCircleX(circleXAtTimeOfCollision);
                
                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfX1Collision,
                    undefined,
                    {
                        x: x1,
                        y: circleYAtTimeOfCollision,
                    },
                );

                validCollisionEvents.push(collisionEvent);
            }
        }

        // rectangle left side into circle right-most point
        const timeOfX0Collision = getTimeOfAxisAlignedCollision(x0, x + radius, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX0Collision)) {
            const changeInY = dy * timeOfX0Collision;
            const y0 = rect.y0 + changeInY;
            const y1 = rect.y1 + changeInY;
            
            if (y0 <= y && y <= y1) {
                const circleXAtTimeOfCollision = x0 + dx * timeOfX0Collision;
                const [ circleYAtTimeOfCollision ] = getCirclePointYsFromCircleX(circleXAtTimeOfCollision);

                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfX0Collision,
                    undefined, 
                    {
                        x: circleXAtTimeOfCollision,
                        y: circleYAtTimeOfCollision,
                    },
                );
                validCollisionEvents.push(collisionEvent);
            }
        }

        // rectangle bottom side into circle top-most point
        const timeOfY1Collision = getTimeOfAxisAlignedCollision(y1, y - radius, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY1Collision)) {
            const changeInX = dx * timeOfY1Collision;
            const x0 = rect.x0 + changeInX;
            const x1 = rect.x1 + changeInX;
            
            if (x0 <= x && x <= x1) {
                const circleYAtTimeOfCollision = y1 + dy * timeOfY1Collision;
                const [ circleXAtTimeOfCollision ] = getCirclePointXsFromCircleY(circleYAtTimeOfCollision);
                
                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfY1Collision,
                    undefined,
                    {
                        x: circleXAtTimeOfCollision,
                        y: circleYAtTimeOfCollision,
                    },
                );

                validCollisionEvents.push(collisionEvent);
            }
        }

        // rectangle top side into circle bottom-most point
        const timeOfY0Collision = getTimeOfAxisAlignedCollision(y0, y + radius, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY0Collision)) {
            const changeInX = dx * timeOfY0Collision;
            const x0 = rect.x0 + changeInX;
            const x1 = rect.x1 + changeInX;
            
            if (x0 <= x && x <= x1) {
                const circleYAtTimeOfCollision = y0 + dy * timeOfY0Collision;
                const [ circleXAtTimeOfCollision ] = getCirclePointXsFromCircleY(circleYAtTimeOfCollision);

                const collisionEvent = new CollisionEvent(
                    rect,
                    circle,
                    timeOfY0Collision,
                    undefined,
                    {
                        x: circleXAtTimeOfCollision,
                        y: circleYAtTimeOfCollision,
                    },
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
                undefined,
                topLeft,
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
                undefined,
                topRight,
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
                undefined,
                bottomRight,
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
                undefined,
                bottomLeft,
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
        const { movingBody, collisionBody, timeOfCollision, contact, collisionPoint } = collisionEvent;

        Collisions.moveBodyToPointOfCollision(movingBody, timeOfCollision);

        const { mass: mA, velocity: vA } = movingBody;
        const { mass: mB, velocity: vB } = collisionBody;

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
                    throw new Error(`cannot resolve collision against rectangle without contact`);
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

        const diffPositions = Vectors.subtract(collisionBody.center, movingBody.center);
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
    
    static isPointMovingTowardsPoint = (pointA, pointB, pointAVelocity) => {
        // https://math.stackexchange.com/questions/1438002/determine-if-objects-are-moving-towards-each-other
        const diffVelocity = Vectors.neg(pointAVelocity); // v2 - v1, except we don't want to consider whether bodyB is moving towards bodyA
        const diffPosition = Vectors.subtract(pointB, pointA);
        return Vectors.dot(diffVelocity, diffPosition) < 0;
    }

    // TODO: revisit, isn't working intuitively for rectangle vs any collisions
    static isMovingTowardsBody = (bodyA, bodyB) => {
        const { velocity: vA } = bodyA;

        if (!vA.x && !vA.y) return false;
        
        if (Collisions.isCircleVsCircle(bodyA, bodyB)) {
            return Collisions.isPointMovingTowardsPoint(bodyA.center, bodyB.center, bodyA.velocity);
        }

        if (Collisions.isRectangleVsRectangle(bodyA, bodyB)) {
            const isMovingInXDirection = vA.x > 0
                ? bodyA.x1 <= bodyB.x0
                : bodyA.x0 >= bodyB.x1;
            const isMovingInYDirection = vA.y > 0
                ? bodyA.y1 <= bodyB.y0
                : bodyA.y0 >= bodyB.y1;
            const hasXOverlap = hasOverlap(bodyA.x0, bodyA.x1, bodyB.x0, bodyB.x1);
            const hasYOverlap = hasOverlap(bodyA.y0, bodyA.y1, bodyB.y0, bodyB.y1);

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
            const collisionEvents = Collisions.getCircleVsRectangleCollisionEvents(bodyA, bodyB);
            const alreadyTouchingEvent = collisionEvents.find(event => roundFloatingPoint(event.timeOfCollision) === 0);
            
            if (alreadyTouchingEvent) {
                return Collisions.isPointMovingTowardsPoint(bodyA.center, alreadyTouchingEvent.collisionPoint, bodyA.velocity);
            }
        } else if (!bodyA.isCircle && bodyB.isCircle) { // rectangle vs circle
            const collisionEvents = Collisions.getRectangleVsCircleCollisionEvents(bodyA, bodyB);
            const alreadyTouchingEvent = collisionEvents.find(event => roundFloatingPoint(event.timeOfCollision) === 0);
            
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

    static isCircleVsCircle = (bodyA, bodyB) => {
        return bodyA.isCircle && bodyB.isCircle;
    }

    static isRectangleVsRectangle = (bodyA, bodyB) => {
        return !bodyA.isCircle && !bodyB.isCircle;
    }
}