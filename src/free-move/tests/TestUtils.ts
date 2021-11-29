import { BodyType, CircleBodyType, CircleVsCircleCollisionPair, CollisionPair, RectBodyType, RectVsRectCollisionPair, Vector } from "../types";
import { isCircleBody, isRectBody } from "../Bodies";
import { Vectors } from "../Vectors";
import { Collisions } from "../Collisions";

export enum CollisionType {
    circleVsCircle = 'circle vs circle',
    rectVsRect = 'rect vs rect',
}

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

export class TestUtils {
    public static moveBodiesAdjacentToEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            return TestUtils.moveCirclesAdjacentToEachOther(collisionPair, dir);
        } else if (Collisions.isRectVsRect(collisionPair)) {
            return TestUtils.moveRectsAdjacentToEachOther(collisionPair, dir);
        }
    }

    public static moveBodiesApartFromEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            return TestUtils.moveCirclesApartFromEachOther(collisionPair, dir);
        } else if (Collisions.isRectVsRect(collisionPair)) {
            return TestUtils.moveRectsApartFromEachOther(collisionPair, dir);
        }
    } 

    public static moveBodiesIntoEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            return TestUtils.moveCirclesIntoEachOther(collisionPair, dir);
        } else if (Collisions.isRectVsRect(collisionPair)) {
            return TestUtils.moveRectsIntoEachOther(collisionPair, dir);
        }
    }

    public static getTangentialMovementVectors = (collisionPair: CollisionPair, dir: Direction, getDiffPos: () => Vector): Vector[] => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const diffPos = getDiffPos();
            return Vectors.normalVectors(diffPos);
        } else if (Collisions.isRectVsRect(collisionPair)) {
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
        
        throw new Error(`can't get tangential movement vector for bodyA ${JSON.stringify(collisionPair.movingBody)}, bodyB ${JSON.stringify(collisionPair.collisionBody)}`);
    };

    private static moveCirclesAdjacentToEachOther = (collisionPair: CircleVsCircleCollisionPair, dir: Direction) => {
        const { movingBody: circleA, collisionBody: circleB } = collisionPair;
        const distance = circleA.radius + circleB.radius;
        TestUtils.moveCircleBRelativeToCircleA(collisionPair, dir, distance);
    };

    private static moveCirclesApartFromEachOther = (collisionPair: CircleVsCircleCollisionPair, dir: Direction) => {
        const { movingBody: circleA, collisionBody: circleB } = collisionPair;
        const distance = (circleA.radius + circleB.radius) * 2;  // space between
        TestUtils.moveCircleBRelativeToCircleA(collisionPair, dir, distance);
    };

    private static moveCirclesIntoEachOther = (collisionPair: CircleVsCircleCollisionPair, dir: Direction) => {
        const { movingBody: circleA } = collisionPair;
        const distance = circleA.radius / 2;
        TestUtils.moveCircleBRelativeToCircleA(collisionPair, dir, distance);
    };

    private static moveRectsAdjacentToEachOther = (collisionPair: RectVsRectCollisionPair, dir: Direction) => {
        TestUtils.moveRectBRelativeToRectA(collisionPair, dir, 1);
    };

    private static moveRectsApartFromEachOther = (collisionPair: RectVsRectCollisionPair, dir: Direction) => {
        TestUtils.moveRectBRelativeToRectA(collisionPair, dir, 2);
    };

    private static moveRectsIntoEachOther = (collisionPair: RectVsRectCollisionPair, dir: Direction) => {
        TestUtils.moveRectBRelativeToRectA(collisionPair, dir, 0.5);
    };

    private static moveRectBRelativeToRectA = (collisionPair: RectVsRectCollisionPair, dir: Direction, relativeMag: number) => {
        const { movingBody: rectA, collisionBody: rectB } = collisionPair;

        const targetRectBCenter = rectA.center;

        const xOverlap = (rectA.width / 2 + rectB.width / 2) * relativeMag;
        const yOverlap = (rectA.height / 2 + rectB.height / 2) * relativeMag;

        switch (dir) {
            case Direction.DOWN_RIGHT:
            case Direction.RIGHT:
            case Direction.UP_RIGHT:
                targetRectBCenter.x += xOverlap;
                break;
            case Direction.DOWN_LEFT:
            case Direction.LEFT:
            case Direction.UP_LEFT:
                targetRectBCenter.x -= xOverlap;
                break;
        }

        switch (dir) {
            case Direction.UP:
            case Direction.UP_RIGHT:
            case Direction.UP_LEFT:
                targetRectBCenter.y -= yOverlap;
                break;
            case Direction.DOWN:
            case Direction.DOWN_LEFT:
            case Direction.DOWN_RIGHT:
                targetRectBCenter.y += yOverlap;
                break;
        }

        const targetRectBPos = TestUtils.getRectXYPosFromCenter(rectB, targetRectBCenter);

        rectB.moveTo(targetRectBPos);
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
        throw new Error(`cannot getBodyLength for unrecognized body ${JSON.stringify(body)}`);
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

    private static moveCircleBRelativeToCircleA = (collisionPair: CircleVsCircleCollisionPair, dir: Direction, distance: number) => {
        const { movingBody, collisionBody } = collisionPair;

        const dirVector = TestUtils.getDirectionalVector(dir, distance);
        
        const targetCircleBCenter = Vectors.add(movingBody.center, dirVector);
        const targetCircleBPos = TestUtils.getCircleXYPosFromCenter(collisionBody, targetCircleBCenter);

        collisionBody.moveTo(targetCircleBPos);
    };

}
