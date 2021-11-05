const round = (val) => Math.round(val * 1000) / 1000;

// TODO: rework to be an instantiable class new Vector(x, y) with static methods
export class Vectors {
    static create = (x, y) => ({ x, y });

    static add = (v1, v2) => {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }

    static distance = (pointA, pointB) => {
        return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
    }

    /*
        a · b = |a| × |b| × cos(θ)
              = ax × bx + ay × by
    */
    static dot = (A, B) => {
        return (A.x * B.x) + (A.y * B.y);
    }

    static magnitude = ({ x, y }) => Math.sqrt(x ** 2 + y ** 2);

    static mult = ({ x, y }, scalar) => ({ x: x * scalar, y: y * scalar });

    static divide = (vector, scalar) => {
        if (scalar === 0) {
            throw new Error(`can't divide a vector by 0`);
        }
        return Vectors.mult(vector, 1 / scalar);
    }

    static neg = ({ x, y }) => ({ x: -x, y: -y });

    static normalize = (vector) => {
        const mag = Vectors.magnitude(vector);
        if (!mag) {
            return vector;
        }
        return Vectors.divide(vector, mag);
    };

    static rescale = (vector, mag) => {
        return Vectors.mult(Vectors.normalize(vector), mag);
    }

    static subtract = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });

    static format = (vector) => `(${round(vector.x)}, ${round(vector.y)})`;
}
