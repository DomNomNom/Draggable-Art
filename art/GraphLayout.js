import {range, clamp} from './util.js';


// Construct a graph
function makeGraph() {
    const graph = {};
    let nextNodeId = 0;
    const newStack = () =>  {
        return graph[nextNodeId++] = { type: 'stack' };
    }
    const newGroup = (stackSize) => {
        return graph[nextNodeId++] = {type: 'group', children: Array.from(range(stackSize), newStack)};
    }
    newGroup(3);
    newGroup(4);
    return graph;
}
const graph = makeGraph(); // id -> node
const nodes = () => Object.values(graph);


const nodeRadius = 20;

// Layout parameters
export const initialData = {
    rootX: 0,
    rootY: 0,
    shiftX_GroupGroup: 2*nodeRadius,
    shiftX_StackGroup: 2*nodeRadius,
    shiftY_StackGroup: 4*nodeRadius,
    shiftY_StackStack: 3*nodeRadius,
};


for (const nodeId in graph) {
    const node = graph[nodeId];
    node.id = nodeId;
    node.parents = [];  // Generated below.
    node.children = node.children || [];
}
for (const parent of nodes()) {
    for (const child of parent.children) {
        child.parents.push(parent);
    }
}

function getAffects(node) {
    switch (node.type) {
        case 'stack': return node.stackIndex? ['shiftX_StackGroup', 'shiftY_StackStack'] : ['shiftX_StackGroup', 'shiftY_StackGroup'];
        case 'group': return node.groupIndex? ['shiftX_GroupGroup'] : ['rootX', 'rootY'];
    }
    return null;  // potentially all variables.
}

function graphLayout(data) {
    for (const [groupIndex, group] of nodes().filter(node => node.type == 'group').entries()) {
        group.position = {
            x: data.rootX + groupIndex*data.shiftX_GroupGroup,
            y: data.rootY
        };
        group.groupIndex = groupIndex;
        for (const [i, stack] of group.children.entries()) {
            stack.stackIndex = i;
            stack.position = {
                x: group.position.x + data.shiftX_StackGroup,
                y: group.position.y + data.shiftY_StackGroup + i*data.shiftY_StackStack,
            }
        }
    }
}

function renderGraph(ctx) {
    for (const node of nodes()) {
        for (const child of node.children) {
            ctx.line(
                node.position.x,
                node.position.y,
                child.position.x,
                child.position.y,
                { 'stroke': 'steelblue'}
            )
        }
    }
    for (const node of nodes()) {
        ctx.point(node.position.x, node.position.y, {r: nodeRadius, affects: getAffects(node)});
    }
}

export function render(data, ctx) {
    graphLayout(data);
    renderGraph(ctx);
}
