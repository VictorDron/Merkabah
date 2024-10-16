const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');

// Função para redimensionar o canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    initialize();
});

// Configurações Globais
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationX = 0;
let rotationY = 0;
let scaleFactor = 1;
const ROTATION_SPEED = 0.002;

// Classe para representar um ponto 3D
class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const y = this.y * cos - this.z * sin;
        const z = this.y * sin + this.z * cos;
        return new Point3D(this.x, y, z);
    }

    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.z * sin + this.x * cos;
        const z = this.z * cos - this.x * sin;
        return new Point3D(x, this.y, z);
    }

    project() {
        const focalLength = 1000;
        const scale = focalLength / (focalLength + this.z);
        const x2D = canvas.width / 2 + this.x * scale * scaleFactor;
        const y2D = canvas.height / 2 + this.y * scale * scaleFactor;
        return { x: x2D, y: y2D, scale };
    }
}

// Função para desenhar Metatron's Cube
function drawMetatronsCube(rotX, rotY) {
    // Definição dos vértices do cubo
    const size = 150;
    const vertices = [
        new Point3D(-size, -size, -size),
        new Point3D(size, -size, -size),
        new Point3D(size, size, -size),
        new Point3D(-size, size, -size),
        new Point3D(-size, -size, size),
        new Point3D(size, -size, size),
        new Point3D(size, size, size),
        new Point3D(-size, size, size),
    ];

    // Rotaciona os vértices
    const rotatedVertices = vertices.map(v => v.rotateX(rotX).rotateY(rotY));

    // Define as arestas do cubo
    const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
    ];

    // Projeta os vértices para 2D
    const projected = rotatedVertices.map(v => v.project());

    // Desenha as arestas
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Ciano para as arestas
    ctx.lineWidth = 1;
    edges.forEach(edge => {
        const p1 = projected[edge[0]];
        const p2 = projected[edge[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    // Desenha círculos nos vértices
    rotatedVertices.forEach((v, index) => {
        const proj = v.project();
        // Calcula a cor com base na profundidade
        const hue = ((v.z / size) + 1) * 180; // Varia de 0 a 360
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Linhas diagonais internas para formar Metatron's Cube
    const diagonals = [
        [0,2],[0,6],[0,5],
        [1,3],[1,4],[1,7],
        [2,4],[2,5],[2,7],
        [3,4],[3,5],[3,6],
        [4,6],[5,7]
    ];

    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta para diagonais
    ctx.lineWidth = 0.8;
    diagonals.forEach(diag => {
        const p1 = rotatedVertices[diag[0]].project();
        const p2 = rotatedVertices[diag[1]].project();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });
}

// Função para desenhar o Toruóide
let torusPoints = [];
const NUM_TORUS_POINTS = 1000;

function generateTorus() {
    torusPoints = [];
    const R = 200; // Raio do círculo central do torus
    const r = 60;  // Raio do tubo do torus

    for (let i = 0; i < NUM_TORUS_POINTS; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;

        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);

        torusPoints.push(new Point3D(x, y, z));
    }
}

function drawTorus(rotX, rotY) {
    torusPoints.forEach(point => {
        let rotated = point.rotateX(rotX).rotateY(rotY);
        let proj = rotated.project();

        // Mapeia a profundidade para a cor
        const normalizedZ = (rotated.z + 100) / 200; // Ajuste para mapeamento
        const hue = normalizedZ * 270; // De vermelho a violeta
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 3 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função para gerar estrelas de fundo
let stars = [];
const NUM_STARS = 300;

function generateStars() {
    stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
}

function drawStarsBackground() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função de Inicialização
function initialize() {
    generateStars();
    generateTorus();
}

// Função de Animação
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStarsBackground();

    // Atualiza as rotações
    rotationX += ROTATION_SPEED;
    rotationY += ROTATION_SPEED;

    // Desenha os elementos
    drawMetatronsCube(rotationX * 0.5, rotationY * 0.5);
    drawTorus(rotationX, rotationY);

    requestAnimationFrame(animate);
}

initialize();
animate();

// Interatividade com Mouse ou Touch
canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', function(e) {
    if (isDragging) {
        let deltaX = e.clientX - previousMousePosition.x;
        let deltaY = e.clientY - previousMousePosition.y;

        rotationY += deltaX * 0.005;
        rotationX += deltaY * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

canvas.addEventListener('mouseup', function(e) {
    isDragging = false;
});

canvas.addEventListener('mouseleave', function(e) {
    isDragging = false;
});

// Suporte para dispositivos móveis
canvas.addEventListener('touchstart', function(e) {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

canvas.addEventListener('touchmove', function(e) {
    if (isDragging) {
        let deltaX = e.touches[0].clientX - previousMousePosition.x;
        let deltaY = e.touches[0].clientY - previousMousePosition.y;

        rotationY += deltaX * 0.005;
        rotationX += deltaY * 0.005;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
});

canvas.addEventListener('touchend', function(e) {
    isDragging = false;
});

// Zoom com a roda do mouse
canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    scaleFactor += e.deltaY * -0.001;
    scaleFactor = Math.min(Math.max(0.5, scaleFactor), 2);
});
