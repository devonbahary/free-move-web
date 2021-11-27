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

const unitVectorDiagonalScalar = Math.sqrt(2) / 2;

const DIRECTION_TO_UNIT_VECTOR_MAP: DirectionToUnitVectorMap = {
    UP: Vectors.create(0, -1),
    RIGHT: Vectors.create(1, 0),
    DOWN: Vectors.create(0, 1),
    LEFT: Vectors.create(-1, 0),
    UP_RIGHT: Vectors.create(unitVectorDiagonalScalar, -unitVectorDiagonalScalar),
    DOWN_RIGHT: Vectors.create(unitVectorDiagonalScalar, unitVectorDiagonalScalar),
    DOWN_LEFT: Vectors.create(-unitVectorDiagonalScalar, unitVectorDiagonalScalar),
    UP_LEFT: Vectors.create(-unitVectorDiagonalScalar, -unitVectorDiagonalScalar),
};

// get diameter / longest rect side
const getBodyLength = (body: BodyType) => {
    if (isCircleBody(body)) return body.radius * 2;
    if (isRectBody(body)) return Math.max(body.width, body.height) * 2;
    throw new Error(`cannot getBodyLength for unrecognized body ${JSON.stringify(body)}`);
}

const getCircleXYPosFromCenter = (circle: CircleBodyType, pos: Vector): Vector => {
    return Vectors.subtract(pos, Vectors.create(circle.radius, circle.radius));
}

const getDirectionalVector = (dir: Direction, mag: number): Vector => {
    const unitVector = DIRECTION_TO_UNIT_VECTOR_MAP[dir];
    return Vectors.rescale(unitVector, mag);
};

const moveCircleBRelativeToCircleA = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction, distance: number) => {
    const dirVector = getDirectionalVector(dir, distance);
    
    const circleBCenter = Vectors.add(circleA.center, dirVector);
    const circleBPos = getCircleXYPosFromCenter(circleB, circleBCenter);

    circleB.moveTo(circleBPos);
};

export const moveCirclesAdjacentToEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
    const distance = circleA.radius + circleB.radius; // adjacent
    moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
};

export const moveCirclesApartFromEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
    const distance = (circleA.radius + circleB.radius) * 2;  // space between
    moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
};

export const moveCirclesIntoEachOther = (circleA: CircleBodyType, circleB: CircleBodyType, dir: Direction) => {
    const distance = circleA.radius / 2;
    moveCircleBRelativeToCircleA(circleA, circleB, dir, distance);
};

export const moveBodyTowardsBody = (bodyA: BodyType, bodyB: BodyType) => {
    const diffPos = Vectors.subtract(bodyB.center, bodyA.center);
    // set velocity such that the movement path travels all the way through bodyB to ensure we observe all collision opportunities
    const bodiesLength = (getBodyLength(bodyA) + getBodyLength(bodyB)) * 2;
    const vel = Vectors.rescale(diffPos, bodiesLength);
    bodyA.setVelocity(vel);
}

export const moveBodyAwayFromBody = (bodyA: BodyType, bodyB: BodyType) => {
    const diffPos = Vectors.subtract(bodyA.center, bodyB.center);
    bodyA.setVelocity(diffPos);
}