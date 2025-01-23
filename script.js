// script.js (versão aprimorada)
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// Configurações de desempenho
const DPR = window.devicePixelRatio || 1;
const NUM_TORUS_POINTS = 2000;
const NUM_STARS = 500;

// Estado global
let state = {
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    time: 0,
    hue: 0,
    mouse: { x: 0, y: 0, down: false },
    luminosity: 0.5
};

// Classe de utilitários
class SacredMath {
    static fibonacciSphere(numPoints, radius) {
        const points = [];
        const offset = 2 / numPoints;
        const increment = Math.PI * (3 - Math.sqrt(5));
        
        for (let i = 0; i < numPoints; i++) {
            const y = ((i * offset) - 1) + (offset / 2);
            const r = Math.sqrt(1 - y*y);
            const phi = ((i + 1) % numPoints) * increment;
            const x = Math.cos(phi) * r;
            const z = Math.sin(phi) * r;
            points.push(new Point3D(x * radius, y * radius, z * radius));
        }
        return points;
    }
}

class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    rotate(angles) {
        let point = this.rotateX(angles.x);
        point = point.rotateY(angles.y);
        return point.rotateZ(angles.z);
    }

    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point3D(
            this.x,
            this.y * cos - this.z * sin,
            this.y * sin + this.z * cos
        );
    }

    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point3D(
            this.z * sin + this.x * cos,
            this.y,
            this.z * cos - this.x * sin
        );
    }

    rotateZ(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point3D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos,
            this.z
        );
    }

    project() {
        const focal = 1200;
        const depth = focal / (focal + this.z);
        return {
            x: canvas.width/2 + this.x * depth * state.scale,
            y: canvas.height/2 + this.y * depth * state.scale,
            depth
        };
    }
}

// Sistema de Partículas
class ParticleSystem {
    constructor() {
        this.particles = Array.from({length: 500}, () => ({
            position: new Point3D(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                Math.random() * 2000 - 1000
            ),
            speed: Math.random() * 0.02 + 0.01,
            radius: Math.random() * 2 + 1
        }));
    }

    update() {
        this.particles.forEach(p => {
            p.position.z -= p.speed;
            if (p.position.z < -1000) p.position.z = 1000;
        });
    }

    draw() {
        this.particles.forEach(p => {
            const pos = p.position.rotate(state.rotation).project();
            const alpha = Math.min(1, (1000 - Math.abs(p.position.z)) / 500);
            
            ctx.fillStyle = `hsla(${state.hue}, 70%, 80%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.radius * pos.depth, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Inicialização
function init() {
    resizeCanvas();
    generateCosmicBackground();
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        generateCosmicBackground();
    });

    canvas.addEventListener('mousemove', e => {
        if (!state.mouse.down) return;
        state.rotation.y += (e.movementX || 0) * 0.005;
        state.rotation.x += (e.movementY || 0) * 0.005;
    });

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        state.scale = Math.min(2, Math.max(0.3, state.scale - e.deltaY * 0.001));
    });

    canvas.addEventListener('mousedown', () => state.mouse.down = true);
    canvas.addEventListener('mouseup', () => state.mouse.down = false);
    canvas.addEventListener('mouseleave', () => state.mouse.down = false);

    // Toque para dispositivos móveis
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        state.rotation.y += touch.clientX * 0.0005;
        state.rotation.x += touch.clientY * 0.0005;
    }, { passive: false });
}

// Elementos Visuais
const particleSystem = new ParticleSystem();
const sacredGeometry = SacredMath.fibonacciSphere(64, 300);

function drawSacredGeometry() {
    sacredGeometry.forEach((point, i) => {
        const rotated = point.rotate({
            x: state.rotation.x * 0.3,
            y: state.rotation.y * 0.3,
            z: Math.sin(state.time * 0.001)
        });
        
        const proj = rotated.project();
        const hue = (state.hue + i * 2) % 360;
        const lightness = 50 + Math.sin(state.time * 0.005 + i) * 15;
        
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 3 * proj.depth, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;
        ctx.fill();
        
        // Conexões sagradas
        sacredGeometry.slice(i).forEach(other => {
            const d = Math.hypot(
                point.x - other.x,
                point.y - other.y,
                point.z - other.z
            );
            
            if (d < 150) {
                ctx.beginPath();
                ctx.moveTo(proj.x, proj.y);
                const oProj = other.rotate(state.rotation).project();
                ctx.lineTo(oProj.x, oProj.y);
                ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${0.3 - d/500})`;
                ctx.lineWidth = 2 * proj.depth;
                ctx.stroke();
            }
        });
    });
}

function drawMerkaba() {
    const time = state.time * 0.002;
    const size = 120 + Math.sin(time) * 30;
    
    const vertices = [
        new Point3D(0, size, 0),
        new Point3D(size, -size, 0),
        new Point3D(-size, -size, 0),
        new Point3D(0, 0, size * Math.sqrt(2))
    ];

    // Duas pirâmides rotacionadas
    [1, -1].forEach(dir => {
        const rotated = vertices.map(v => v
            .rotateX(time * dir)
            .rotateY(time * 0.7 * dir)
            .rotateZ(time * 0.3 * dir)
            .project()
        );

        ctx.strokeStyle = `hsla(${state.hue}, 80%, 60%, 0.7)`;
        ctx.fillStyle = `hsla(${state.hue + 30}, 60%, 50%, 0.2)`;
        ctx.lineWidth = 2;
        
        // Faces
        [[0,1,2], [0,1,3], [0,2,3], [1,2,3]].forEach(face => {
            ctx.beginPath();
            face.forEach((vi, i) => {
                const p = rotated[vi];
                i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    });
}

// Animação Principal
function animate() {
    ctx.fillStyle = `hsl(265, 50%, 5%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.shadowColor = `hsl(${state.hue}, 100%, 50%)`;
    ctx.shadowBlur = 30;
    
    particleSystem.update();
    particleSystem.draw();
    
    drawSacredGeometry();
    drawMerkaba();
    
    // Atualizações de estado
    state.time += 16;
    state.hue = (state.hue + 0.1) % 360;
    state.rotation.y += 0.0005;
    
    requestAnimationFrame(animate);
}

// Funções auxiliares
function resizeCanvas() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    ctx.scale(DPR, DPR);
}

function generateCosmicBackground() {
    // Gradiente cósmico
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, `hsl(265, 40%, 8%)`);
    gradient.addColorStop(1, `hsl(220, 60%, 2%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Iniciar
init();
animate();
