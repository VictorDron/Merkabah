// script.js (versão corrigida)
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// Configurações atualizadas
const DPR = window.devicePixelRatio || 1;
const MAX_ROTATION = Math.PI * 2;
const FOCAL_LENGTH = 1500;

// Estado otimizado
let state = {
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    time: 0,
    hue: 180,
    mouse: { x: 0, y: 0, down: false },
    autoRotate: true
};

// Classe de Projeção Atualizada
class Projector {
    static project(point) {
        const depth = FOCAL_LENGTH / (FOCAL_LENGTH + point.z);
        return {
            x: canvas.width/2 + (point.x * depth * state.scale),
            y: canvas.height/2 + (point.y * depth * state.scale),
            depth
        };
    }
}

// Sistema de Geometria Principal Fixado
class SacredGeometry {
    constructor() {
        this.geometry = SacredMath.fibonacciSphere(128, 400);
        this.connections = this.calculateConnections();
    }

    calculateConnections() {
        const connections = [];
        this.geometry.forEach((a, i) => {
            this.geometry.slice(i+1).forEach((b, j) => {
                const distance = Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
                if (distance < 180) connections.push([a, b]);
            });
        });
        return connections;
    }

    draw() {
        // Desenha conexões
        ctx.strokeStyle = `hsla(${state.hue}, 70%, 60%, 0.3)`;
        ctx.lineWidth = 1;
        this.connections.forEach(([a, b]) => {
            const aRot = a.rotate(state.rotation);
            const bRot = b.rotate(state.rotation);
            const aProj = Projector.project(aRot);
            const bProj = Projector.project(bRot);
            
            ctx.beginPath();
            ctx.moveTo(aProj.x, aProj.y);
            ctx.lineTo(bProj.x, bProj.y);
            ctx.stroke();
        });

        // Desenha vértices
        this.geometry.forEach(point => {
            const rotated = point.rotate(state.rotation);
            const proj = Projector.project(rotated);
            const hue = (state.hue + rotated.z * 0.2) % 360;
            
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 4 * proj.depth, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
            ctx.fill();
        });
    }
}

// Classe Merkaba Atualizada
class Merkaba {
    constructor() {
        this.size = 160;
        this.vertices = [
            new Point3D(0, this.size, 0),
            new Point3D(this.size, -this.size, 0),
            new Point3D(-this.size, -this.size, 0),
            new Point3D(0, 0, this.size * Math.sqrt(2))
        ];
    }

    draw() {
        const time = state.time * 0.002;
        
        [1, -1].forEach(dir => {
            const rotated = this.vertices.map(v => v
                .rotateX(time * dir + state.rotation.x)
                .rotateY(time * 0.7 * dir + state.rotation.y)
                .rotateZ(time * 0.3 * dir)
            );

            const projected = rotated.map(v => Projector.project(v));
            
            // Desenha faces
            ctx.fillStyle = `hsla(${state.hue}, 60%, 50%, 0.1)`;
            ctx.strokeStyle = `hsla(${state.hue}, 80%, 60%, 0.7)`;
            ctx.lineWidth = 2;
            
            [[0,1,2], [0,1,3], [0,2,3], [1,2,3]].forEach(face => {
                ctx.beginPath();
                face.forEach((vi, i) => {
                    const p = projected[vi];
                    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        });
    }
}

// Função de Animação Corrigida
function animate() {
    ctx.fillStyle = `hsl(265, 50%, 8%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Atualiza rotação automática se não houver interação
    if (state.autoRotate && !state.mouse.down) {
        state.rotation.y += 0.002;
        state.rotation.x += 0.001;
    }

    // Mantém as rotações dentro de limites controlados
    state.rotation.x = state.rotation.x % MAX_ROTATION;
    state.rotation.y = state.rotation.y % MAX_ROTATION;

    // Desenha elementos
    particleSystem.update();
    particleSystem.draw();
    
    sacredGeometry.draw();
    merkaba.draw();

    // Atualizações de estado
    state.time += 16;
    state.hue = (state.hue + 0.08) % 360;
    
    requestAnimationFrame(animate);
}

// Event Listeners Corrigidos
function init() {
    resizeCanvas();
    generateCosmicBackground();
    
    canvas.addEventListener('mousemove', e => {
        if (!state.mouse.down) return;
        state.autoRotate = false;
        state.rotation.y += e.movementX * 0.004;
        state.rotation.x += e.movementY * 0.004;
    });

    canvas.addEventListener('mousedown', () => {
        state.mouse.down = true;
        state.autoRotate = false;
    });

    canvas.addEventListener('mouseup', () => {
        state.mouse.down = false;
        state.autoRotate = true;
    });

    // ... (outros event listeners permanecem iguais)
}

// Inicializações
const sacredGeometry = new SacredGeometry();
const merkaba = new Merkaba();
const particleSystem = new ParticleSystem();

init();
animate();
