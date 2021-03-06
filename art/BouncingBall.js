import {range, clamp, pow} from './util.js';

//
// The data that will be fed into simulate()
//
export const initialData = {
    x: 200,
    y: 100,
    vx: -500,
    vy: 1,
};

//
// Physics Simulation
//

const gravity = 3000;  // positive = down
const simulationPeriod = 3.5;
const timeStep = 0.13;  // dt
const ballR = 40;  // Ball radius
const bounceFactor = .8;  // scaling down of velocity on bounce

let simulationBoxWd = 1000;
let simulationBoxHt = 1000;

function reducePrecision(float, decimals) {
    return Number.parseFloat(float.toFixed(decimals));
}

function getIntersectionTimeX(data, wallX) {
    // Note: We downsample the the distance from the wall, otherwise we get bad floating point behavior and the ball goes through the wall.
    return reducePrecision(wallX-data.x, 10) / data.vx;
}
function getIntersectionTimesY(data, floorY) {
    // 0.5*gravity*dt*dt + data.vy * dt - dy = 0
    return quadraticSolutions(.5*gravity, data.vy, data.y - floorY);
}
// Solves a quadratic equation of the form `a*x*x + b*x + c = 0`
// Returns the most positive solution and in cases where there is no real solution, return null.
function quadraticSolutions(a, b, c) {
    const determinant = b*b - (4 * a * c);
    if (determinant < 0) return [];
    if (determinant == 0) return [(-1 * b) / (2 * a)];
    return [
        (-1 * b + Math.sqrt(determinant)) / (2 * a),
        (-1 * b - Math.sqrt(determinant)) / (2 * a),
    ];
}

function simulateWithoutCollisions(data, dt) {
    return {
        x: data.x + data.vx * dt,
        y: data.y + data.vy * dt + 0.5*gravity*dt*dt,
        vx: data.vx,
        vy: data.vy + gravity*dt,
    };
}

function handleWallCollision(data, intersectionTime) {
    const dataAtHit = simulateWithoutCollisions(data, intersectionTime);
    dataAtHit.vx *= -bounceFactor;
    return dataAtHit;
}
function handleFloorCeilingCollision(data, intersectionTime) {
    const dataAtHit = simulateWithoutCollisions(data, intersectionTime);
    if (intersectionTime < 0.001 && Math.abs(data.vy) < 1.1) {
        dataAtHit.vy = -10.1;  // HAAX: To stop if falling through the floor.
        return dataAtHit;
    }
    dataAtHit.y = clamp(dataAtHit.y, ballR, simulationBoxHt - ballR);
    dataAtHit.vy *= -bounceFactor;
    return dataAtHit;
}

// Returns a new data object representing the world after evolving for dt seconds.
function simulate(data, dt) {
    if (dt == 0) {
        return data;
    }

    // min/max coordinates for the ball's center.
    const minX = ballR;
    const minY = ballR;
    const maxX = simulationBoxWd - ballR;
    const maxY = simulationBoxHt - ballR;

    data.x = clamp(data.x, minX+1e-9, maxX-1e-9);
    data.y = clamp(data.y, minY+1e-9, maxY-1e-9);

    // Intersection with vertical walls.
    const intersects = [
        {t: getIntersectionTimeX(data, minX), handleCollision: handleWallCollision},
        {t: getIntersectionTimeX(data, maxX), handleCollision: handleWallCollision},
        ...getIntersectionTimesY(data, minY).map(t => {return {t, handleCollision: handleFloorCeilingCollision}; }),
        ...getIntersectionTimesY(data, maxY).map(t => {return {t, handleCollision: handleFloorCeilingCollision}; }),
    ].filter(({t}) => t!==null && 0<t && t<=dt).sort((a,b) => a.t-b.t);
    if (intersects.length) {
        const intersect = intersects[0];
        const dataAtHit = intersect.handleCollision(data, intersect.t);
        return simulate(dataAtHit, dt - intersect.t);
    }

    return simulateWithoutCollisions(data, dt);
}


function simulateUntilTime(data, animationTime) {
    for (const i of range(animationTime / timeStep)) {
        data = simulate(data, timeStep);
    }
    return simulate(data, animationTime % timeStep);
}
function generateStates(data) {
    const states = [data];
    for (const i of range(simulationPeriod / timeStep)) {
        data = simulate(data, timeStep);
        states.push(data);
    }
    return states;
}


//
// Rendering the path for g9 interactivity.
//

function strokeWidth(i) {
    return 1+25*pow(2, -i*.09);
}
function renderStates(states, ctx) {
    const velLineScale = .003;
    for (let i=0; i<states.length; ++i) {
        const data = states[i];   // Note: this is a different variable the
        const wd = strokeWidth(i);
        ctx.line(
            data.x,
            data.y,
            data.x + wd*velLineScale*data.vx,
            data.y + wd*velLineScale*data.vy,
            {
                'stroke-width': wd,
                'stroke': 'rgba(10, 222, 10, .3)',
                'stroke-linecap': 'round',
                affects: ['vx', 'vy'],
            }
        );
        ctx.point (
            data.x,
            data.y,
            {
                'r': i? wd : 1.1*wd,
                'fill': i? 'rgba(100, 220, 10, .3)' : 'rgba(222, 10, 10, .7)',
                affects: i? ['vx', 'vy'] : ['x', 'y'],
            }
        );
    }
}
export function render(data, ctx) {
    const states = generateStates(data);  // The physics simulation sampled at constant-time intervals
    renderStates(states, ctx);
}

//
// Bouncing ball animation and resize-handling
//

let animatedBall;
function renderAnimation(animationTime, canvas) {
    if (!animatedBall) {
        // animatedBall = document.createElement('circle')
        animatedBall = document.createElementNS("http://www.w3.org/2000/svg",'circle');
        canvas.node.insertBefore(animatedBall, canvas.node.firstElementChild);
    }
    const ballData = simulateUntilTime(canvas.getData(), animationTime % simulationPeriod);
    animatedBall.style['r'] = ballR;
    animatedBall.style['fill'] = 'steelblue';
    animatedBall.style['cx'] = ballData.x;
    animatedBall.style['cy'] = ballData.y;
    animatedBall.style['type'] = 'point';
    animatedBall.style['stack'] = '0';
}
function handleResize(canvas) {
    const boundingRect = canvas.node.getBoundingClientRect();
    simulationBoxWd = boundingRect.width;
    simulationBoxHt = boundingRect.height;
    canvas.resize(true);
}
{
    let canvas;  // HACK: global scoping fuckery.
    function animationLoop(time_ms) {
        if (!window.canvas) return;
        if (!canvas) {
            // first render
            canvas = window.canvas;
            canvas.align('left', 'top')
            new ResizeObserver(() => { handleResize(canvas); }).observe(canvas.node);
            handleResize(canvas);
        }
        renderAnimation(time_ms / 1000, canvas);
        requestAnimationFrame(animationLoop)
    }
    requestAnimationFrame(animationLoop)
}
