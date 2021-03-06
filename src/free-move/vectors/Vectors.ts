export type Vector = {
    x: number;
    y: number;
};

const round = (val: number) => Math.round(val * 1000) / 1000;

export class Vectors {
    static create = (x = 0, y = 0): Vector => ({ x, y });

    static add = (v1: Vector, v2: Vector): Vector => {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    };

    static distance = (pointA: Vector, pointB: Vector) => {
        return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
    };

    /*
        a · b = |a| × |b| × cos(θ)
              = ax × bx + ay × by
    */
    static dot = (A: Vector, B: Vector) => {
        return A.x * B.x + A.y * B.y;
    };

    static normalVectors = (vector: Vector): Vector[] => {
        const normalVector = Vectors.create(-vector.y, vector.x);
        return [normalVector, Vectors.neg(normalVector)];
    };

    static magnitude = ({ x, y }: Vector) => Math.sqrt(x ** 2 + y ** 2);

    static mult = ({ x, y }: Vector, scalar: number): Vector => ({
        x: x * scalar,
        y: y * scalar,
    });

    static divide = (vector: Vector, scalar: number): Vector => {
        if (scalar === 0) {
            throw new Error(`can't divide a vector by 0`);
        }
        return Vectors.mult(vector, 1 / scalar);
    };

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
    };

    static subtract = (v1: Vector, v2: Vector): Vector => ({
        x: v1.x - v2.x,
        y: v1.y - v2.y,
    });

    static inSameQuadrant = (v1: Vector, v2: Vector): boolean => {
        const { x: x1, y: y1 } = v1;
        const { x: x2, y: y2 } = v2;

        const inSameXAxis = x1 === x2 || Math.sign(x1) === Math.sign(x2);
        const inSameYAxis = y1 === y2 || Math.sign(y1) === Math.sign(y2);
        return inSameXAxis && inSameYAxis;
    };

    static format = (vector: Vector) => `(${round(vector.x)}, ${round(vector.y)})`;

    static correctFloatingPoint = ({ x, y }: Vector) => {
        const correct = (num: number) => Math.round(num * 10000000000) / 10000000000;
        return Vectors.create(correct(x), correct(y));
    };
}
