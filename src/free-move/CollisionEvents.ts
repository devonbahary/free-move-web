import { Maths } from "./Maths";
import {
    COLLISION_SIDES,
    OPPOSITE_SIDE_MAP,
    getCircleVsRectPossibleSideCollisions,
    getCornerCollisionEventsReducer,
    getHeterogeneousCollisionEvents,
    getRectVsCirclePossibleSideCollisions,
    getTimeOfAxisAlignedCollision,
    getTimeOfCircleVsCircleCollision,
    getTimeOfCircleVsRectCornerCollision,
    getTimeOfRectCornerVsCircleCollision,
    isValidTimeOfCollision,
} from "./collision-events.util";
import { Collisions } from "./Collisions";
import { BodyType, CircleBodyType, RectBodyType, CircleVsRectCollisionEvent, CollisionEvent, Vector, RectVsCircleCollisionEvent, RectVsRectCollisionEvent } from "./types";
import { isCircleBody, isRectBody } from "./Bodies";
import { Vectors } from "./Vectors";

export class CollisionEvents {
    // TODO: implement quadtree to prevent O(n^2)
    static getCollisionEventsInChronologicalOrder = (bodies: BodyType[], body: BodyType) => {
        const collisionEvents = bodies.reduce<CollisionEvent[]>((acc, otherBody) => {
            if (body === otherBody) return acc;

            // broad phase collision detection
            if (!Collisions.isMovingTowardsBody(body, otherBody)) {
                return acc;
            }

            if (isCircleBody(body) && isCircleBody(otherBody)) {
                const collisionEvent = CollisionEvents.getCircleVsCircleCollisionEvent(body, otherBody);
                if (collisionEvent) {
                    acc.push(collisionEvent);
                }
            } else if (isCircleBody(body) && isRectBody(otherBody)) {
                const collisionEvents = CollisionEvents.getCircleVsRectCollisionEvents(body, otherBody);
                acc.push(...collisionEvents);
            } else if (isRectBody(body) && isCircleBody(otherBody)) {
                const collisionEvents = CollisionEvents.getRectVsCircleCollisionEvents(body, otherBody);
                acc.push(...collisionEvents);
            } else if (isRectBody(body) && isRectBody(otherBody)) {
                const collisionEvents = CollisionEvents.getRectVsRectCollisionEvents(body, otherBody);
                acc.push(...collisionEvents);
            } else {
                throw new Error(`can't recognize collision type for bodies: ${JSON.stringify(body)}, ${JSON.stringify(otherBody)}`);
            }

            return acc;
        }, []);

        return collisionEvents.sort((a, b) => a.timeOfCollision - b.timeOfCollision)
    }
    
    static getCircleVsCircleCollisionEvent = (
        circleA: CircleBodyType, 
        circleB: CircleBodyType,
    ): CollisionEvent | null => {
        const timeOfCollision = getTimeOfCircleVsCircleCollision(circleA, circleB);
        
        if (timeOfCollision === null) return null;
        
        return {
            movingBody: circleA,
            collisionBody: circleB,
            timeOfCollision,
        };
    }

    static getCircleVsRectCollisionEvents = (circle: CircleBodyType, rect: RectBodyType) => {
        const createCircleVsRectCollisionEvent = (timeOfCollision: number, collisionPoint: Vector): CircleVsRectCollisionEvent => {
            return {
                movingBody: circle,
                collisionBody: rect,
                timeOfCollision,
                collisionPoint,
            };
        }

        const getSideCollisionEvents = () => {
            return getCircleVsRectPossibleSideCollisions(circle, rect).reduce<CircleVsRectCollisionEvent[]>((validCollisionEvents, possibleCollision) => {
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
                    
                    const collisionEvent = createCircleVsRectCollisionEvent(timeOfCollision, collisionPoint);
                    validCollisionEvents.push(collisionEvent);
                }

                return validCollisionEvents;
            }, []);
        };

        const getCornerCollisionEvents = () => {
            return getCornerCollisionEventsReducer(
                rect,
                (corner) => getTimeOfCircleVsRectCornerCollision(circle, corner),
                createCircleVsRectCollisionEvent,
            );
        };

