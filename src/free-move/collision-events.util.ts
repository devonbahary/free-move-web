import { Maths } from './Maths';
import {
    CircleBodyType,
    CircleVsCircleCollisionPair,
    CircleVsRectCollisionEvent,
    RectBodyType,
    RectSides,
    RectVsCircleCollisionEvent,
    Vector,
} from './types';
import { Vectors } from './Vectors';

export const COLLISION_SIDES: (keyof RectSides)[] = ['x0', 'x1', 'y0', 'y1'];

export const OPPOSITE_SIDE_MAP: { [key: string]: keyof RectSides } = {
    x0: 'x1',
    x1: 'x0',
    y0: 'y1',
    y1: 'y0',
};

enum Axis {
    x = 'x',
    y = 'y',
}

type CircleVsRectPossibleCollision = {
    movingCircleBoundary: number;
    collisionRectBoundary: number;
    axisOfCollision: Axis;
};

// consider circle collisions into rect against any of circle's 4 axis-aligned "sides"
export const getCircleVsRectPossibleSideCollisions = (
    circle: CircleBodyType,
    rect: RectBodyType,
): CircleVsRectPossibleCollision[] => {
    const { radius } = circle;

    return [
        // circle right side into rect left side
        {
            movingCircleBoundary: circle.center.x + radius,
            collisionRectBoundary: rect.x0,
            axisOfCollision: Axis.x,
        },
        // circle left side into rect right side
        {
            movingCircleBoundary: circle.center.x - radius,
            collisionRectBoundary: rect.x1,
            axisOfCollision: Axis.x,
        },
        // circle bottom side into rect top side
        {
            movingCircleBoundary: circle.center.y + radius,
            collisionRectBoundary: rect.y0,
            axisOfCollision: Axis.y,
        },
        // circle top side into rect bottom side
        {
            movingCircleBoundary: circle.center.y - radius,
            collisionRectBoundary: rect.y1,
            axisOfCollision: Axis.y,
        },
    ];
};

type RectVsCirclePossibleCollision = {
    movingRectBoundary: number;
    collisionCircleBoundary: number;
    axisOfCollision: Axis;
};

// consider rect collisions into circle against any of circle's 4 axis-aligned "sides"
export const getRectVsCirclePossibleSideCollisions = (
    rect: RectBodyType,
    circle: CircleBodyType,
): RectVsCirclePossibleCollision[] => {
    const { radius } = circle;

    return [
        // rect right side into circle left side
        {
            movingRectBoundary: rect.x1,
            collisionCircleBoundary: circle.center.x - radius,
            axisOfCollision: Axis.x,
        },
        // rect left side into circle right side
        {
            movingRectBoundary: rect.x0,
            collisionCircleBoundary: circle.center.x + radius,
            axisOfCollision: Axis.x,
        },
        // rect bottom side into circle top side
        {
            movingRectBoundary: rect.y1,
            collisionCircleBoundary: circle.center.y - radius,
            axisOfCollision: Axis.y,
        },
        // rect top side into circle bottom side
        {
            movingRectBoundary: rect.y0,
            collisionCircleBoundary: circle.center.y + radius,
            axisOfCollision: Axis.y,
        },
    ];
};

const getRectCorners = (rect: RectBodyType): Vector[] => [
    { x: rect.x0, y: rect.y0 }, // top left
    { x: rect.x1, y: rect.y0 }, // top right
    { x: rect.x1, y: rect.y1 }, // bottom right
    { x: rect.x0, y: rect.y1 }, // bottom left
];

export const getCornerCollisionEventsReducer = (
    rect: RectBodyType,
    getTimeOfCollision: (corner: Vector) => number | null,
    createCollisionEvent: (
        timeOfCollision: number,
        corner: Vector,
    ) => CircleVsRectCollisionEvent | RectVsCircleCollisionEvent,
) => {
    return getRectCorners(rect).reduce<(CircleVsRectCollisionEvent | RectVsCircleCollisionEvent)[]>(
        (validCollisionEvents, corner) => {
            const timeOfCollision = getTimeOfCollision(corner);

            if (timeOfCollision === null) return validCollisionEvents;

            const collisionEvent = createCollisionEvent(timeOfCollision, corner);
            validCollisionEvents.push(collisionEvent);
            return validCollisionEvents;
        },
        [],
    );
};

