export class Vectors {
    static create = (x, y) => ({ x, y });

    static getClosestVectorToRectFromCircle = (circle, rect) => {
        const closestXToRect = Math.max(rect.x0, Math.min(rect.x1, circle.center.x));
        const closestYToRect = Math.max(rect.y0, Math.min(rect.y1, circle.center.y));
        
        const closestPositionOnRect = { x: closestXToRect, y: closestYToRect };
        return Vectors.subtract(circle.center, closestPositionOnRect);
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

    static subtract = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });
}
