import { BodyType, CircleBodyType, Vector } from "../types";
import { isCircleBody, isRectBody } from "../Bodies";
import { Vectors } from "../Vectors";

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
    public static moveCirclesAdjacentToEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
        const distance = circleA.radius + circleB.radius;
        TestUtils.moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
    };

    public static moveCirclesApartFromEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
        const distance = (circleA.radius + circleB.radius) * 2;  // space between
        TestUtils.moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
    };

    public static moveCirclesIntoEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
        const distance = circleA.radius / 2;
        TestUtils.moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
    };

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

    private static getCircleXYPosFromCenter = (circle: CircleBodyType, pos: Vector): Vector => {
        return Vectors.subtract(pos, Vectors.create(circle.radius, circle.radius));
    }

    private static getDirectionalVector = (dir: Direction, mag: number): Vector => {
        const unitVector = DIRECTION_TO_UNIT_VECTOR_MAP[dir];
        return Vectors.rescale(unitVector, mag);
    };

    private static moveCircleBRelativeToCircleA = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction, distance: number) => {
        const dirVector = TestUtils.getDirectionalVector(dir, distance);
        
        const circleBCenter = Vectors.add(circleA.center, dirVector);
        const circleBPos = TestUtils.getCircleXYPosFromCenter(circleB, circleBCenter);

        circleB.moveTo(circleBPos);
    };

}