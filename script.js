const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const DPR = window.devicePixelRatio || 1;

const state = {
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  time: 0,
  hue: 220,
  mouse: { down: false, lastX: 0, lastY: 0 }
};

const CONFIG = {
  particleCount: 800,
  torusRadius: 300,
  rotationSpeed: 0.0008,
  hueSpeed: 0.2,
  dragFactor: 0.12,
  zoomSensitivity: 0.0005
};

class Point3D {
  constructor(x = 0, y = 0, z = 0) {
    this.set(x, y, z);
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  rotate(angles) {
    return this
      .rotateX(angles.x)
      .rotateY(angles.y)
      .rotateZ(angles.z);
  }

  rotateX(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const y = this.y * cos - this.z * sin;
    const z = this.y * sin + this.z * cos;
    return this.set(this.x, y, z);
  }

  rotateY(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.z * sin + this.x * cos;
    const z = this.z * cos - this.x * sin;
    return this.set(x, this.y, z);
  }

  rotateZ(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    return this.set(x, y, this.z);
  }

  project() {
    const focal = 1200;
    const depth = focal / (focal + this.z);
    return {
      x: canvas.width / (2 * DPR) + this.x * depth * state.scale,
      y: canvas.height / (2 * DPR) + this.y * depth * state.scale,
      depth
    };
  }

  distanceTo(other) {
    return Math.sqrt(
      (this.x - other.x) ** 2 +
      (this.y - other.y) ** 2 +
      (this.z - other.z) ** 2
    );
  }
}

class ParticleSystem {
  constructor() {
    this.particles = Array.from({ length: CONFIG.particleCount }, () => ({
      point: new Point3D(),
      speed: Math.random() * 0.02 + 0.01,
      radius: Math.random() * 2 + 1,
      reset() {
        this.point.set(
          (Math.random() - 0.5) * 2000,
          (Math.random() - 0.5) * 2000,
          Math.random() * 2000 - 1000
        );
      }
    }));
    this.particles.forEach(p => p.reset());
  }

  update() {
    this.particles.forEach(p => {
      p.point.z -= p.speed;
      if (p.point.z < -1000) p.reset();
    });
  }

  draw() {
    this.particles.forEach(p => {
      const rotated = new Point3D(p.point.x, p.point.y, p.point.z)
        .rotate(state.rotation);
      const pos = rotated.project();

      const alpha = Math.min(1, (1000 - Math.abs(p.point.z)) / 500);

      ctx.fillStyle = `hsla(${state.hue}, 70%, 80%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.radius * pos.depth, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

const sacredGeometry = {
  points: [],
  connections: new Set(),

  init() {
    this.points = Array.from({ length: 64 }, () => new Point3D());
    const radius = CONFIG.torusRadius;
    const increment = Math.PI * (3 - Math.sqrt(5));

    this.points.forEach((point, i) => {
      const y = (i * (2 / 64)) - 1 + (1 / 64);
      const r = Math.sqrt(1 - y * y);
      const phi = (i % 64) * increment;
      point.set(
        Math.cos(phi) * r * radius,
        y * radius,
        Math.sin(phi) * r * radius
      );
    });

    this.points.forEach((a, i) => {
      this.points.forEach((b, j) => {
        if (i !== j && a.distanceTo(b) < 150) {
          this.connections.add(`${Math.min(i, j)}-${Math.max(i, j)}`);
        }
      });
    });
  },

  draw() {
    const rotation = {
      x: state.rotation.x * 0.3,
      y: state.rotation.y * 0.3,
      z: Math.sin(state.time * 0.001)
    };

    ctx.lineWidth = 2;
    this.connections.forEach(conn => {
      const [i, j] = conn.split('-').map(Number);

      const aRot = new Point3D(this.points[i].x, this.points[i].y, this.points[i].z).rotate(rotation);
      const bRot = new Point3D(this.points[j].x, this.points[j].y, this.points[j].z).rotate(rotation);

      const a = aRot.project();
      const b = bRot.project();

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `hsla(${state.hue + i * 2}, 60%, 60%, ${0.3 - a.depth / 3})`;
      ctx.stroke();
    });

    this.points.forEach((point, i) => {
      const pRot = new Point3D(point.x, point.y, point.z).rotate(rotation);
      const pos = pRot.project();
      const lightness = 50 + Math.sin(state.time * 0.005 + i) * 15;

      ctx.fillStyle = `hsl(${state.hue + i * 2}, 80%, ${lightness}%)`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3 * pos.depth, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};

function drawMerkaba() {
  const time = state.time * 0.002;
  const size = 120 + Math.sin(time) * 30;

  const baseVertices = [
    new Point3D(0, size, 0),
    new Point3D(size, -size, 0),
    new Point3D(-size, -size, 0),
    new Point3D(0, 0, size * Math.sqrt(2))
  ];

  [1, -1].forEach(dir => {
    const rotatedVertices = baseVertices.map(v => {
      const copy = new Point3D(v.x, v.y, v.z);
      copy.rotateX(time * dir)
        .rotateY(time * 0.7 * dir)
        .rotateZ(time * 0.3 * dir)
        .rotate(state.rotation);
      return copy.project();
    });

    ctx.strokeStyle = `hsla(${state.hue}, 80%, 60%, 0.7)`;
    ctx.fillStyle = `hsla(${state.hue + 30}, 60%, 50%, 0.2)`;

    [[0,1,2], [0,1,3], [0,2,3], [1,2,3]].forEach(face => {
      ctx.beginPath();
      face.forEach((vi, i) => {
        const p = rotatedVertices[vi];
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  });
}

function init() {
  resizeCanvas();
  sacredGeometry.init();

  window.addEventListener('resize', () => {
    resizeCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);
  });

  const handleMouseDown = (e) => {
    state.mouse.down = true;
    state.mouse.lastX = e.clientX;
    state.mouse.lastY = e.clientY;
  };

  const handleMouseMove = (e) => {
    if (!state.mouse.down) return;
    const deltaX = e.movementX || (e.clientX - state.mouse.lastX);
    const deltaY = e.movementY || (e.clientY - state.mouse.lastY);

    state.rotation.y += deltaX * CONFIG.dragFactor;
    state.rotation.x += deltaY * CONFIG.dragFactor;

    state.mouse.lastX = e.clientX;
    state.mouse.lastY = e.clientY;
  };

  const handleMouseUp = () => {
    state.mouse.down = false;
  };

  canvas.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.scale = Math.min(
      2,
      Math.max(
        0.3,
        state.scale - e.deltaY * CONFIG.zoomSensitivity
      )
    );
  });
}

function resizeCanvas() {
  canvas.width = window.innerWidth * DPR;
  canvas.height = window.innerHeight * DPR;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
  );
  gradient.addColorStop(0, `hsl(265, 40%, 8%)`);
  gradient.addColorStop(1, `hsl(220, 60%, 2%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.shadowColor = `hsl(${state.hue}, 100%, 50%)`;
  ctx.shadowBlur = 30 * state.scale;
  particleSystem.update();
  particleSystem.draw();

  sacredGeometry.draw();
  drawMerkaba();

  state.time += 16;
  state.hue = (state.hue + CONFIG.hueSpeed) % 360;
  state.rotation.y += CONFIG.rotationSpeed;

  requestAnimationFrame(animate);
}

const particleSystem = new ParticleSystem();
init();
animate();
