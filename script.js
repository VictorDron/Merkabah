// script.js (versão aprimorada)
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');

// Configurações de desempenho
const DPR = window.devicePixelRatio || 1;
const HIGH_QUALITY = DPR === 1; // Desativar efeitos pesados em telas HiDPI

// Função de redimensionamento otimizada
function resizeCanvas() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    ctx.scale(DPR, DPR);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Sistema de Partículas Místicas
class Particle {
    constructor(x, y, z) {
        this.pos = new Point3D(x, y, z);
        this.vel = new Point3D(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        this.hue = Math.random() * 360;
        this.life = 1;
    }

    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.pos.z += this.vel.z;
        this.life -= 0.001;
        this.hue = (this.hue + 0.2) % 360;
    }

    draw(rotX, rotY) {
        const rotated = this.pos.rotateX(rotX).rotateY(rotY);
        const proj = rotated.project();
        ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.life * 0.7})`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 3 * proj.scale * this.life, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Efeitos Especiais
const createGlowEffect = (color1, color2) => {
    ctx.shadowColor = color1;
    ctx.shadowBlur = HIGH_QUALITY ? 30 : 15;
    ctx.filter = `blur(${HIGH_QUALITY ? 2 : 1}px)`;
    setTimeout(() => {
        ctx.shadowColor = color2;
        ctx.shadowBlur = HIGH_QUALITY ? 15 : 7;
    }, 50);
};

// Geometria Sagrada Ampliada
const sacredGeometry = {
    // ... (mantenha o Metatron e Torus existentes)

    flowerOfLife(rotX, rotY) {
        const layers = 3;
        const radius = 80;
        ctx.strokeStyle = 'rgba(255, 223, 0, 0.3)';
        ctx.lineWidth = 1.5;

        for (let layer = 1; layer <= layers; layer++) {
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = Math.cos(angle) * radius * layer;
                const y = Math.sin(angle) * radius * layer;
                const z = Math.sin(performance.now() * 0.001 + layer) * 50;

                const point = new Point3D(x, y, z)
                    .rotateX(rotX)
                    .rotateY(rotY);
                const proj = point.project();

                ctx.beginPath();
                ctx.arc(proj.x, proj.y, radius * layer * proj.scale, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
};

// Sistema de Partículas
const particles = Array.from({ length: 500 }, () => {
    const angle = Math.random() * Math.PI * 2;
    return new Particle(
        Math.cos(angle) * 300,
        Math.sin(angle) * 300,
        (Math.random() - 0.5) * 300
    );
});

// Efeito de Nebulosa
function drawNebula() {
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, 'hsla(270, 80%, 20%, 0.1)');
    gradient.addColorStop(1, 'hsla(200, 80%, 10%, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Loop de Animação Atualizado
function animate() {
    ctx.fillStyle = HIGH_QUALITY ? 'rgba(0, 0, 10, 0.1)' : 'rgba(0, 0, 20, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawNebula();
    drawStarsBackground();

    rotationX += ROTATION_SPEED * (isDragging ? 0.3 : 1);
    rotationY += ROTATION_SPEED * (isDragging ? 0.3 : 1);

    // Efeito de profundidade
    ctx.save();
    if (HIGH_QUALITY) {
        createGlowEffect('#0ff', '#f0f');
    }

    particles.forEach(p => {
        p.update();
        p.draw(rotationX * 0.2, rotationY * 0.2);
        if (p.life <= 0) Object.assign(p, new Particle());
    });

    sacredGeometry.flowerOfLife(rotationX * 0.8, rotationY * 0.8);
    drawMetatronsCube(rotationX * 0.5, rotationY * 0.5);
    drawTorus(rotationX, rotationY);

    ctx.restore();
    requestAnimationFrame(animate);
}

// Adicione estas linhas no final do initialize():
function initialize() {
    generateStars();
    generateTorus();
    // Novo: Iniciar trilha sonora ambiente
    new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play();
}
