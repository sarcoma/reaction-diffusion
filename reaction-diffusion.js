const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const size = 100;
canvas.style.width = size + 'px';
canvas.style.height = size + 'px';
const scale = window.devicePixelRatio;
canvas.width = size * scale;
canvas.height = size * scale;
context.scale(scale, scale);

const gridWidth = size;
const gridHeight = size;

function initGridCell(x, y) {
    if(x === 0 || x === size - 1 || y === 0 || y === size - 1) return {a: 1, b: 1};
    // return {a: 1, b: Math.random() > 0.5 ? 1 : 0};
    if((x >= 45 && x <= 55) && (y >= 45 && y <= 55)) return {a: 1, b: 1};
    return {a: 1, b: 0};
}

let grid = [...Array(gridWidth)].map(
    (_, x) => [...Array(gridHeight)].map((_, y) => initGridCell(x, y)));

const diffusionRateA = 1;
const diffusionRateB = 0.5;
const feedRate = 0.0545;
const killRate = 0.062;
const deltaTime = 1;

const laplacianMatrix = [
    [0.05, 0.2, 0.05],
    [0.2, -1, 0.2],
    [0.05, 0.2, 0.05],
];

function round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

function diffusion(key, area, laplacianMatrix) {
    const laplacianSum = laplacianMatrix.flat(1).reduce((a, b) => round(a + b, 2), 0);
    let sum = 0;
    for(let x = 0; x < area.length; x++) {
        for(let y = 0; y < area[x].length; y++) {
            sum = round(sum + round(area[x][y][key] * laplacianMatrix[x][y], 5), 3);
        }
    }

    return laplacianSum > 0 ? sum / laplacianSum : sum;
}

// function applyDiffusion(key, value, x, y, edges, grid, laplacianMatrix) {
//     grid[edges.top][edges.left][key] = value * laplacianMatrix[0][0];
//     grid[x][edges.left][key] = value * laplacianMatrix[1][0];
//     grid[edges.bottom][edges.left][key] = value * laplacianMatrix[2][0];
//     grid[edges.top][y][key] = value * laplacianMatrix[0][1];
//     grid[edges.bottom][y][key] = value * laplacianMatrix[2][1];
//     grid[edges.top][edges.right][key] = value * laplacianMatrix[0][2];
//     grid[x][edges.right][key] = value * laplacianMatrix[1][2];
//     grid[edges.bottom][edges.right][key] = value * laplacianMatrix[2][2];
//     // grid[x][y][key] = grid[x][y][key] * laplacianMatrix[1][1];
// }

function updateA(a, b, aDiffusion) {
    return a + ((diffusionRateA * aDiffusion) - (a * b * b) + (feedRate * (1 - a))) * deltaTime;
}

function updateB(a, b, bDiffusion) {
    return b + (((diffusionRateB * bDiffusion) + (a * b * b)) - ((killRate + feedRate) * b)) * deltaTime;
}

function copyGrid(grid) {
    const length = grid.length;
    const newGrid = Array(length);
    for(let i = 0; i < length; i++) {
        newGrid[i] = grid[i].slice(0);
    }
    return newGrid;
}

function makePattern(grid, width, height) {
    const pattern = [...Array(width)].map((_, x) => [...Array(height)].map((_, y) => ' '));
    for(let x = 0; x < grid.length; x++) {
        for(let y = 0; y < grid[x].length; y++) {
            pattern[x][y] = grid[x][y].a <= grid[x][y].b ? 'X' : ' ';
        }
    }
    return pattern;
}

function drawPattern(pattern) {
    let str = '';
    for(const row of pattern) {
        for(const cell of row) {
            str += cell;
        }
        str += '\n';
    }
    return str;
}

function update(grid) {
    const newGrid = copyGrid(grid);
    for(let x = 0; x < grid.length; x++) {
        for(let y = 0; y < grid[x].length; y++) {
            const edges = {
                top: x > 0 ? x - 1 : grid.length - 1,
                bottom: x < grid.length - 1 ? x + 1 : 0,
                left: y > 0 ? y - 1 : grid[x].length - 1,
                right: y < grid[x].length - 1 ? y + 1 : 0,
            }
            const area = [
                [grid[edges.top][edges.left], grid[edges.top][y], grid[edges.top][edges.right]],
                [grid[x][edges.left], grid[x][y], grid[x][edges.right]],
                [grid[edges.bottom][edges.left], grid[edges.bottom][y], grid[edges.bottom][edges.right]],
            ];
            const aDiffusion = diffusion('a', area, laplacianMatrix);
            const bDiffusion = diffusion('b', area, laplacianMatrix);
            const a = updateA(grid[x][y].a, grid[x][y].b, aDiffusion);
            const b = updateB(grid[x][y].a, grid[x][y].b, bDiffusion);
            // if(isNaN(a)) throw new Error('A is NaN');
            // if(isNaN(b)) throw new Error('B is NaN');
            newGrid[x][y].a = a;
            newGrid[x][y].b = b;
            // applyDiffusion('a', grid[x][y].a, x, y, edges, newGrid, laplacianMatrix);
            // applyDiffusion('b', grid[x][y].b, x, y, edges, newGrid, laplacianMatrix);
        }
    }

    return newGrid;
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = 1; x < grid.length - 1; x++) {
        for(let y = 1; y < grid[x].length - 1; y++) {
            // if(grid[x][y].a > 1 || grid[x][y].a < 0) throw new Error('A is out of range');
            // if(grid[x][y].b > 1 || grid[x][y].b < 0) throw new Error('B is out of range');
            context.fillStyle = grid[x][y].a > grid[x][y].b ? 'white' : 'black';
            context.fillRect(x, y, 1, 1);
        }
    }
    grid = update(grid);
}

setInterval(draw, 2000);

