// script.js
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Configurações globais
const DPR = window.devicePixelRatio || 1;
const FOCAL_LENGTH = 1200;
const ROTATION_SPEED = 0.002;
const CUBE_SIZE = 180;

// Estado global
let state = {
    rotation: { x: 0, y: 0 },
    scale: 1,
    mouse: { x: 0, y: 0, down: false },
    autoRotate: true,
    vertices: [],
    edges: []
};

// Funções de inicialização
function initGeometry() {
    const s = CUBE_SIZE;
    state.vertices = [
        new Point3D(-s, -s, -s), new Point3D(s, -s, -s),
        new Point3D(s, s, -s), new Point3D(-s, s, -s),
        new Point3D(-s, -s, s), new Point3D(s, -s, s),
        new Point3D(s, s, s), new Point3D(-s, s, s)
    ];
    
    state.edges = [
        [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7],[0,2],[0,5],[0,6],[1,3],
        [1,4],[1,7],[2,4],[2,5],[2,7],[3,5],[3,6],[4,6]
    ];
}

function Point3D(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    
    this.rotateX = function(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point3D(
            this.x,
            this.y * cos - this.z * sin,
            this.y * sin + this.z * cos
        );
    };
    
    this.rotateY = function(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point3D(
            this.x * cos + this.z * sin,
            this.y,
            -this.x * sin + this.z * cos
        );
    };
    
    this.project = function() {
        const depth = FOCAL_LENGTH / (FOCAL_LENGTH + this.z);
        return {
            x: width/2 + (this.x * depth * state.scale),
            y: height/2 + (this.y * depth * state.scale),
            depth
        };
    };
}

// Funções de renderização
function drawCube() {
    const rotated = state.vertices.map(v => 
        v.rotateX(state.rotation.x).rotateY(state.rotation.y)
    );

    // Desenha arestas
    ctx.strokeStyle = `hsl(${Date.now()/30 % 360}, 80%, 60%)`;
    ctx.lineWidth = 2 * DPR;
    state.edges.forEach(edge => {
        const p1 = rotated[edge[0]].project();
        const p2 = rotated[edge[1]].project();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    // Desenha vértices
    ctx.fillStyle = `hsl(${Date.now()/20 % 360}, 100%, 50%)`;
    rotated.forEach(v => {
        const p = v.project();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * p.depth * DPR, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Controles de interação
function handleMouseDown(e) {
    state.mouse.down = true;
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    state.autoRotate = false;
}

function handleMouseMove(e) {
    if (!state.mouse.down) return;
    
    const dx = e.clientX - state.mouse.x;
    const dy = e.clientY - state.mouse.y;
    
    state.rotation.y += dx * 0.005;
    state.rotation.x += dy * 0.005;
    
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
}

function handleMouseUp() {
    state.mouse.down = false;
    state.autoRotate = true;
}

function handleWheel(e) {
    e.preventDefault();
    state.scale += e.deltaY * -0.001;
    state.scale = Math.min(2, Math.max(0.5, state.scale));
}

// Função principal de animação
function animate() {
    ctx.fillStyle = `rgba(10, 10, 30, 0.2)`;
    ctx.fillRect(0, 0, width, height);
    
    if (state.autoRotate) {
        state.rotation.x += ROTATION_SPEED;
        state.rotation.y += ROTATION_SPEED * 0.8;
    }
    
    drawCube();
    requestAnimationFrame(animate);
}

// Configuração inicial
function init() {
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    ctx.scale(DPR, DPR);
    
    initGeometry();
    
    // Event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => handleMouseDown(e.touches[0]));
    canvas.addEventListener('touchmove', (e) => handleMouseMove(e.touches[0]));
    canvas.addEventListener('touchend', handleMouseUp);
}

// Iniciar aplicação
init();
animate();
