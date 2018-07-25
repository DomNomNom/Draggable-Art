import {range, clamp, pow} from './util.js';

export const initialData = {
    x: 200,
    y: 100,
    vx: -50,
    vy: 10,
};

const gravity = 10;  // positive = down
const simulationPeriod = 20;
const timeStep = 0.9;
const ballR = 20;  // Ball radius
const bounceFactor = .8;  // scaling down of velocity on bounce

let simulationBoxWd = 100;
let simulationBoxHt = 100;

function simulate(data, dt) {
    // min/max coordinates for the ball's center.
    const minX = ballR;
    const minY = ballR;
    const maxX = simulationBoxWd - ballR;
    const maxY = simulationBoxHt - ballR;

    let x = data.x + data.vx * dt;
    let y = data.y + data.vy * dt;
    let vx = data.vx;
    let vy = data.vy;

    if (x >= maxX) { vx *= -bounceFactor;  x = 2*maxX - x; }
    if (y >= maxY) { vy *= -bounceFactor;  y = 2*maxY - y; }
    if (x <= 0)    { vx *= -bounceFactor;  x = -x; }
    if (y <= 0)    { vy *= -bounceFactor;  y = -y; }
    vy += gravity * dt;

    return {
        x,
        y,
        vx,
        vy,
    };
}

function strokeWidth(i) {
    return 1+20*pow(2, -i*.03);
}
export function render(data, ctx) {
    const point = (x,y, options={}) => {
        if (undefined === options.r) options.r = 20;
        ctx.point(x,y, options);
    };

    point (data.x, data.y, {fill: 'red', affects: ['x', 'y']});
    const states = [data];
    for (const i of range(simulationPeriod / timeStep)) {
        data = simulate(data, timeStep);
        states.push(data);
        point (data.x, data.y, {fill: 'green', r: 1*strokeWidth(i), affects: ['vx', 'vy']});
    }
    for (let i=0; i<states.length-1; ++i) {
        const now = states[i];
        const next = states[i+1];
        ctx.line(
            now.x, now.y,
            next.x, next.y, {
                'stroke-width': strokeWidth(i),
                'stroke': 'rgba(10, 222, 10, .5)',
                'stroke-linecap': 'round',
                affects: ['vx', 'vy'],
            }
        );
    }
}

function renderAnimation(time, canvas) {

}
function handleResize(canvas) {
    const boundingRect = canvas.node.getBoundingClientRect();
    simulationBoxWd = boundingRect.width;
    simulationBoxHt = boundingRect.height;
    canvas.resize(true);
}
{
    let canvas;  // HACK: global scoping fuckery.
    function animationLoop(time) {
        if (!window.canvas) return;
        if (!canvas) {
            // first render
            canvas = window.canvas;
            canvas.align('left', 'top')
            new ResizeObserver(() => { handleResize(canvas); }).observe(canvas.node);
            handleResize(canvas);
        }
        requestAnimationFrame(animationLoop)
    }
    requestAnimationFrame(animationLoop)
}
