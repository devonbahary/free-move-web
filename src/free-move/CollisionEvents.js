import { Maths } from "./Maths";
import { Vectors } from "./Vectors";

export class CircleVsCircleCollisionEvent {
    constructor({ movingBody, collisionBody, timeOfCollision }) {
        this.movingBody = movingBody;
        this.collisionBody = collisionBody;
        this.timeOfCollision = timeOfCollision;
    }
};

export class CircleVsRectangleCollisionEvent extends CircleVsCircleCollisionEvent {
    constructor({ collisionPoint, ...rest }) {
        super(rest);
        this.collisionPoint = collisionPoint;
    }
};

export class RectangleVsRectangleCollisionEvent extends CircleVsCircleCollisionEvent {
    constructor({ contact, ...rest }) {
        super(rest);
        this.contact = contact;
    }
};

const COLLISION_SIDES = [ 'x0', 'x1', 'y0', 'y1' ];

const OPPOSITE_SIDE_MAP = {
    x0: 'x1',
    x1: 'x0',
    y0: 'y1',
    y1: 'y0',
};

export class CollisionEvents {
    static isValidTimeOfCollision = (timeOfCollision) => {
        return Boolean(
            timeOfCollision !== null &&
            timeOfCollision <= 1 && 
            Maths.roundFloatingPoint(timeOfCollision) >= 0 // treat floating point errors like collisions so that they are not ignored (e.g., -7.082604849269798e-7)
        );
    }

    // TODO: this function would be more clear if it didn't ALSO include the logic of filtering undesired values
    // returns ~0 < t < 1 or null, where t is the distance along movement where collision happens
    static getTimeOfCollision = (a, b, c) => {
        const roots = Maths.quadratic(a, b, c);

        // roots can be outside the range of 0 < t < 1 because our broad approximations can be 
        // wrong; only when 0 < t < 1 will a collision actually occur
        return roots.reduce((timeOfCollision, root) => {
            if (!CollisionEvents.isValidTimeOfCollision(root)) return timeOfCollision;

            return timeOfCollision === null || root < timeOfCollision ? root : timeOfCollision;
        }, null);
    };

    static getTimeOfCircleVsRectangleCornerCollision = (circle, corner) => {
        const diffPos = Vectors.subtract(circle.center, corner);
        return CollisionEvents.getTimeOfCircleVsPointCollision(diffPos, circle.radius, circle.velocity);
    }

    static getTimeOfRectangleCornerVsCircleCollision = (corner, circle, rectVelocity) => {
        const diffPos = Vectors.subtract(corner, circle.center);
        return CollisionEvents.getTimeOfCircleVsPointCollision(diffPos, circle.radius, rectVelocity);
    }

    static getTimeOfCircleVsPointCollision = (diffPos, radius, velocity) => {
        const { x: dx, y: dy} = velocity;

        const a = dx ** 2 + dy ** 2;
        const b = 2 * diffPos.x * dx + 2 * diffPos.y * dy;
        const c = diffPos.x ** 2 + diffPos.y ** 2 - radius ** 2;
        
        return CollisionEvents.getTimeOfCollision(a, b, c);
    }

    static getTimeOfAxisAlignedCollision = (movingBoundary, approachingBoundary, changeInAxis) => {
        if (changeInAxis === 0) return null;

        return (approachingBoundary - movingBoundary) / changeInAxis;
    }
    
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

