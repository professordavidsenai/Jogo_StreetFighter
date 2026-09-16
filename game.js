/**
 * DUAL IMPACT // MINI JOGO DE LUTA 2D
 * Jogo para 2 jogadores com física, hitboxes, lógica de Hit-Stun e áudio sintetizado.
 */

// ==========================================
// 1. GERENCIADOR DE ÁUDIO (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPunch() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Impacto rápido (punch/jab)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playKick() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Impacto pesado (kick) com onda grave e distorção
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playSwing() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Swoosh de ataque no ar
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playKO() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.9);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  playRoundStart() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [330, 440, 587];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.25, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.15);
    });
  }
}

const sfx = new SoundFX();

// ==========================================
// 2. SISTEMA DE ENTRADA (TECLADO)
// ==========================================
class InputManager {
  constructor() {
    this.keys = {};
    this.justPressedKeys = {};

    window.addEventListener('keydown', (e) => {
      // Evitar scroll de página ao usar setas ou espaço
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys[e.code]) {
        this.justPressedKeys[e.code] = true;
      }
      this.keys[e.code] = true;

      // Iniciar áudio no primeiro toque
      sfx.init();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.justPressedKeys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasJustPressed(code) {
    if (this.justPressedKeys[code]) {
      this.justPressedKeys[code] = false;
      return true;
    }
    return false;
  }
}

const input = new InputManager();

// ==========================================
// 3. SISTEMA DE PARTÍCULAS & SCREEN SHAKE
// ==========================================
class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravidade
    this.life--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FXManager {
  constructor() {
    this.particles = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  triggerShake(duration, intensity) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  spawnHitSparks(x, y, isHeavy) {
    const count = isHeavy ? 24 : 12;
    const colors = isHeavy ? ['#ff0055', '#ffcc00', '#ffffff', '#ff6600'] : ['#ffdd00', '#ffffff', '#00d2ff'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 6 + 3) * (isHeavy ? 1.4 : 1.0);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 1.5;
      const size = Math.random() * 4 + 2;
      const life = Math.floor(Math.random() * 15 + 10);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  spawnDust(x, y) {
    for (let i = 0; i < 5; i++) {
      const vx = (Math.random() - 0.5) * 3;
      const vy = -Math.random() * 2;
      this.particles.push(new Particle(x, y, vx, vy, 'rgba(200, 200, 220, 0.6)', 3 + Math.random() * 3, 15));
    }
  }

  update() {
    // Atualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Atualizar screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
    }
  }

  applyShake(ctx) {
    if (this.shakeDuration > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(dx, dy);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}

const fx = new FXManager();

// ==========================================
// 4. CLASSE DO LUTADOR (FIGHTER)
// ==========================================
class Fighter {
  constructor({
    id,
    name,
    x,
    y,
    color,
    accentColor,
    controls,
    facing = 1,
    groundY = 470
  }) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = 54;
    this.height = 120;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.accentColor = accentColor;
    this.controls = controls;
    this.facing = facing; // 1 = olhando para direita, -1 = para esquerda
    this.groundY = groundY;

    // Vida
    this.maxHp = 100;
    this.hp = 100;
    this.isDead = false;

    // Estados: 'IDLE', 'RUN', 'JUMP', 'CROUCH', 'ATTACK_LIGHT', 'ATTACK_HEAVY', 'HIT_STUN', 'DEAD'
    this.state = 'IDLE';
    this.stateFrame = 0;

    // Mecânica de Hit-Stun
    this.stunTimer = 0;
    this.stunDuration = 0;
    this.flashTimer = 0;

    // Mecânica de Ataque
    this.attackFrame = 0;
    this.attackTotalFrames = 0;
    this.attackActiveStart = 0;
    this.attackActiveEnd = 0;
    this.hasHitTarget = false;
    this.currentAttack = null; // 'light' ou 'heavy'

    // Animação e física
    this.isGrounded = false;
    this.walkCycle = 0;
  }

  getHurtbox() {
    // A hurtbox muda se o personagem estiver agachado
    const isCrouching = this.state === 'CROUCH';
    const h = isCrouching ? this.height * 0.65 : this.height;
    const y = isCrouching ? this.y + (this.height - h) : this.y;
    return {
      x: this.x,
      y: y,
      width: this.width,
      height: h
    };
  }

  getHitbox() {
    // Retorna a área de ataque ativa somente nos frames ativos da animação
    if (
      (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY') &&
      this.attackFrame >= this.attackActiveStart &&
      this.attackFrame <= this.attackActiveEnd
    ) {
      if (this.currentAttack === 'light') {
        const hitWidth = 48;
        const hitHeight = 26;
        const hitX = this.facing === 1 ? this.x + this.width - 6 : this.x - hitWidth + 6;
        const hitY = this.y + 32;
        return { x: hitX, y: hitY, width: hitWidth, height: hitHeight, type: 'light', damage: 7, stun: 14, knockback: 5 };
      } else if (this.currentAttack === 'heavy') {
        const hitWidth = 62;
        const hitHeight = 36;
        const hitX = this.facing === 1 ? this.x + this.width - 4 : this.x - hitWidth + 4;
        const hitY = this.y + 48;
        return { x: hitX, y: hitY, width: hitWidth, height: hitHeight, type: 'heavy', damage: 16, stun: 26, knockback: 9 };
      }
    }
    return null;
  }

  takeDamage(hitbox, attackerFacing) {
    if (this.isDead) return;

    // Subtrai HP
    this.hp = Math.max(0, this.hp - hitbox.damage);

    // ====================================================
    // LÓGICA DE HIT-STUN:
    // 1. Interrompe qualquer ação atual (ataque/movimento)
    // 2. Coloca o lutador no estado HIT_STUN
    // 3. Define a duração do stun baseada na força do golpe
    // 4. Aplica knockback horizontal
    // 5. Ativa flash visual e efeitos de tela
    // ====================================================
    this.state = 'HIT_STUN';
    this.stunDuration = hitbox.stun;
    this.stunTimer = hitbox.stun;
    this.flashTimer = 8; // Pisca em branco/vermelho por 8 frames

    // Knockback empurra para longe do atacante
    this.vx = hitbox.knockback * attackerFacing;
    this.vy = hitbox.type === 'heavy' ? -3 : -1; // Leve elevação no golpe pesado
    this.isGrounded = false;

    // Disparar efeitos visuais e sonoros
    const hitX = attackerFacing === 1 ? this.x + 10 : this.x + this.width - 10;
    const hitY = this.y + (hitbox.type === 'heavy' ? 60 : 40);
    fx.spawnHitSparks(hitX, hitY, hitbox.type === 'heavy');
    fx.triggerShake(hitbox.type === 'heavy' ? 10 : 5, hitbox.type === 'heavy' ? 7 : 3);

    if (hitbox.type === 'heavy') {
      sfx.playKick();
    } else {
      sfx.playPunch();
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.state = 'DEAD';
      sfx.playKO();
    }
  }

  handleInputs(opponent) {
    // Se estiver em HIT_STUN ou MORTO, não aceita nenhum input
    if (this.state === 'HIT_STUN' || this.state === 'DEAD') {
      return;
    }

    // Se estiver no meio de um golpe, não pode mover até o golpe terminar
    if (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY') {
      return;
    }

    // Orientação automática: virar para o oponente se estiver no chão
    if (this.isGrounded) {
      this.facing = this.x < opponent.x ? 1 : -1;
    }

    // 1. Iniciar Ataques
    const lightPressed = input.wasJustPressed(this.controls.lightAttack) || 
      (this.controls.altLight && input.wasJustPressed(this.controls.altLight));
    const heavyPressed = input.wasJustPressed(this.controls.heavyAttack) || 
      (this.controls.altHeavy && input.wasJustPressed(this.controls.altHeavy));

    if (lightPressed) {
      this.startAttack('light');
      return;
    }

    if (heavyPressed) {
      this.startAttack('heavy');
      return;
    }

    // 2. Agachamento
    if (input.isDown(this.controls.down) && this.isGrounded) {
      this.state = 'CROUCH';
      this.vx = 0;
      return;
    }

    // 3. Pulo
    if (input.isDown(this.controls.up) && this.isGrounded) {
      this.vy = -16.5;
      this.isGrounded = false;
      this.state = 'JUMP';
      fx.spawnDust(this.x + this.width / 2, this.y + this.height);
      sfx.playJump();
      return;
    }

    // 4. Movimentação Horizontal
    const leftDown = input.isDown(this.controls.left);
    const rightDown = input.isDown(this.controls.right);

    const speed = 4.6;
    if (leftDown && !rightDown) {
      this.vx = -speed;
      this.state = this.isGrounded ? 'RUN' : 'JUMP';
      this.walkCycle += 0.2;
    } else if (rightDown && !leftDown) {
      this.vx = speed;
      this.state = this.isGrounded ? 'RUN' : 'JUMP';
      this.walkCycle += 0.2;
    } else {
      this.vx = 0;
      this.state = this.isGrounded ? 'IDLE' : 'JUMP';
      this.walkCycle = 0;
    }
  }

  startAttack(type) {
    this.currentAttack = type;
    this.attackFrame = 0;
    this.hasHitTarget = false;
    this.vx *= 0.3; // desacelera ao golpear

    if (type === 'light') {
      this.state = 'ATTACK_LIGHT';
      this.attackTotalFrames = 15;
      this.attackActiveStart = 4;
      this.attackActiveEnd = 9;
    } else {
      this.state = 'ATTACK_HEAVY';
      this.attackTotalFrames = 26;
      this.attackActiveStart = 8;
      this.attackActiveEnd = 16;
    }

    sfx.playSwing();
  }

  update(arenaWidth) {
    this.stateFrame++;

    // 1. Atualizar Hit-Stun
    if (this.state === 'HIT_STUN') {
      this.stunTimer--;
      // Desaceleração por atrito
      this.vx *= 0.88;

      if (this.stunTimer <= 0) {
        if (this.hp <= 0) {
          this.state = 'DEAD';
        } else {
          this.state = 'IDLE';
        }
      }
    }

    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    // 2. Atualizar Animação de Ataque
    if (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY') {
      this.attackFrame++;
      if (this.attackFrame >= this.attackTotalFrames) {
        this.state = 'IDLE';
        this.currentAttack = null;
      }
    }

    // 3. Física de Gravidade e Movimento
    this.vy += 0.8; // Gravidade
    this.x += this.vx;
    this.y += this.vy;

    // Colisão com o chão
    const currentGround = this.groundY - this.height;
    if (this.y >= currentGround) {
      this.y = currentGround;
      this.vy = 0;
      if (!this.isGrounded && this.state !== 'DEAD') {
        fx.spawnDust(this.x + this.width / 2, this.y + this.height);
      }
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Limites da Arena (Paredes)
    const wallMargin = 30;
    if (this.x < wallMargin) {
      this.x = wallMargin;
      this.vx = 0;
    } else if (this.x + this.width > arenaWidth - wallMargin) {
      this.x = arenaWidth - wallMargin - this.width;
      this.vx = 0;
    }
  }

  draw(ctx) {
    ctx.save();

    // Efeito de Flash ao tomar dano no Hit-Stun
    const isFlashing = this.flashTimer > 0;
    const inStun = this.state === 'HIT_STUN';

    // Posição base
    const centerX = this.x + this.width / 2;
    const baseY = this.y + this.height;

    // Se estiver em Stun, inclina o corpo para trás (recoil)
    if (inStun) {
      const tilt = -0.22 * this.facing;
      ctx.translate(centerX, baseY);
      ctx.rotate(tilt);
      ctx.translate(-centerX, -baseY);
    }

    // Se estiver morto, tomba no chão
    if (this.state === 'DEAD') {
      ctx.translate(centerX, baseY);
      ctx.rotate((Math.PI / 2) * -this.facing);
      ctx.translate(-centerX, -baseY + 20);
    }

    // Cor primária com efeito de flash de stun
    let bodyColor = this.color;
    let accent = this.accentColor;
    if (isFlashing) {
      bodyColor = this.flashTimer % 2 === 0 ? '#ffffff' : '#ff0033';
      accent = '#ffffff';
    }

    // 1. Sombra projetada no chão
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.groundY - 2, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Pernas
    const legOffset = Math.sin(this.walkCycle) * 12;
    const isCrouching = this.state === 'CROUCH';
    const legY = isCrouching ? this.y + this.height - 24 : this.y + this.height - 42;
    const legHeight = isCrouching ? 24 : 42;

    ctx.fillStyle = '#1e2530';
    // Perna de trás
    ctx.fillRect(centerX - 14 - (this.isGrounded ? legOffset : 0), legY, 11, legHeight);
    // Perna da frente
    ctx.fillRect(centerX + 3 + (this.isGrounded ? legOffset : 0), legY, 11, legHeight);

    // Chute (Extensão de perna no golpe pesado)
    if (this.state === 'ATTACK_HEAVY' && this.attackFrame >= 6 && this.attackFrame <= 18) {
      ctx.fillStyle = accent;
      const kickReach = 45;
      const kickX = this.facing === 1 ? centerX + 8 : centerX - 8 - kickReach;
      ctx.fillRect(kickX, this.y + 55, kickReach, 16);

      // Efeito de rastro do chute
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, this.y + 60, 48, this.facing === 1 ? -0.4 : Math.PI - 0.6, this.facing === 1 ? 0.4 : Math.PI + 0.6);
      ctx.stroke();
    }

    // 3. Tronco / Kimono
    const torsoY = isCrouching ? this.y + 36 : this.y + 24;
    const torsoHeight = isCrouching ? 38 : 54;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(this.x + 8, torsoY, this.width - 16, torsoHeight, 6);
    ctx.fill();

    // Faixa/Cinto da cintura
    ctx.fillStyle = accent;
    ctx.fillRect(this.x + 8, torsoY + torsoHeight - 12, this.width - 16, 8);

    // Pontas da faixa balançando
    ctx.fillRect(
      this.facing === 1 ? this.x + 8 : this.x + this.width - 16,
      torsoY + torsoHeight - 4,
      8,
      14 + Math.sin(this.stateFrame * 0.15) * 4
    );

    // 4. Cabeça
    const headY = isCrouching ? this.y + 14 : this.y + 2;
    ctx.fillStyle = '#ffdfba'; // Tom de pele
    ctx.beginPath();
    ctx.arc(centerX, headY + 14, 15, 0, Math.PI * 2);
    ctx.fill();

    // Bandana / Cabelo
    ctx.fillStyle = accent;
    ctx.fillRect(centerX - 15, headY + 5, 30, 8);

    // Cauda da bandana esvoaçando
    const bandanaWiggle = Math.sin(this.stateFrame * 0.2) * 5;
    ctx.beginPath();
    const bx = this.facing === 1 ? centerX - 15 : centerX + 15;
    ctx.moveTo(bx, headY + 9);
    ctx.lineTo(bx - this.facing * 20, headY + 6 + bandanaWiggle);
    ctx.lineTo(bx - this.facing * 18, headY + 15 + bandanaWiggle);
    ctx.closePath();
    ctx.fill();

    // Olhos / Máscara
    ctx.fillStyle = '#0f172a';
    const eyeX = this.facing === 1 ? centerX + 4 : centerX - 9;
    ctx.fillRect(eyeX, headY + 12, 5, 3);

    // 5. Braços / Soco
    const armY = isCrouching ? this.y + 44 : this.y + 32;
    if (this.state === 'ATTACK_LIGHT' && this.attackFrame >= 3 && this.attackFrame <= 12) {
      // Braço estendido no soco
      const punchReach = 44;
      const punchX = this.facing === 1 ? centerX : centerX - punchReach;
      ctx.fillStyle = bodyColor;
      ctx.fillRect(punchX, armY, punchReach, 12);

      // Luva / Punho
      ctx.fillStyle = accent;
      const fistX = this.facing === 1 ? punchX + punchReach - 10 : punchX;
      ctx.fillRect(fistX, armY - 2, 12, 16);

      // Linha de velocidade do soco
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(punchX, armY + 6);
      ctx.lineTo(punchX + (this.facing === 1 ? -15 : 15), armY + 6);
      ctx.stroke();
    } else if (this.state !== 'ATTACK_HEAVY') {
      // Posição de guarda padrão
      ctx.fillStyle = accent;
      const guardX = this.facing === 1 ? centerX + 6 : centerX - 14;
      ctx.fillRect(guardX, armY + 4, 10, 18);
    }

    ctx.restore();
  }
}

// ==========================================
// 5. GERENCIADOR DO JOGO (GAME CONTROLLER)
// ==========================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // HUD Elements
    this.p1CurrentBar = document.getElementById('p1CurrentBar');
    this.p1LagBar = document.getElementById('p1LagBar');
    this.p1HpVal = document.getElementById('p1HpVal');
    this.p1Status = document.getElementById('p1Status');

    this.p2CurrentBar = document.getElementById('p2CurrentBar');
    this.p2LagBar = document.getElementById('p2LagBar');
    this.p2HpVal = document.getElementById('p2HpVal');
    this.p2Status = document.getElementById('p2Status');

    this.matchTimerElem = document.getElementById('matchTimer');
    this.screenOverlay = document.getElementById('screenOverlay');
    this.bannerText = document.getElementById('bannerText');
    this.subBannerText = document.getElementById('subBannerText');
    this.restartBtn = document.getElementById('restartBtn');

    // Estado da partida
    this.matchTimer = 99;
    this.timerInterval = null;
    this.matchState = 'STARTING'; // 'STARTING', 'FIGHTING', 'OVER'

    this.initFighters();
    this.setupListeners();
    this.startMatch();

    // Iniciar loop principal
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initFighters() {
    this.p1 = new Fighter({
      id: 'p1',
      name: 'KAZUTO',
      x: 180,
      y: 350,
      color: '#00d2ff',
      accentColor: '#3b82f6',
      facing: 1,
      controls: {
        up: 'KeyW',
        left: 'KeyA',
        down: 'KeyS',
        right: 'KeyD',
        lightAttack: 'KeyF',
        heavyAttack: 'KeyG'
      }
    });

    this.p2 = new Fighter({
      id: 'p2',
      name: 'SHINOBI',
      x: 720,
      y: 350,
      color: '#ff3366',
      accentColor: '#f43f5e',
      facing: -1,
      controls: {
        up: 'ArrowUp',
        left: 'ArrowLeft',
        down: 'ArrowDown',
        right: 'ArrowRight',
        lightAttack: 'KeyK',
        heavyAttack: 'KeyL',
        altLight: 'Numpad1',
        altHeavy: 'Numpad2'
      }
    });
  }

  setupListeners() {
    this.restartBtn.addEventListener('click', () => {
      this.resetMatch();
    });

    window.addEventListener('keydown', (e) => {
      if (this.matchState === 'OVER' && e.code === 'Space') {
        this.resetMatch();
      }
    });
  }

  startMatch() {
    this.matchState = 'STARTING';
    this.screenOverlay.classList.add('visible');
    this.bannerText.textContent = 'ROUND 1';
    this.subBannerText.textContent = 'PREPARE-SE...';
    this.restartBtn.style.display = 'none';

    sfx.playRoundStart();

    setTimeout(() => {
      this.bannerText.textContent = 'FIGHT!';
      this.subBannerText.textContent = '';
      setTimeout(() => {
        this.screenOverlay.classList.remove('visible');
        this.matchState = 'FIGHTING';
        this.startTimer();
      }, 700);
    }, 1200);
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.matchState !== 'FIGHTING') return;

      this.matchTimer--;
      this.matchTimerElem.textContent = this.matchTimer < 10 ? '0' + this.matchTimer : this.matchTimer;

      if (this.matchTimer <= 0) {
        this.matchTimer = 0;
        this.handleTimeOut();
      }
    }, 1000);
  }

  handleTimeOut() {
    this.matchState = 'OVER';
    clearInterval(this.timerInterval);
    this.screenOverlay.classList.add('visible');
    this.bannerText.textContent = 'TEMPO!';
    this.restartBtn.style.display = 'block';

    if (this.p1.hp > this.p2.hp) {
      this.subBannerText.textContent = 'VITÓRIA DE KAZUTO (P1)!';
    } else if (this.p2.hp > this.p1.hp) {
      this.subBannerText.textContent = 'VITÓRIA DE SHINOBI (P2)!';
    } else {
      this.subBannerText.textContent = 'EMPATE!';
    }
  }

  handleKO(winner, loser) {
    this.matchState = 'OVER';
    clearInterval(this.timerInterval);

    setTimeout(() => {
      this.screenOverlay.classList.add('visible');
      this.bannerText.textContent = 'K.O.';
      this.subBannerText.textContent = `VITÓRIA DE ${winner.name}!`;
      this.restartBtn.style.display = 'block';
    }, 600);
  }

  resetMatch() {
    clearInterval(this.timerInterval);
    this.matchTimer = 99;
    this.matchTimerElem.textContent = '99';
    this.initFighters();
    this.updateHUD();
    this.startMatch();
  }

  checkCollisions() {
    if (this.matchState !== 'FIGHTING') return;

    const p1Hurtbox = this.p1.getHurtbox();
    const p2Hurtbox = this.p2.getHurtbox();

    // Pushbox: Suave repulsão física quando os corpos colidem (evita que atravessem um ao outro)
    if (this.rectsIntersect(p1Hurtbox, p2Hurtbox) && this.p1.state !== 'DEAD' && this.p2.state !== 'DEAD') {
      const pushForce = 1.6;
      if (this.p1.x < this.p2.x) {
        this.p1.x -= pushForce;
        this.p2.x += pushForce;
      } else {
        this.p1.x += pushForce;
        this.p2.x -= pushForce;
      }
    }

    // Coleta as hitboxes antes de aplicar qualquer dano para permitir 'trade' de golpes simultâneos
    const p1Hitbox = this.p1.getHitbox();
    const p2Hitbox = this.p2.getHitbox();

    const p1HitsP2 = p1Hitbox && !this.p1.hasHitTarget && this.rectsIntersect(p1Hitbox, p2Hurtbox);
    const p2HitsP1 = p2Hitbox && !this.p2.hasHitTarget && this.rectsIntersect(p2Hitbox, p1Hurtbox);

    if (p1HitsP2) {
      this.p1.hasHitTarget = true;
      this.p2.takeDamage(p1Hitbox, this.p1.facing);
      if (this.p2.isDead) {
        this.handleKO(this.p1, this.p2);
      }
    }

    if (p2HitsP1) {
      this.p2.hasHitTarget = true;
      this.p1.takeDamage(p2Hitbox, this.p2.facing);
      if (this.p1.isDead) {
        this.handleKO(this.p2, this.p1);
      }
    }
  }

  rectsIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  updateHUD() {
    // P1 Health
    const p1Percent = Math.max(0, (this.p1.hp / this.p1.maxHp) * 100);
    this.p1CurrentBar.style.width = p1Percent + '%';
    this.p1LagBar.style.width = p1Percent + '%';
    this.p1HpVal.textContent = `${this.p1.hp}/${this.p1.maxHp}`;

    // P1 Status Badge
    if (this.p1.state === 'HIT_STUN') {
      this.p1Status.textContent = 'STUNNED!';
      this.p1Status.className = 'status-badge stunned';
    } else if (this.p1.isDead) {
      this.p1Status.textContent = 'K.O.';
      this.p1Status.className = 'status-badge';
    } else {
      this.p1Status.textContent = this.p1.state === 'CROUCH' ? 'DEFESA' : 'PRONTO';
      this.p1Status.className = 'status-badge';
    }

    // P2 Health
    const p2Percent = Math.max(0, (this.p2.hp / this.p2.maxHp) * 100);
    this.p2CurrentBar.style.width = p2Percent + '%';
    this.p2LagBar.style.width = p2Percent + '%';
    this.p2HpVal.textContent = `${this.p2.hp}/${this.p2.maxHp}`;

    // P2 Status Badge
    if (this.p2.state === 'HIT_STUN') {
      this.p2Status.textContent = 'STUNNED!';
      this.p2Status.className = 'status-badge stunned';
    } else if (this.p2.isDead) {
      this.p2Status.textContent = 'K.O.';
      this.p2Status.className = 'status-badge';
    } else {
      this.p2Status.textContent = this.p2.state === 'CROUCH' ? 'DEFESA' : 'PRONTO';
      this.p2Status.className = 'status-badge';
    }
  }

  drawArenaBackground() {
    const ctx = this.ctx;

    // 1. Céu Gradiente Sunset / Cyberpunk
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#0d0f1e');
    skyGrad.addColorStop(0.4, '#1b1b3a');
    skyGrad.addColorStop(0.7, '#481d45');
    skyGrad.addColorStop(1, '#8b263e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Sol / Lua Neon no horizonte
    ctx.save();
    const sunGrad = ctx.createRadialGradient(this.width / 2, 280, 20, this.width / 2, 280, 160);
    sunGrad.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255, 50, 100, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 50, 100, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(this.width / 2, 280, 160, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Silhueta de prédios ao fundo
    ctx.fillStyle = '#101222';
    const buildings = [
      { x: 40, w: 70, h: 140 },
      { x: 120, w: 90, h: 200 },
      { x: 220, w: 60, h: 110 },
      { x: 290, w: 100, h: 230 },
      { x: 570, w: 95, h: 220 },
      { x: 680, w: 70, h: 160 },
      { x: 760, w: 85, h: 190 },
      { x: 860, w: 75, h: 120 }
    ];
    for (const b of buildings) {
      ctx.fillRect(b.x, 470 - b.h, b.w, b.h);
      // Janelas brilhantes
      ctx.fillStyle = 'rgba(255, 230, 120, 0.2)';
      for (let y = 470 - b.h + 20; y < 450; y += 30) {
        ctx.fillRect(b.x + 10, y, 6, 12);
        ctx.fillRect(b.x + b.w - 18, y, 6, 12);
      }
      ctx.fillStyle = '#101222';
    }

    // 4. Piso do Dojo / Plataforma de Luta
    const floorY = 470;
    const floorHeight = this.height - floorY;

    // Gradiente do chão de madeira polida
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, this.height);
    floorGrad.addColorStop(0, '#242a38');
    floorGrad.addColorStop(0.15, '#181d28');
    floorGrad.addColorStop(1, '#0c0f16');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, this.width, floorHeight);

    // Linha de neon superior do chão
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(this.width, floorY);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Linhas de perspectiva do ringue
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 80; x < this.width; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + (x - this.width / 2) * 0.4, this.height);
      ctx.stroke();
    }

    // Postes neon nas laterais
    ctx.fillStyle = 'rgba(0, 210, 255, 0.6)';
    ctx.fillRect(20, floorY - 140, 6, 140);
    ctx.fillStyle = 'rgba(255, 51, 102, 0.6)';
    ctx.fillRect(this.width - 26, floorY - 140, 6, 140);
  }

  loop() {
    // 1. Processar entradas
    if (this.matchState === 'FIGHTING') {
      this.p1.handleInputs(this.p2);
      this.p2.handleInputs(this.p1);
    }

    // 2. Atualizar lutadores e efeitos
    this.p1.update(this.width);
    this.p2.update(this.width);
    this.checkCollisions();
    fx.update();

    // 3. Atualizar HUD dinâmico
    this.updateHUD();

    // 4. Renderização
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Aplicar tremor de tela caso haja impacto
    fx.applyShake(this.ctx);

    // Desenhar cenário
    this.drawArenaBackground();

    // Desenhar lutadores
    this.p1.draw(this.ctx);
    this.p2.draw(this.ctx);

    // Desenhar partículas de faíscas/poeira
    fx.draw(this.ctx);

    this.ctx.restore();

    requestAnimationFrame(() => this.loop());
  }
}

// Inicializar jogo quando o DOM carregar
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
