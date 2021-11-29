import { BodyType, CircleBodyType, RectBodyType, Vector } from "../types";
import { isCircleBody, isRectBody } from "../Bodies";
import { Vectors } from "../Vectors";

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
    public static moveBodiesAdjacentToEachOther = (bodyA: BodyType, bodyB: BodyType, dir: Direction) => {
        if (isCircleBody(bodyA) && isCircleBody(bodyB)) {
            return TestUtils.moveCirclesAdjacentToEachOther(bodyA, bodyB, dir);
        } else if (isRectBody(bodyA) && isRectBody(bodyB)) {
            return TestUtils.moveRectsAdjacentToEachOther(bodyA, bodyB, dir);
        }
    }

    public static moveBodiesApartFromEachOther = (bodyA: BodyType, bodyB: BodyType, dir: Direction) => {
        if (isCircleBody(bodyA) && isCircleBody(bodyB)) {
            return TestUtils.moveCirclesApartFromEachOther(bodyA, bodyB, dir);
        } else if (isRectBody(bodyA) && isRectBody(bodyB)) {
            return TestUtils.moveRectsApartFromEachOther(bodyA, bodyB, dir);
        }
    } 

    public static moveBodiesIntoEachOther = (bodyA: BodyType, bodyB: BodyType, dir: Direction) => {
        if (isCircleBody(bodyA) && isCircleBody(bodyB)) {
            return TestUtils.moveCirclesIntoEachOther(bodyA, bodyB, dir);
        } else if (isRectBody(bodyA) && isRectBody(bodyB)) {
            return TestUtils.moveRectsIntoEachOther(bodyA, bodyB, dir);
        }
    }

    private static moveCirclesAdjacentToEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
        const distance = circleA.radius + circleB.radius;
        TestUtils.moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
    };

    private static moveCirclesApartFromEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
        const distance = (circleA.radius + circleB.radius) * 2;  // space between
        TestUtils.moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
    };

    private static moveCirclesIntoEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
        const distance = circleA.radius / 2;
        TestUtils.moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
    };

    private static moveRectsAdjacentToEachOther = (rectA: RectBodyType, rectB: RectBodyType, dir: Direction) => {
        TestUtils.moveRectBRelativeToRectA(rectA, rectB, dir, 1);
    };

    private static moveRectsApartFromEachOther = (rectA: RectBodyType, rectB: RectBodyType, dir: Direction) => {
        TestUtils.moveRectBRelativeToRectA(rectA, rectB, dir, 2);
    };

    private static moveRectsIntoEachOther = (rectA: RectBodyType, rectB: RectBodyType, dir: Direction) => {
        TestUtils.moveRectBRelativeToRectA(rectA, rectB, dir, 0.5);
    };

    private static moveRectBRelativeToRectA = (rectA: RectBodyType, rectB: RectBodyType, dir: Direction, relativeMag: number) => {
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

    public static moveBodyTowardsBody = (bodyA: BodyType, bodyB: BodyType) => {
        const diffPos = Vectors.subtract(bodyB.center, bodyA.center);
        // set velocity such that the movement path travels all the way through bodyB to ensure we observe all collision opportunities
        const bodiesLength = (TestUtils.getBodyLength(bodyA) + TestUtils.getBodyLength(bodyB)) * 2;
        const vel = Vectors.rescale(diffPos, bodiesLength);
        bodyA.setVelocity(vel);
    };

    public static moveBodyAwayFromBody = (bodyA: BodyType, bodyB: BodyType) => {
        const diffPos = Vectors.subtract(bodyA.center, bodyB.center);
        bodyA.setVelocity(diffPos);
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

    private static moveCircleBRelativeToCircleA = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction, distance: number) => {
        const dirVector = TestUtils.getDirectionalVector(dir, distance);
        
        const targetCircleBCenter = Vectors.add(circleA.center, dirVector);
        const targetCircleBPos = TestUtils.getCircleXYPosFromCenter(circleB, targetCircleBCenter);

        circleB.moveTo(targetCircleBPos);
    };

}
