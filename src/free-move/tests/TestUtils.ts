import { BodyType, CircleBodyType, CollisionPair, RectBodyType, Vector } from '../types';
import { CircleBody, isCircleBody, isRectBody, RectBody } from '../Bodies';
import { Vectors } from '../Vectors';
import { Collisions } from '../Collisions';

export enum CollisionType {
    circleVsCircle = 'circle vs circle',
    circleVsRect = 'circle vs rect',
    rectVsCircle = 'rect vs circle',
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
    [key in Direction]: Vector;
};

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
};

export class TestUtils {
    public static initCollisionPair = (
        collisionType: CollisionType,
        movingBodySize: number,
        collisionBodySize: number,
    ): CollisionPair => {
        switch (collisionType) {
            case CollisionType.circleVsCircle:
                return {
                    movingBody: new CircleBody(movingBodySize / 2),
                    collisionBody: new CircleBody(collisionBodySize / 2),
                };
            case CollisionType.circleVsRect:
                return {
                    movingBody: new CircleBody(movingBodySize / 2),
                    collisionBody: new RectBody(collisionBodySize, collisionBodySize),
                };
            case CollisionType.rectVsCircle:
                return {
                    movingBody: new RectBody(movingBodySize, movingBodySize),
                    collisionBody: new CircleBody(collisionBodySize / 2),
                };
            case CollisionType.rectVsRect:
                return {
                    movingBody: new RectBody(movingBodySize, movingBodySize),
                    collisionBody: new RectBody(collisionBodySize, collisionBodySize),
                };
        }
    };
    public static moveBodiesAdjacentToEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        TestUtils.moveCollisionBodyRelativeToMovingBody(collisionPair, dir, 1);
    };

    public static moveBodiesApartFromEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        TestUtils.moveCollisionBodyRelativeToMovingBody(collisionPair, dir, 4);
    };

    public static moveBodiesIntoEachOther = (collisionPair: CollisionPair, dir: Direction) => {
        TestUtils.moveCollisionBodyRelativeToMovingBody(collisionPair, dir, 0.5);
    };

    public static getTangentialMovementVectors = (
        collisionPair: CollisionPair,
        dir: Direction,
        getDiffPos: () => Vector,
    ): Vector[] => {
        if (Collisions.isCircleVsCircle(collisionPair)) {
            const diffPos = getDiffPos();
            return Vectors.normalVectors(diffPos);
        }

        switch (dir) {
            case Direction.DOWN:
            case Direction.UP:
                return [DIRECTION_TO_UNIT_VECTOR_MAP[Direction.LEFT], DIRECTION_TO_UNIT_VECTOR_MAP[Direction.RIGHT]];
            case Direction.LEFT:
            case Direction.RIGHT:
                return [DIRECTION_TO_UNIT_VECTOR_MAP[Direction.UP], DIRECTION_TO_UNIT_VECTOR_MAP[Direction.DOWN]];
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
    };

    private static moveCollisionBodyRelativeToMovingBody = (
        collisionPair: CollisionPair,
        dir: Direction,
        relativeMag: number,
    ) => {
        const { movingBody, collisionBody } = collisionPair;

        const centerToCenterAdjacentBodyVector = TestUtils.getCenterToCenterAdjacentBodyVector(collisionPair, dir);

        const vectorFromMovingBodyCenterToTargetCollisionBodyCenter = Vectors.rescale(
            centerToCenterAdjacentBodyVector,
            Vectors.magnitude(centerToCenterAdjacentBodyVector) * relativeMag,
        );

        const targetCollisionBodyCenter = Vectors.add(
            movingBody.center,
            vectorFromMovingBodyCenterToTargetCollisionBodyCenter,
        );

        if (isCircleBody(collisionBody)) {
            const targetCirclePos = Vectors.correctFloatingPoint(
                TestUtils.getCircleXYPosFromCenter(collisionBody, targetCollisionBodyCenter),
            );
            collisionBody.moveTo(targetCirclePos);
        } else if (isRectBody(collisionBody)) {
            const targetRectPos = Vectors.correctFloatingPoint(
                TestUtils.getRectXYPosFromCenter(collisionBody, targetCollisionBodyCenter),
            );
            collisionBody.moveTo(targetRectPos);
        } else {
            throw new Error();
        }
    };

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

    private static getCenterToCenterAdjacentBodyVector = (collisionPair: CollisionPair, dir: Direction): Vector => {
        const { movingBody, collisionBody } = collisionPair;

        const distanceX =
            TestUtils.getBodyDistanceXToEdgeFromCenter(movingBody, dir) +
            TestUtils.getBodyDistanceXToEdgeFromCenter(collisionBody, dir);
        const distanceY =
            TestUtils.getBodyDistanceYToEdgeFromCenter(movingBody, dir) +
            TestUtils.getBodyDistanceYToEdgeFromCenter(collisionBody, dir);

        const unitVector = DIRECTION_TO_UNIT_VECTOR_MAP[dir];

        return Vectors.create(Math.sign(unitVector.x) * distanceX, Math.sign(unitVector.y) * distanceY);
    };

    private static getBodyDistanceXToEdgeFromCenter = (body: BodyType, dir: Direction): number => {
        if (isCircleBody(body)) return TestUtils.getCircleBodyDistancetoEdge(body, dir);
        if (isRectBody(body)) return body.width / 2;
        throw new Error();
    };

    private static getBodyDistanceYToEdgeFromCenter = (body: BodyType, dir: Direction): number => {
        if (isCircleBody(body)) return TestUtils.getCircleBodyDistancetoEdge(body, dir);
        if (isRectBody(body)) return body.height / 2;
        throw new Error();
    };

    private static getCircleBodyDistancetoEdge = (body: CircleBodyType, dir: Direction): number => {
        return isDiagonal(dir) ? body.radius * diagonalScalar : body.radius;
    };

    // get diameter / longest rect side
    private static getBodyLength = (body: BodyType) => {
        if (isCircleBody(body)) return body.radius * 2;
        if (isRectBody(body)) return Math.max(body.width, body.height) * 2;
        throw new Error();
    };

    private static getCircleXYPosFromCenter = (circle: CircleBodyType, center: Vector): Vector => {
        return Vectors.subtract(center, Vectors.create(circle.radius, circle.radius));
    };

    private static getRectXYPosFromCenter = (rect: RectBodyType, center: Vector): Vector => {
        return Vectors.subtract(center, Vectors.create(rect.width / 2, rect.height / 2));
    };
}
