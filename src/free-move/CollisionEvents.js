import { Maths } from "./Maths";
import {
    COLLISION_SIDES,
    OPPOSITE_SIDE_MAP,
    getCircleVsRectanglePossibleSideCollisions,
    getCornerCollisionEventsReducer,
    getHeterogeneousCollisionEvents,
    getRectangleVsCirclePossibleSideCollisions,
    getTimeOfAxisAlignedCollision,
    getTimeOfCircleVsCircleCollision,
    getTimeOfCircleVsRectangleCornerCollision,
    getTimeOfRectangleCornerVsCircleCollision,
    isValidTimeOfCollision,
} from "./collision-events.util";

export class CircleVsCircleCollisionEvent {
    constructor({ movingBody, collisionBody, timeOfCollision }) {
        this.movingBody = movingBody;
        this.collisionBody = collisionBody;
        this.timeOfCollision = timeOfCollision;
    }
};

// circle vs rectangle / rectangle vs circle
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

export class CollisionEvents {
    static getCircleVsCircleCollisionEvent = (circleA, circleB) => {
        const timeOfCollision = getTimeOfCircleVsCircleCollision(circleA, circleB);
        
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

        const getSideCollisionEvents = () => {
            return getCircleVsRectanglePossibleSideCollisions(circle, rect).reduce((validCollisionEvents, possibleCollision) => {
                const { movingCircleBoundary, collisionRectBoundary, axisOfCollision } = possibleCollision;
                
                const isXAlignedCollision = axisOfCollision === 'x';
                const rateOfChangeInAxis = isXAlignedCollision ? circle.velocity.x : circle.velocity.y;
                const rateOfChangeInOtherAxis = isXAlignedCollision ? circle.velocity.y : circle.velocity.x;

                const timeOfCollision = getTimeOfAxisAlignedCollision(movingCircleBoundary, collisionRectBoundary, rateOfChangeInAxis);

                if (!isValidTimeOfCollision(timeOfCollision)) return validCollisionEvents;

                const otherAxisAtTimeOfCollision = 
                    (isXAlignedCollision ? circle.center.y : circle.center.x) + rateOfChangeInOtherAxis * timeOfCollision;

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

                return validCollisionEvents;
            }, []);
        };

        const getCornerCollisionEvents = () => {
            return getCornerCollisionEventsReducer(
                rect,
                (corner) => getTimeOfCircleVsRectangleCornerCollision(circle, corner),
                createCircleVsRectangleCollisionEvent,
            );
        };

        return getHeterogeneousCollisionEvents(getSideCollisionEvents, getCornerCollisionEvents);
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
        
        const getSideCollisionEvents = () => {
            return getRectangleVsCirclePossibleSideCollisions(rect, circle).reduce((validCollisionEvents, possibleCollision) => {
                const { axisOfCollision, movingRectBoundary, collisionCircleBoundary } = possibleCollision;

                const isXAlignedCollision = axisOfCollision === 'x';
                const rateOfChangeInAxis = isXAlignedCollision ? rect.velocity.x : rect.velocity.y;
                const rateOfChangeInOtherAxis = isXAlignedCollision ? rect.velocity.y : rect.velocity.x;
    
                const timeOfCollision = getTimeOfAxisAlignedCollision(movingRectBoundary, collisionCircleBoundary, rateOfChangeInAxis);
    
                if (!isValidTimeOfCollision(timeOfCollision)) return validCollisionEvents;
    
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

                return validCollisionEvents;
            }, []);
        };

        const getCornerCollisionEvents = () => {
            return getCornerCollisionEventsReducer(
                rect,
                (corner) => getTimeOfRectangleCornerVsCircleCollision(corner, circle, rect.velocity),
                createRectangleVsCircleCollisionEvent,
            );
        };

        return getHeterogeneousCollisionEvents(getSideCollisionEvents, getCornerCollisionEvents);
    }

    static getRectangleVsRectangleCollisionEvents = (rectA, rectB) => {
        return COLLISION_SIDES.reduce((validCollisionEvents, movingBodyContactSide) => {
            const movingBoundary = rectA[movingBodyContactSide];

            const collisionBodyContactSide = OPPOSITE_SIDE_MAP[movingBodyContactSide];
            const collisionBoundary = rectB[collisionBodyContactSide];
            
            const { x: dx, y: dy } = rectA.velocity;

            const isXAlignedCollision = movingBodyContactSide.includes('x');

            const rateOfChangeInAxis = isXAlignedCollision ? dx : dy;
            const timeOfCollision = getTimeOfAxisAlignedCollision(movingBoundary, collisionBoundary, rateOfChangeInAxis);
            
            // determine if the moving rect will pass the collision rect boundary
            if (!isValidTimeOfCollision(timeOfCollision)) return validCollisionEvents;

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