import { BodyType, CircleBodyType, CircleVsCircleCollisionPair, CircleVsRectCollisionPair, CollisionPair, RectBodyType, Vector } from "../types";
import { isCircleBody, isRectBody } from "../Bodies";
import { Vectors } from "../Vectors";
import { Collisions } from "../Collisions";

export enum CollisionType {
    circleVsCircle = 'circle vs circle',
    circleVsRect = 'circle vs rect',
    rectVsRect = 'rect vs rect',
}

// TODO: can we make Direction a union of Direction | DiagonalDirection?
export enum Direction {
    UP = 'UP',
    RIGHT = 'RIGHT',
    DOWN = 'DOWN',
    LEFT = 'LEFT',
    UP_RIGHT = 'UP_RIGHT',
    DOWN_RIGHT = 'DOWN_RIGHT',
    DOWN_LEFT = 'DOWN_LEFT',
    UP_LEFT = 'UP_LEFT',
}

type DirectionToUnitVectorMap = { 
    [ key in Direction]: Vector; 
}

type BodyVsRectCollisionPair = {
    movingBody: BodyType;
    collisionBody: RectBodyType;
}

const diagonalScalar = Math.sqrt(2) / 2;

const DIRECTION_TO_UNIT_VECTOR_MAP: DirectionToUnitVectorMap = {
    UP: Vectors.create(0, -1),
    RIGHT: Vectors.create(1, 0),
    DOWN: Vectors.create(0, 1),
    LEFT: Vectors.create(-1, 0),
    UP_RIGHT: Vectors.create(diagonalScalar, -diagonalScalar),
    DOWN_RIGHT: Vectors.create(diagonalScalar, diagonalScalar),
    DOWN_LEFT: Vectors.create(-diagonalScalar, diagonalScalar),
    UP_LEFT: Vectors.create(-diagonalScalar, -diagonalScalar),
};

const isDiagonal = (dir: Direction) => {
    switch (dir) {
        case Direction.DOWN:
        case Direction.LEFT:
        case Direction.RIGHT:
        case Direction.UP:
            return false;
        default:
            return true;
    }
}

