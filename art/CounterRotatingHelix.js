import {sin,cos,PI,TAU} from './util.js';

export const initialData = {
    radius: 200,
    angle: 0
}

export function render(data, ctx){
    const point = (x,y, options={}) => {
        if (undefined === options.fill) options.fill = 'green';
        if (undefined === options.r) options.r = 10;

        ctx.point(x,y, options)
    };

    const sides = 10
    for (let i=0; i<sides; i++){
        const anglePerSide = 2*PI / sides
        const a = data.angle + i*anglePerSide
        const r1 = data.radius
        point(r1 * cos( a), r1 * sin( a))

        const r2 = r1 + 70*sin(data.angle * sides);
        const a2 = -a + 0.5 * anglePerSide
        point(r2 * cos(a2), r2 * sin(a2), {fill: 'red'})

    }
}
