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
        const createCircleVsRectangleCollisionEvent = (timeOfCollision, collisionPoint) => {
            return new CircleVsRectangleCollisionEvent({
                movingBody: circle,
                collisionBody: rect,
                timeOfCollision,
                collisionPoint,
            });
        }

        const validCollisionEvents = [];

        // consider collision into rectangle against any of circle's 4 axis-aligned "sides"

        const circleSideCollisions = [
            // circle right side into rect left side
            {
                movingCircleBoundary: circle.center.x + circle.radius,
                collisionRectBoundary: rect.x0,
                axisOfCollision: 'x',
            },
            // circle left side into rect right side
            {
                movingCircleBoundary: circle.center.x - circle.radius,
                collisionRectBoundary: rect.x1,
                axisOfCollision: 'x',
            },
            // circle bottom side into rect top side
            {
                movingCircleBoundary: circle.center.y + circle.radius,
                collisionRectBoundary: rect.y0,
                axisOfCollision: 'y',
            },
            // circle top side into rect bottom side
            {
                movingCircleBoundary: circle.center.y - circle.radius,
                collisionRectBoundary: rect.y1,
                axisOfCollision: 'y',
            },
        ];

        for (const possibleCollision of circleSideCollisions) {
            const { movingCircleBoundary, collisionRectBoundary, axisOfCollision } = possibleCollision;
            
            const isXAlignedCollision = axisOfCollision === 'x';
            const rateOfChangeInAxis = isXAlignedCollision ? circle.velocity.x : circle.velocity.y;
            const rateOfChangeInOtherAxis = isXAlignedCollision ? circle.velocity.y : circle.velocity.x;

            const timeOfCollision = CollisionEvents.getTimeOfAxisAlignedCollision(movingCircleBoundary, collisionRectBoundary, rateOfChangeInAxis);

            if (!CollisionEvents.isValidTimeOfCollision(timeOfCollision)) continue;

            const otherAxisAtTimeOfCollision = (isXAlignedCollision ? circle.center.y : circle.center.x) + rateOfChangeInOtherAxis * timeOfCollision;

            const rectOtherAxisLowerBoundary = isXAlignedCollision ? rect.y0 : rect.x0;
            const rectOtherAxisUpperBoundary = isXAlignedCollision ? rect.y1 : rect.x1;

            if (
                rectOtherAxisLowerBoundary <= otherAxisAtTimeOfCollision &&
                otherAxisAtTimeOfCollision <= rectOtherAxisUpperBoundary
            ) {
                const collisionPoint = isXAlignedCollision 
                    ? {
                        x: collisionRectBoundary,
                        y: otherAxisAtTimeOfCollision,
                    }
                    : {
                        x: otherAxisAtTimeOfCollision,
                        y: collisionRectBoundary,
                    };
                
                const collisionEvent = createCircleVsRectangleCollisionEvent(timeOfCollision, collisionPoint);
                validCollisionEvents.push(collisionEvent);
            }
        }

        // if a collision occurs with a circle side, then we don't need to check for corners
        if (validCollisionEvents.length) {
            return validCollisionEvents;
        }

        const corners = [
            { x: rect.x0, y: rect.y0 }, // top left
            { x: rect.x1, y: rect.y0 }, // top right
            { x: rect.x1, y: rect.y1 }, // bottom right
            { x: rect.x0, y: rect.y1 }, // bottom left
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
        const createRectangleVsCircleCollisionEvent = (timeOfCollision, collisionPoint) => {
            return new CircleVsRectangleCollisionEvent({
                movingBody: rect,
                collisionBody: circle,
                timeOfCollision,
                collisionPoint,
            });
        };

        const validCollisionEvents = [];

        // consider collision into circle against any of it's 4 axis-aligned "sides"

        const circleSideCollisions = [
            // rectangle right side into circle left side
            {
                movingRectBoundary: rect.x1,
                collisionCircleBoundary: circle.center.x - circle.radius,
                axisOfCollision: 'x',
            },
            // rectangle left side into circle right side
            {
                movingRectBoundary: rect.x0,
                collisionCircleBoundary: circle.center.x + circle.radius,
                axisOfCollision: 'x',
            },
            // rectangle bottom side into circle top side
            {
                movingRectBoundary: rect.y1,
                collisionCircleBoundary: circle.center.y - circle.radius,
                axisOfCollision: 'y',
            },
            // rectangle top side into circle bottom side
            {
                movingRectBoundary: rect.y0,
                collisionCircleBoundary: circle.center.y + circle.radius,
                axisOfCollision: 'y',
            },
        ];

        for (const possibleCollision of circleSideCollisions) {
            const { axisOfCollision, movingRectBoundary, collisionCircleBoundary } = possibleCollision;

            const isXAlignedCollision = axisOfCollision === 'x';
            const rateOfChangeInAxis = isXAlignedCollision ? rect.velocity.x : rect.velocity.y;
            const rateOfChangeInOtherAxis = isXAlignedCollision ? rect.velocity.y : rect.velocity.x;

            const timeOfCollision = CollisionEvents.getTimeOfAxisAlignedCollision(movingRectBoundary, collisionCircleBoundary, rateOfChangeInAxis);

            if (!CollisionEvents.isValidTimeOfCollision(timeOfCollision)) continue;

            const changeInOtherAxisAtTimeOfCollision = rateOfChangeInOtherAxis * timeOfCollision;
            const rectOtherAxisLowerBoundary = isXAlignedCollision ? rect.y0 : rect.x0;
            const rectOtherAxisUpperBoundary = isXAlignedCollision ? rect.y1 : rect.x1;
            
            const rectOtherAxisLowerBoundaryAtTimeOfCollision = rectOtherAxisLowerBoundary + changeInOtherAxisAtTimeOfCollision;
            const rectOtherAxisUpperBoundaryAtTimeOfCollision = rectOtherAxisUpperBoundary + changeInOtherAxisAtTimeOfCollision;

            const circleCenterOfAxisCollision = isXAlignedCollision ? circle.center.y : circle.center.x;
            
            if (
                rectOtherAxisLowerBoundaryAtTimeOfCollision <= circleCenterOfAxisCollision && 
                circleCenterOfAxisCollision <= rectOtherAxisUpperBoundaryAtTimeOfCollision
            ) {
                const circleOtherAxisValueAtTimeOfCollision = isXAlignedCollision ? circle.center.y : circle.center.x;

                const collisionPoint = isXAlignedCollision
                    ? {
                        x: collisionCircleBoundary,
                        y: circleOtherAxisValueAtTimeOfCollision,
                    }
                    : {
                        x: circleOtherAxisValueAtTimeOfCollision,
                        y: collisionCircleBoundary,
                    };

                const collisionEvent = createRectangleVsCircleCollisionEvent(timeOfCollision, collisionPoint);
                validCollisionEvents.push(collisionEvent);
            }
        }

        // if a collision occurs with a circle side, then we don't need to check for corners
        if (validCollisionEvents.length) {
            return validCollisionEvents;
        }

        const corners = [
            { x: rect.x0, y: rect.y0 }, // top left
            { x: rect.x1, y: rect.y0 }, // top right
            { x: rect.x1, y: rect.y1 }, // bottom right
            { x: rect.x0, y: rect.y1 }, // bottom left
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