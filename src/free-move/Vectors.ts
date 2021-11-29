import { Vector } from "./types";

const round = (val: number) => Math.round(val * 1000) / 1000;

// TODO: rework to be an instantiable class new Vector(x, y) with static methods
export class Vectors {
    static create = (x = 0, y = 0): Vector => ({ x, y });

    static add = (v1: Vector, v2: Vector): Vector => {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }

    static distance = (pointA: Vector, pointB: Vector) => {
        return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
    }

    /*
        a · b = |a| × |b| × cos(θ)
              = ax × bx + ay × by
    */
    static dot = (A: Vector, B: Vector) => {
        return (A.x * B.x) + (A.y * B.y);
    }

    static normalVectors = (vector: Vector): Vector[] => {
        const normalVector = Vectors.create(-vector.y, vector.x);
        return [
            normalVector,
            Vectors.neg(normalVector),
        ];
    }

    static magnitude = ({ x, y }: Vector) => Math.sqrt(x ** 2 + y ** 2);

    static mult = ({ x, y }: Vector, scalar: number): Vector => ({ x: x * scalar, y: y * scalar });

    static divide = (vector: Vector, scalar: number): Vector => {
        if (scalar === 0) {
            throw new Error(`can't divide a vector by 0`);
        }
        return Vectors.mult(vector, 1 / scalar);
    }

    static neg = ({ x, y }: Vector): Vector => ({ x: -x, y: -y });

    static unit = (vector: Vector): Vector => {
        const mag = Vectors.magnitude(vector);
        if (!mag) {
            return vector;
        }
        return Vectors.divide(vector, mag);
    };

    static rescale = (vector: Vector, mag: number): Vector => {
        return Vectors.mult(Vectors.unit(vector), mag);
    }

    static subtract = (v1: Vector, v2: Vector): Vector => ({ x: v1.x - v2.x, y: v1.y - v2.y });

    static format = (vector: Vector) => `(${round(vector.x)}, ${round(vector.y)})`;
}