        return getHeterogeneousCollisionEvents(getSideCollisionEvents, getCornerCollisionEvents);
    }

    static getRectVsCircleCollisionEvents = (rect: RectBodyType, circle: CircleBodyType) => {
        const createRectVsCircleCollisionEvent = (timeOfCollision: number, collisionPoint: Vector): RectVsCircleCollisionEvent => {
            return {
                movingBody: rect,
                collisionBody: circle,
                timeOfCollision,
                collisionPoint,
            };
        };
        
        const getSideCollisionEvents = () => {
            return getRectVsCirclePossibleSideCollisions(rect, circle).reduce<RectVsCircleCollisionEvent[]>((validCollisionEvents, possibleCollision) => {
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
    
                    const collisionEvent = createRectVsCircleCollisionEvent(timeOfCollision, collisionPoint);
                    validCollisionEvents.push(collisionEvent);
                }

                return validCollisionEvents;
            }, []);
        };

        const getCornerCollisionEvents = () => {
            return getCornerCollisionEventsReducer(
                rect,
                (corner) => getTimeOfRectCornerVsCircleCollision(corner, circle, rect.velocity),
                createRectVsCircleCollisionEvent,
            );
        };

        return getHeterogeneousCollisionEvents(getSideCollisionEvents, getCornerCollisionEvents);
    }

    static getRectVsRectCollisionEvents = (rectA: RectBodyType, rectB: RectBodyType) => {
        return COLLISION_SIDES.reduce<RectVsRectCollisionEvent[]>((validCollisionEvents, movingBodyContactSide) => {
            // determine if the moving rect will pass the collision rect boundary at all in the future            
            const movingBoundary = rectA[movingBodyContactSide];

            const collisionBodyContactSide = OPPOSITE_SIDE_MAP[movingBodyContactSide];
            const collisionBoundary = rectB[collisionBodyContactSide];
            
            const { x: dx, y: dy } = rectA.velocity;

            const isXAlignedCollision = movingBodyContactSide.includes('x');

            const rateOfChangeInAxis = isXAlignedCollision ? dx : dy;
            const timeOfCollision = getTimeOfAxisAlignedCollision(movingBoundary, collisionBoundary, rateOfChangeInAxis);
            
            if (!isValidTimeOfCollision(timeOfCollision)) return validCollisionEvents;

            // determine if there is overlap between the two rects in the opposite axis at the time the collision boundary is met
            const rateOfChangeInOtherAxis = isXAlignedCollision ? dy : dx;
            const changeInOtherAxis = rateOfChangeInOtherAxis * timeOfCollision;
            
            const a0 = isXAlignedCollision ? rectA.y0 : rectA.x0;
            const a1 = isXAlignedCollision ? rectA.y1 : rectA.x1;
            
            const a0AtTimeOfCollision = a0 + changeInOtherAxis;
            const a1AtTimeOfCollision = a1 + changeInOtherAxis;

            const b0 = isXAlignedCollision ? rectB.y0 : rectB.x0;
            const b1 = isXAlignedCollision ? rectB.y1 : rectB.x1;

            if (Maths.hasOverlap(a0AtTimeOfCollision, a1AtTimeOfCollision, b0, b1)) {
                const exactOverlap = Maths.getExactOverlap(a0AtTimeOfCollision, a1AtTimeOfCollision, b0, b1);

                // when there's exact overlap, a rect may be grazing a corner
                if (exactOverlap !== null) {
                    const pointOfCollision = isXAlignedCollision 
                        ? Vectors.create(collisionBoundary, exactOverlap)
                        : Vectors.create(exactOverlap, collisionBoundary);
                    
                    // we only want to consider a collision if the rect is moving towards the other rect
                    const directionOfCollisionRelativeToRectCenter = Vectors.subtract(pointOfCollision, rectA.center);
                    if (!Vectors.inSameQuadrant(directionOfCollisionRelativeToRectCenter, rectA.velocity)) {
                        return validCollisionEvents;
                    }
                }

                const contact = { [collisionBodyContactSide]: collisionBoundary };
                
                const collisionEvent = {
                    movingBody: rectA,
                    collisionBody: rectB,
                    timeOfCollision,
                    contact,
                };
                
                validCollisionEvents.push(collisionEvent);
            }

            return validCollisionEvents;
        }, []);
    }
}