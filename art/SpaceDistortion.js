import {sin,cos,sqrt,PI,TAU} from './util.js';


export const initialData = {
    focalX: 0,
    focalY: 0,
    k: 74000,
}

export function render(data, ctx) {
    const point = (x,y, options={}) => {
        if (undefined === options.fill) options.fill = 'green';
        if (undefined === options.r) options.r = 10;
        ctx.point(x,y, options)
    };

    // Distortion funciton comes from https://www.desmos.com/calculator/djquixlx7y
    const d_func = (x,y) => {
        const dx = x - data.focalX;
        const dy = y - data.focalY;
        return sqrt(dx*dx + dy*dy);
    }
    const f_func = (x,y) => {
        const d = d_func(x,y);
        return data.k/(d*d + 1);
    }
    const transformX = (x,y) => { const f = f_func(x,y); return x - (x-data.focalX)*f; };
    const transformY = (x,y) => { const f = f_func(x,y); return y - (y-data.focalY)*f; };

    const transformedPoint = (x,y, options={}) => {
        options.affects = ['k'];
        options.r = 5;
        return point(
            transformX(x,y),
            transformY(x,y),
            options,
        );
    };

    const sides = 40;
    const numCocentrics = 3;
    for (let i=0; i<sides; i++){
        const anglePerSide = 2*PI / sides;
        const a = i*anglePerSide;
        for (let j=0; j<numCocentrics; ++j) {
            const r = (j+1) * 130;
            transformedPoint(r * cos(a), r * sin( a))
        }
    }
    point(data.focalX, data.focalY, {
        fill:'red',
        affects: ['focalX', 'focalY'],
    });
}