        return CollisionEvents.getTimeOfCollision(a, b, c);
    }

    static getCircleVsCircleCollisionEvent = (circleA, circleB) => {
        const timeOfCollision = CollisionEvents.getTimeOfCircleVsCircleCollision(circleA, circleB);
        
        if (timeOfCollision === null) return null;
        
        return new CircleVsCircleCollisionEvent({
            movingBody: circleA,
            collisionBody: circleB,
            timeOfCollision,
        });
    }

    static getCircleVsRectangleCollisionEvents = (circle, rect) => {
        const { center, radius, velocity } = circle;
        const { x, y } = center;
        const { x: dx, y: dy } = velocity;

        const { x0, x1, y0, y1 } = rect;

        const createCircleVsRectangleCollisionEvent = (timeOfCollision, collisionPoint) => {
            return new CircleVsRectangleCollisionEvent({
                movingBody: circle,
                collisionBody: rect,
                timeOfCollision,
                collisionPoint,
            });
        }

        const validCollisionEvents = [];

        // consider collision into rectangle against any of circle's 4 axis-aligned "corners"

        // circle right-most point into rectangle left side
        const timeOfX0Collision = CollisionEvents.getTimeOfAxisAlignedCollision(x + radius, x0, dx);
        if (CollisionEvents.isValidTimeOfCollision(timeOfX0Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX0Collision;
            
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                const circleX1AtTimeOfCollision = circle.x1 + dx * timeOfX0Collision;
                const circleCenterYAtTimeOfCollision = circle.center.y + dy * timeOfX0Collision;
                const collisionPoint = { 
                    x: circleX1AtTimeOfCollision, 
                    y: circleCenterYAtTimeOfCollision,
                };

                const collisionEvent = createCircleVsRectangleCollisionEvent(timeOfX0Collision, collisionPoint);
                validCollisionEvents.push(collisionEvent);
            }
        }

        // circle left-most point into rectangle right side
        const timeOfX1Collision = CollisionEvents.getTimeOfAxisAlignedCollision(x - radius, x1, dx);
        if (CollisionEvents.isValidTimeOfCollision(timeOfX1Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX1Collision;
            
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                const circleX0AtTimeOfCollision = circle.x0 + dx * timeOfX1Collision;
                const circleCenterYAtTimeOfCollision = circle.center.y + dy * timeOfX1Collision;
                const collisionPoint = {
                    x: circleX0AtTimeOfCollision,
                    y: circleCenterYAtTimeOfCollision,
                };

                const collisionEvent = createCircleVsRectangleCollisionEvent(timeOfX1Collision, collisionPoint);
                validCollisionEvents.push(collisionEvent);
            }
        }

        // circle bottom-most point into rectangle top side
        const timeOfY0Collision = CollisionEvents.getTimeOfAxisAlignedCollision(y + radius, y0, dy);
        if (CollisionEvents.isValidTimeOfCollision(timeOfY0Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY0Collision;
            
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                const circleCenterXAtTimeOfCollision = circle.center.x + dx * timeOfY0Collision;
                const circleY1AtTimeOfCollision = circle.y1 + dy * timeOfY0Collision;
                const collisionPoint = {
                    x: circleCenterXAtTimeOfCollision,
                    y: circleY1AtTimeOfCollision,
                };

                const collisionEvent = createCircleVsRectangleCollisionEvent(timeOfY0Collision, collisionPoint);
                validCollisionEvents.push(collisionEvent);
            }
        }

        // circle top-most point into rectangle bottom side
        const timeOfY1Collision = CollisionEvents.getTimeOfAxisAlignedCollision(y - radius, y1, dy);
        if (CollisionEvents.isValidTimeOfCollision(timeOfY1Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY1Collision;
            
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                const circleCenterXAtTimeOfCollision = circle.center.x + dx * timeOfY1Collision;
                const circleY0AtTimeOfCollision = circle.y0 + dy * timeOfY1Collision;
                const collisionPoint = {
                    x: circleCenterXAtTimeOfCollision,
                    y: circleY0AtTimeOfCollision,
                };

                const collisionEvent = createCircleVsRectangleCollisionEvent(timeOfY1Collision, collisionPoint);
                validCollisionEvents.push(collisionEvent);
            }
        }

        // if a circle axis-aligned collision with a rectangle side occurs, we don't need to check for corners
        if (validCollisionEvents.length) {
            return validCollisionEvents;
        }

        const corners = [
            { x: x0, y: y0 }, // top left
            { x: x1, y: y0 }, // top right
            { x: x1, y: y1 }, // bottom right
            { x: x0, y: y1 }, // bottom left
        ];

        for (const corner of corners) {
            const cornerTimeOfCollision = CollisionEvents.getTimeOfCircleVsRectangleCornerCollision(circle, corner);
            if (cornerTimeOfCollision !== null) {
                const collisionEvent = createCircleVsRectangleCollisionEvent(cornerTimeOfCollision, corner);
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

        const createRectangleVsCircleCollisionEvent = (timeOfCollision, collisionPoint) => {
            return new CircleVsRectangleCollisionEvent({
                movingBody: rect,
                collisionBody: circle,
                timeOfCollision,
                collisionPoint,
            });
        };

        const validCollisionEvents = [];

        // consider collision into circle against any of it's 4 axis-aligned "corners"
        
        // rectangle right side into circle left-most point
        const timeOfX1Collision = getTimeOfAxisAlignedCollision(x1, x - radius, dx);
        if (CollisionEvents.isValidTimeOfCollision(timeOfX1Collision)) {
            const changeInY = dy * timeOfX1Collision;
            const y0 = rect.y0 + changeInY;
            const y1 = rect.y1 + changeInY;
            
            if (y0 <= y && y <= y1) {
                const circleXAtTimeOfCollision = x1 + dx * timeOfX1Collision;
                const [ circleYAtTimeOfCollision ] = circle.getYValuesForX(circleXAtTimeOfCollision);
                
                if (circleYAtTimeOfCollision !== undefined) {
                    const collisionPoint = {
                        x: x1,
                        y: circleYAtTimeOfCollision,
                    };

                    const collisionEvent = createRectangleVsCircleCollisionEvent(timeOfX1Collision, collisionPoint);
                    validCollisionEvents.push(collisionEvent);
                }
            }
        }

        // rectangle left side into circle right-most point
        const timeOfX0Collision = getTimeOfAxisAlignedCollision(x0, x + radius, dx);
        if (CollisionEvents.isValidTimeOfCollision(timeOfX0Collision)) {
            const changeInY = dy * timeOfX0Collision;
            const y0 = rect.y0 + changeInY;
            const y1 = rect.y1 + changeInY;
            
            if (y0 <= y && y <= y1) {
                const circleXAtTimeOfCollision = x0 + dx * timeOfX0Collision;
                const [ circleYAtTimeOfCollision ] = circle.getYValuesForX(circleXAtTimeOfCollision);
                
                if (circleYAtTimeOfCollision !== undefined) {
                    const collisionPoint = {
                        x: circleXAtTimeOfCollision,
                        y: circleYAtTimeOfCollision,
                    };

                    const collisionEvent = createRectangleVsCircleCollisionEvent(timeOfX0Collision, collisionPoint);
                    validCollisionEvents.push(collisionEvent);
                }
            }
        }

        // rectangle bottom side into circle top-most point
        const timeOfY1Collision = getTimeOfAxisAlignedCollision(y1, y - radius, dy);
        if (CollisionEvents.isValidTimeOfCollision(timeOfY1Collision)) {
            const changeInX = dx * timeOfY1Collision;
            const x0 = rect.x0 + changeInX;
            const x1 = rect.x1 + changeInX;
            
            if (x0 <= x && x <= x1) {
                const circleYAtTimeOfCollision = y1 + dy * timeOfY1Collision;
                const [ circleXAtTimeOfCollision ] = circle.getXValuesForY(circleYAtTimeOfCollision);
                
                if (circleXAtTimeOfCollision !== undefined) {
                    const collisionPoint = {
                        x: circleXAtTimeOfCollision,
                        y: circleYAtTimeOfCollision,
                    };

                    const collisionEvent = createRectangleVsCircleCollisionEvent(timeOfY1Collision, collisionPoint);
                    validCollisionEvents.push(collisionEvent);
                }
            }
        }

        // rectangle top side into circle bottom-most point
        const timeOfY0Collision = getTimeOfAxisAlignedCollision(y0, y + radius, dy);
        if (CollisionEvents.isValidTimeOfCollision(timeOfY0Collision)) {
            const changeInX = dx * timeOfY0Collision;
            const x0 = rect.x0 + changeInX;
            const x1 = rect.x1 + changeInX;
            
            if (x0 <= x && x <= x1) {
                const circleYAtTimeOfCollision = y0 + dy * timeOfY0Collision;
                const [ circleXAtTimeOfCollision ] = circle.getXValuesForY(circleYAtTimeOfCollision);
                
                if (circleXAtTimeOfCollision !== undefined) {
                    const collisionPoint = {
                        x: circleXAtTimeOfCollision,
                        y: circleYAtTimeOfCollision,
                    };

                    const collisionEvent = createRectangleVsCircleCollisionEvent(timeOfY0Collision, collisionPoint);
                    validCollisionEvents.push(collisionEvent);
                }
            }
        }

        // if a collision occurs with a circle "corner", then we don't need further checks
        if (validCollisionEvents.length) {
            return validCollisionEvents;
        }

        const corners = [
            { x: x0, y: y0 }, // top left
            { x: x1, y: y0 }, // top right
            { x: x1, y: y1 }, // bottom right
            { x: x0, y: y1 }, // bottom left
        ];

        for (const corner of corners) {
            const timeOfCollision = CollisionEvents.getTimeOfRectangleCornerVsCircleCollision(corner, circle, rect.velocity);
            if (timeOfCollision !== null) {
                const collisionEvent = createRectangleVsCircleCollisionEvent(timeOfCollision, corner);
                validCollisionEvents.push(collisionEvent);
            }
        }
        
        return validCollisionEvents;
    }

    static getRectangleVsRectangleCollisionEvents = (rectA, rectB) => {
        return COLLISION_SIDES.reduce((validCollisionEvents, movingBodyContactSide) => {
            const movingBoundary = rectA[movingBodyContactSide];

            const collisionBodyContactSide = OPPOSITE_SIDE_MAP[movingBodyContactSide];
            const collisionBoundary = rectB[collisionBodyContactSide];
            
            const { x: dx, y: dy } = rectA.velocity;

            const isXAlignedCollision = movingBodyContactSide.includes('x');

            const rateOfChangeInAxis = isXAlignedCollision ? dx : dy;
            const timeOfCollision = CollisionEvents.getTimeOfAxisAlignedCollision(movingBoundary, collisionBoundary, rateOfChangeInAxis);
            
            // determine if the moving rect will pass the collision rect boundary
            if (!CollisionEvents.isValidTimeOfCollision(timeOfCollision)) return validCollisionEvents;

            const rateOfChangeInOtherAxis = isXAlignedCollision ? dy : dx;
            const changeInOtherAxis = rateOfChangeInOtherAxis * timeOfCollision;
            
            const a0 = isXAlignedCollision ? rectA.y0 : rectA.x0;
            const a1 = isXAlignedCollision ? rectA.y1 : rectA.x1;
            
            const a0AtTimeOfCollision = a0 + changeInOtherAxis;
            const a1AtTimeOfCollision = a1 + changeInOtherAxis;

            const b0 = isXAlignedCollision ? rectB.y0 : rectB.x0;
            const b1 = isXAlignedCollision ? rectB.y1 : rectB.x1;

            // determine if there is overlap between the two rects in the opposite axis at the time the collision boundary is met
            if (Maths.hasOverlap(a0AtTimeOfCollision, a1AtTimeOfCollision, b0, b1)) {
                const contact = { [collisionBodyContactSide]: collisionBoundary };
                
                const collisionEvent = new RectangleVsRectangleCollisionEvent({
                    movingBody: rectA,
                    collisionBody: rectB,
                    timeOfCollision,
                    contact,
                });
                
                validCollisionEvents.push(collisionEvent);
            }

            return validCollisionEvents;
        }, []);
    }
}