export class TestUtils {
    public static moveBodiesAdjacentToEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const { movingBody: circleA, collisionBody: circleB } = collisionPair;
            const distance = circleA.radius + circleB.radius;
            TestUtils.moveCircleBRelativeToCircleA(collisionPair, dir, distance);
        } else if (Collisions.isCircleVsRect(collisionPair)) {
            TestUtils.moveRectRelativeToCircle(collisionPair, dir, 1);
        } else if (Collisions.isRectVsRect(collisionPair)) {
            return TestUtils.moveCollisionBodyRectRelativeToMovingBody(collisionPair, dir, 1);
        } else {
            throw new Error();
        }
    }

    public static moveBodiesApartFromEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const { movingBody: circleA, collisionBody: circleB } = collisionPair;
            const distance = (circleA.radius + circleB.radius) * 2;  // space between
            TestUtils.moveCircleBRelativeToCircleA(collisionPair, dir, distance);
        } else if (Collisions.isCircleVsRect(collisionPair)) {
            TestUtils.moveRectRelativeToCircle(collisionPair, dir, 2);
        } else if (Collisions.isRectVsRect(collisionPair)) {
            TestUtils.moveCollisionBodyRectRelativeToMovingBody(collisionPair, dir, 2);
        } else {
            throw new Error();
        }
    } 

    public static moveBodiesIntoEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const { movingBody: circleA } = collisionPair;
            const distance = circleA.radius / 2;
            TestUtils.moveCircleBRelativeToCircleA(collisionPair, dir, distance);
        } else if (Collisions.isCircleVsRect(collisionPair)) {
            TestUtils.moveRectRelativeToCircle(collisionPair, dir, 0.5);
        } else if (Collisions.isRectVsRect(collisionPair)) {
            TestUtils.moveCollisionBodyRectRelativeToMovingBody(collisionPair, dir, 0.5);
        } else {
            throw new Error();
        }
    }

    public static getTangentialMovementVectors = (
        collisionPair: CollisionPair, 
        dir: Direction, 
        getDiffPos: () => Vector,
    ): Vector[] => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const diffPos = getDiffPos();
            return Vectors.normalVectors(diffPos);
        } else if (Collisions.isCircleVsRect(collisionPair) || Collisions.isRectVsRect(collisionPair)) {
            switch (dir) {
                case Direction.DOWN:
                case Direction.UP:
                    return [
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.LEFT],
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.RIGHT],
                    ];
                case Direction.LEFT:
                case Direction.RIGHT:
                    return [
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.UP],
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.DOWN],
                    ];
                case Direction.DOWN_LEFT:
                case Direction.UP_RIGHT:
                    return [
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.UP_LEFT],
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.DOWN_RIGHT],
                    ];
                case Direction.DOWN_RIGHT:
                case Direction.UP_LEFT:
                    return [
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.UP_RIGHT],
                        DIRECTION_TO_UNIT_VECTOR_MAP[Direction.DOWN_LEFT],
                    ];
            }
        }
        
        throw new Error();
    };

    private static moveCircleBRelativeToCircleA = (
        collisionPair: CircleVsCircleCollisionPair, 
        dir: Direction, 
        distance: number,
    ) => {
        const { movingBody, collisionBody } = collisionPair;

        const dirVector = TestUtils.getDirectionalVector(dir, distance);
        
        const targetCircleBCenter = Vectors.add(movingBody.center, dirVector);
        const targetCircleBPos = TestUtils.getCircleXYPosFromCenter(collisionBody, targetCircleBCenter);

        collisionBody.moveTo(targetCircleBPos);
    };

    private static moveRectRelativeToCircle = (
        collisionPair: CircleVsRectCollisionPair,
        dir: Direction,
        magnitude: number,
    ) => {
        const { movingBody: circle, collisionBody: rect } = collisionPair;

        if (isDiagonal(dir)) {
            const vectorToCircleEdge = Vectors.rescale(DIRECTION_TO_UNIT_VECTOR_MAP[dir], circle.radius);

            let rectClosestCorner = Vectors.create();
            switch (dir) {
                case Direction.DOWN_LEFT:
                    rectClosestCorner = Vectors.create(rect.x1, rect.y0);
                    break;
                case Direction.DOWN_RIGHT:
                    rectClosestCorner = Vectors.create(rect.x0, rect.y0);
                    break;
                case Direction.UP_LEFT:
                    rectClosestCorner = Vectors.create(rect.x1, rect.y1);
                    break;
                case Direction.UP_RIGHT:
                    rectClosestCorner = Vectors.create(rect.x0, rect.y1);
                    break;
            }

            const vectorToRectCenterFromClosestCorner = Vectors.subtract(rect.center, rectClosestCorner);
            const vectorFromCircleCenterToRectTargetCenter = Vectors.add(vectorToCircleEdge, vectorToRectCenterFromClosestCorner);
            const adjacentMagnitude = Vectors.magnitude(vectorFromCircleCenterToRectTargetCenter);
            const targetVectorFromCircleCenterToRectTargetCenter = Vectors.rescale(
                vectorFromCircleCenterToRectTargetCenter, 
                adjacentMagnitude * magnitude,
            );

            const targetRectCenter = Vectors.add(circle.center, targetVectorFromCircleCenterToRectTargetCenter);
            const targetRectPos = TestUtils.getRectXYPosFromCenter(rect, targetRectCenter);
            
            rect.moveTo(targetRectPos);
        } else {
            TestUtils.moveCollisionBodyRectRelativeToMovingBody(collisionPair, dir, magnitude);
        }
    }

    private static moveCollisionBodyRectRelativeToMovingBody = (
        collisionPair: BodyVsRectCollisionPair, 
        dir: Direction, 
        relativeMag: number,
    ) => {
        const { movingBody, collisionBody: collisionBodyRect } = collisionPair;

        const targetCollisionBodRectCenter = movingBody.center;

        const movingBodyHalfWidth = TestUtils.getBodyHalfWidth(movingBody);
        const movingBodyHalfHeight = TestUtils.getBodyHalfHeight(movingBody);

        const xOverlap = (movingBodyHalfWidth + collisionBodyRect.width / 2) * relativeMag;
        const yOverlap = (movingBodyHalfHeight + collisionBodyRect.height / 2) * relativeMag;

        switch (dir) {
            case Direction.DOWN_RIGHT:
            case Direction.RIGHT:
            case Direction.UP_RIGHT:
                targetCollisionBodRectCenter.x += xOverlap;
                break;
            case Direction.DOWN_LEFT:
            case Direction.LEFT:
            case Direction.UP_LEFT:
                targetCollisionBodRectCenter.x -= xOverlap;
                break;
        }

        switch (dir) {
            case Direction.UP:
            case Direction.UP_RIGHT:
            case Direction.UP_LEFT:
                targetCollisionBodRectCenter.y -= yOverlap;
                break;
            case Direction.DOWN:
            case Direction.DOWN_LEFT:
            case Direction.DOWN_RIGHT:
                targetCollisionBodRectCenter.y += yOverlap;
                break;
        }

        const targetCollisionBodyRectPos = TestUtils.getRectXYPosFromCenter(collisionBodyRect, targetCollisionBodRectCenter);

        collisionBodyRect.moveTo(targetCollisionBodyRectPos);
    }

    public static moveBodyTowardsBody = (collisionPair: CollisionPair) => {
        const { movingBody, collisionBody } = collisionPair;
        const diffPos = Vectors.subtract(collisionBody.center, movingBody.center);
        // set velocity such that the movement path travels all the way through collisionBody to ensure we observe all collision opportunities
        const bodiesLength = (TestUtils.getBodyLength(movingBody) + TestUtils.getBodyLength(collisionBody)) * 2;
        const vel = Vectors.rescale(diffPos, bodiesLength);
        movingBody.setVelocity(vel);
    };

    public static moveBodyAwayFromBody = (collisionPair: CollisionPair) => {
        const { movingBody, collisionBody } = collisionPair;
        const diffPos = Vectors.subtract(movingBody.center, collisionBody.center);
        movingBody.setVelocity(diffPos);
    };

    // get diameter / longest rect side
    private static getBodyLength = (body: BodyType) => {
        if (isCircleBody(body)) return body.radius * 2;
        if (isRectBody(body)) return Math.max(body.width, body.height) * 2;
        throw new Error();
    }

    private static getBodyHalfWidth = (body: BodyType): number => {
        if (isCircleBody(body)) return body.radius;
        if (isRectBody(body)) return body.width / 2;
        throw new Error();
    }

    private static getBodyHalfHeight = (body: BodyType): number => {
        if (isCircleBody(body)) return body.radius;
        if (isRectBody(body)) return body.height / 2;
        throw new Error();
    }

    private static getCircleXYPosFromCenter = (circle: CircleBodyType, center: Vector): Vector => {
        return Vectors.subtract(center, Vectors.create(circle.radius, circle.radius));
    }

    private static getRectXYPosFromCenter = (rect: RectBodyType, center: Vector): Vector => {
        return Vectors.subtract(center, Vectors.create(rect.width / 2, rect.height / 2));
    }

    private static getDirectionalVector = (dir: Direction, mag: number): Vector => {
        const unitVector = DIRECTION_TO_UNIT_VECTOR_MAP[dir];
        return Vectors.rescale(unitVector, mag);
    };

}