// times of collision can be outside the range of 0 < t < 1 because our broad approximations can result in collisions in past time
// frames and collisions too far into the future; for any given update, we only care about 0 <= t <= 1
export const isValidTimeOfCollision = (timeOfCollision: number | null): timeOfCollision is number => {
    return Boolean(
        timeOfCollision !== null && timeOfCollision <= 1 && Maths.roundFloatingPoint(timeOfCollision) >= 0, // treat floating point errors like collisions so that they are not ignored (e.g., -7.082604849269798e-7)
    );
};

// returns ~0 < t < 1 or null, where t is the distance along movement where collision happens
export const getValidTimeOfCollision = (a: number, b: number, c: number) => {
    const roots = Maths.quadratic(a, b, c);

    return roots.reduce((timeOfCollision, root) => {
        if (!isValidTimeOfCollision(root)) return timeOfCollision;

        return timeOfCollision === null || root < timeOfCollision ? root : timeOfCollision;
    }, null);
};

export const getTimeOfCircleVsCircleCollision = (collisionPair: CircleVsCircleCollisionPair) => {
    const { movingBody, collisionBody } = collisionPair;
    const { center: centerA, radius: radiusA, velocity } = movingBody;
    const { x: Ax, y: Ay } = centerA;
    const { x: dx, y: dy } = velocity;

    const { center: centerB, radius: radiusB } = collisionBody;
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

    return getValidTimeOfCollision(a, b, c);
};

export const getTimeOfAxisAlignedCollision = (
    movingBoundary: number,
    approachingBoundary: number,
    changeInAxis: number,
) => {
    if (changeInAxis === 0) return null;

    return (approachingBoundary - movingBoundary) / changeInAxis;
};

export const getTimeOfCircleVsRectCornerCollision = (circle: CircleBodyType, corner: Vector) => {
    const diffPos = Vectors.subtract(circle.center, corner);
    return getTimeOfCircleVsPointCollision(diffPos, circle.radius, circle.velocity);
};

export const getTimeOfRectCornerVsCircleCollision = (corner: Vector, circle: CircleBodyType, rectVelocity: Vector) => {
    const diffPos = Vectors.subtract(corner, circle.center);
    return getTimeOfCircleVsPointCollision(diffPos, circle.radius, rectVelocity);
};

export const getTimeOfCircleVsPointCollision = (diffPos: Vector, radius: number, velocity: Vector) => {
    const { x: dx, y: dy } = velocity;

    // don't consider collision into a corner if it won't ever come within a radius of the circle
    if (!dx && Math.abs(diffPos.x) >= radius) return null;
    if (!dy && Math.abs(diffPos.y) >= radius) return null;

    const a = dx ** 2 + dy ** 2;
    const b = 2 * diffPos.x * dx + 2 * diffPos.y * dy;
    const c = diffPos.x ** 2 + diffPos.y ** 2 - radius ** 2;

    return getValidTimeOfCollision(a, b, c);
};

// circle vs rect / rect vs circle collisions
export const getHeterogeneousCollisionEvents = (
    getSideCollisionEvents: () => (CircleVsRectCollisionEvent | RectVsCircleCollisionEvent)[],
    getCornerCollisionEvents: () => (CircleVsRectCollisionEvent | RectVsCircleCollisionEvent)[],
) => {
    const sideCollisionEvents = getSideCollisionEvents();
    // if a collision occurs with a circle side, then we don't need to check for corners
    return sideCollisionEvents.length ? sideCollisionEvents : getCornerCollisionEvents();
};
