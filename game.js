// Kettlebell Climber - A "Getting Over It" inspired physics-based platformer
// Main game logic

// Get audio elements
const bounceSound = document.getElementById("bounceSound");

// ===== Canvas Setup =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ensure canvas is properly sized
function resizeCanvas() {
    const aspectRatio = 800 / 600;
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;
    
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== Game Constants =====
const GRAVITY = 0.5;                 // Gravity acceleration (pixels per frame^2)
const MAX_CHARGE = 100;              // Maximum charge percentage
const JUMP_VELOCITY_SCALE = 1.5;     // Scale factor for jump velocity
const HORIZONTAL_VELOCITY_SCALE = 10; // Scale factor for horizontal velocity
const FRICTION = 0.95;               // Friction when sliding on surfaces
const BOUNCE_FACTOR = 0.3;           // Bounciness when hitting objects

// ===== Visual Effects =====
let screenShake = 0;       // Current screen shake duration
let screenShakeIntensity = 0; // Screen shake intensity

// Checkpoint glow effect
const CHECKPOINT_GLOW_COLOR = 'rgba(255, 215, 0, 0.3)'; // Golden glow
const CHECKPOINT_GLOW_SIZE = 8; // Size of glow around checkpoint
const CHECKPOINT_PULSE_SPEED = 0.02; // Speed of pulse animation
let checkpointGlowIntensity = 0.5; // Current glow intensity (0-1)
let checkpointPulseDirection = 1; // 1 = increasing, -1 = decreasing

// ===== Asset Loading =====
const ASSETS = {
    background: 'assets/background.png',
    player: 'assets/player.png',
    kettlebell: 'assets/kettlebell.png',
    junk: {
        car: 'assets/junk_car.png',
        tv: 'assets/junk_tv.png',
        sofa: 'assets/junk_sofa.png',
        fridge: 'assets/junk_fridge.png',
        tire: 'assets/junk_tire.png'
    }
};

// Placeholder assets (will be replaced with loaded images)
const images = {};
let assetsLoaded = false;

// Create placeholder directory and assets
function loadPlaceholderAssets() {
    // Use simple colored rectangles as placeholders
    assetsLoaded = true;
}

// In a full implementation, we would load real assets here
function loadAssets() {
    // For now, just use placeholders
    loadPlaceholderAssets();
}

// ===== Player Setup =====
let player = {
    x: 50,                       // starting X position
    y: canvas.height - 100,      // starting Y position
    width: 40,                   // player width
    height: 60,                  // player height
    vx: 0,                       // horizontal velocity
    vy: 0,                       // vertical velocity
    charging: false,             // is currently charging a jump
    chargePower: 0,              // current charge power (0-100)
    chargeDirection: 0,          // -1 for left, 1 for right
    onGround: false,             // is player on a platform
    kettlebellAngle: 0,          // angle of kettlebell for animation
    kettlebellSwing: 0,          // swing animation progress
    jumpCount: 0,                // count of jumps made
    fallCount: 0,                // count of falls
    startTime: Date.now(),       // time when level started
    checkpoint: {                // last safe position
        x: 50,
        y: canvas.height - 100
    },
    checkpointPlatform: null     // current checkpoint platform
};

// ===== Level Design =====
// Level 1: Junk Pile
// Each object has:
// - x, y: position
// - width, height: dimensions
// - type: visual appearance
// - friction: optional friction override
// - bounce: optional bounce override
const level1 = [
    // Ground base
    { 
        x: 0, 
        y: canvas.height - 40, 
        width: canvas.width, 
        height: 40, 
        type: 'ground',
        friction: 0.98
    },
    
    // First easy platforms (tutorial section)
    { 
        x: 120, 
        y: canvas.height - 100, 
        width: 80, 
        height: 30, 
        type: 'sofa' 
    },
    { 
        x: 240, 
        y: canvas.height - 150, 
        width: 100, 
        height: 40, 
        type: 'car' 
    },
    
    // Middle section (medium difficulty)
    { 
        x: 370, 
        y: canvas.height - 200, 
        width: 60, 
        height: 25, 
        type: 'tv' 
    },
    { 
        x: 450, 
        y: canvas.height - 250, 
        width: 70, 
        height: 60, 
        type: 'fridge',
        friction: 0.92  // Slightly more slippery
    },
    
    // Higher platforms (challenging jumps)
    { 
        x: 560, 
        y: canvas.height - 320, 
        width: 50, 
        height: 20, 
        type: 'tire',
        bounce: 0.4  // Slightly bouncy
    },
    { 
        x: 650, 
        y: canvas.height - 380, 
        width: 120, 
        height: 30, 
        type: 'car' 
    },
    
    // Goal platform
    { 
        x: canvas.width - 50, 
        y: canvas.height - 450, 
        width: 50, 
        height: 50, 
        type: 'goal',
        friction: 1.0  // No sliding on goal
    }
];

let currentLevel = level1;
let gameState = 'playing'; // 'playing', 'victory', 'paused'

// ===== Input Handling =====
const keys = {
    left: false,
    right: false,
    restart: false
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = true;
        if (!player.charging && player.onGround) {
            player.charging = true;
            player.chargeDirection = -1;
        }
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = true;
        if (!player.charging && player.onGround) {
            player.charging = true;
            player.chargeDirection = 1;
        }
    }
    if (e.code === 'KeyR') {
        keys.restart = true;
        resetPlayer();
    }
    if (e.code === 'Space') {
        if (gameState === 'victory') {
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = false;
        if (player.charging && player.chargeDirection === -1) {
            releaseJump();
        }
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = false;
        if (player.charging && player.chargeDirection === 1) {
            releaseJump();
        }
    }
    if (e.code === 'KeyR') {
        keys.restart = false;
    }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    // Left side of screen = charge left, right side = charge right
    if (touchX < rect.width / 2) {
        keys.left = true;
        if (!player.charging && player.onGround) {
            player.charging = true;
            player.chargeDirection = -1;
        }
    } else {
        keys.right = true;
        if (!player.charging && player.onGround) {
            player.charging = true;
            player.chargeDirection = 1;
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (keys.left) {
        keys.left = false;
        if (player.charging && player.chargeDirection === -1) {
            releaseJump();
        }
    }
    if (keys.right) {
        keys.right = false;
        if (player.charging && player.chargeDirection === 1) {
            releaseJump();
        }
    }
});

// ===== Game Mechanics =====
function releaseJump() {
    if (!player.onGround) return;
    
    // Calculate jump power based on charge
    const powerPercent = player.chargePower / MAX_CHARGE;
    
    // Apply velocities based on charge and direction
    player.vx = player.chargeDirection * powerPercent * HORIZONTAL_VELOCITY_SCALE;
    player.vy = -Math.sqrt(player.chargePower) * JUMP_VELOCITY_SCALE;
    
    // Reset charge state
    player.charging = false;
    player.chargePower = 0;
    player.onGround = false;
    player.jumpCount++;
    
    // Start kettlebell swing animation
    player.kettlebellSwing = 1.0;
}

function resetPlayer() {
    // Reset to last checkpoint or starting position
    player.x = player.checkpoint.x;
    player.y = player.checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.charging = false;
    player.chargePower = 0;
    player.chargeDirection = 0;
    player.kettlebellAngle = 0;
    player.kettlebellSwing = 0;
    player.fallCount++;
    
    // Find and store the current checkpoint platform
    player.checkpointPlatform = findCheckpointPlatform();
}

function resetGame() {
    // Full game reset
    player = {
        x: 50,
        y: canvas.height - 100,
        width: 40,
        height: 60,
        vx: 0,
        vy: 0,
        charging: false,
        chargePower: 0,
        chargeDirection: 0,
        onGround: false,
        kettlebellAngle: 0,
        kettlebellSwing: 0,
        jumpCount: 0,
        fallCount: 0,
        startTime: Date.now(),
        checkpoint: {
            x: 50,
            y: canvas.height - 100
        },
        checkpointPlatform: null
    };
    gameState = 'playing';
}

function checkVictory() {
    // Check if player reached the goal platform (last platform in the level)
    const goal = currentLevel[currentLevel.length - 1];
    if (
        player.x > goal.x && 
        player.x < goal.x + goal.width &&
        player.y + player.height > goal.y &&
        player.y + player.height < goal.y + goal.height + 5
    ) {
        gameState = 'victory';
    }
}

// Add a function to identify the current checkpoint platform
function findCheckpointPlatform() {
    // Find the platform that contains the checkpoint position
    for (const obj of currentLevel) {
        if (player.checkpoint.x >= obj.x && 
            player.checkpoint.x <= obj.x + obj.width &&
            player.checkpoint.y >= obj.y - player.height && 
            player.checkpoint.y <= obj.y + obj.height) {
            return obj;
        }
    }
    return null; // No platform found
}

// ===== Physics =====
function updatePhysics() {
    if (gameState !== 'playing') return;
    
    // Update charge if charging
    if (player.charging) {
        // Reduced charge rate from 2 to 0.8 for slower charging
        player.chargePower = Math.min(player.chargePower + 0.8, MAX_CHARGE);
        
        // Update kettlebell animation while charging
        player.kettlebellAngle = Math.sin(player.chargePower / 10) * 0.2;
    }
    
    // Apply gravity
    player.vy += GRAVITY;
    
    // Update kettlebell swing animation
    if (player.kettlebellSwing > 0) {
        player.kettlebellSwing -= 0.05;
        if (player.kettlebellSwing < 0) player.kettlebellSwing = 0;
    }
    
    // Move player
    player.x += player.vx;
    player.y += player.vy;
    
    // Track if player was on ground before collision checks
    const wasOnGround = player.onGround;
    player.onGround = false;
    
    // Check for collisions with level objects
    checkCollisions();
    
    // Check if player fell off the bottom of the screen
    if (player.y > canvas.height + 100) {
        resetPlayer();
    }
    
    // Apply air resistance
    if (!player.onGround) {
        player.vx *= 0.98;
    }
    
    // Check if player reached the goal
    checkVictory();
    
    // Update checkpoint glow effect
    checkpointGlowIntensity += CHECKPOINT_PULSE_SPEED * checkpointPulseDirection;
    
    // Reverse direction at min/max intensity
    if (checkpointGlowIntensity >= 1) {
        checkpointGlowIntensity = 1;
        checkpointPulseDirection = -1;
    } else if (checkpointGlowIntensity <= 0.3) {
        checkpointGlowIntensity = 0.3;
        checkpointPulseDirection = 1;
    }
}

function checkCollisions() {
    player.onGround = false;
    
    // Check collision with each object in the level
    for (const obj of currentLevel) {
        // Simple AABB collision detection
        if (
            player.x + player.width > obj.x &&
            player.x < obj.x + obj.width &&
            player.y + player.height > obj.y &&
            player.y < obj.y + obj.height
        ) {
            // Determine collision side (top, bottom, left, right)
            const overlapLeft = player.x + player.width - obj.x;
            const overlapRight = obj.x + obj.width - player.x;
            const overlapTop = player.y + player.height - obj.y;
            const overlapBottom = obj.y + obj.height - player.y;
            
            // Find the smallest overlap to determine collision side
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            // Apply collision response based on side
            if (minOverlap === overlapTop && player.vy >= 0) {
                // Landing on top of object
                player.y = obj.y - player.height;
                player.vy = 0;
                player.onGround = true;
                
                // Only update checkpoint if this platform is higher than the current checkpoint
                // or if there is no checkpoint yet
                if (!player.checkpointPlatform || obj.y < player.checkpointPlatform.y) {
                    player.checkpoint = { x: player.x, y: player.y };
                    player.checkpointPlatform = obj;
                }
                
                // Apply friction to horizontal movement
                const frictionFactor = obj.friction || FRICTION;
                player.vx *= frictionFactor;
                
                // If almost stopped, stop completely
                if (Math.abs(player.vx) < 0.1) player.vx = 0;
            } 
            else if (minOverlap === overlapBottom && player.vy <= 0) {
                // Hitting bottom of object
                player.y = obj.y + obj.height;
                player.vy = Math.abs(player.vy) * (obj.bounce || BOUNCE_FACTOR);
            }
            else if (minOverlap === overlapLeft && player.vx >= 0) {
                // Hitting left side of object
                player.x = obj.x - player.width;
                player.vx = -player.vx * (obj.bounce || BOUNCE_FACTOR);
            }
            else if (minOverlap === overlapRight && player.vx <= 0) {
                // Hitting right side of object
                player.x = obj.x + obj.width;
                player.vx = -player.vx * (obj.bounce || BOUNCE_FACTOR);
            }
        }
    }
    
    // Screen boundary collisions
    if (player.x < 0) {
        player.x = 0;
        player.vx = -player.vx * BOUNCE_FACTOR;
    }
    else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.vx = -player.vx * BOUNCE_FACTOR;
    }
}

// ===== Rendering =====
function render() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (gradient for now)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw level
    drawLevel();
    
    // Draw player
    drawPlayer();
    
    // Draw UI
    drawUI();
    
    // Draw victory screen if applicable
    if (gameState === 'victory') {
        drawVictoryScreen();
    }
}

function drawLevel() {
    // Draw each object in the level
    for (const obj of currentLevel) {
        // Draw checkpoint glow for the current checkpoint platform
        if (player.checkpointPlatform && obj === player.checkpointPlatform) {
            // Draw glowing effect
            ctx.fillStyle = CHECKPOINT_GLOW_COLOR;
            ctx.globalAlpha = checkpointGlowIntensity;
            
            // Draw a glowing rectangle slightly larger than the platform
            ctx.fillRect(
                obj.x - CHECKPOINT_GLOW_SIZE, 
                obj.y - CHECKPOINT_GLOW_SIZE, 
                obj.width + CHECKPOINT_GLOW_SIZE * 2, 
                obj.height + CHECKPOINT_GLOW_SIZE * 2
            );
            
            // Reset alpha
            ctx.globalAlpha = 1.0;
        }
        
        // Choose color based on object type
        switch(obj.type) {
            case 'ground':
                ctx.fillStyle = '#3d3d29';
                break;
            case 'sofa':
                ctx.fillStyle = '#8B4513';
                break;
            case 'car':
                ctx.fillStyle = '#4682B4';
                break;
            case 'tv':
                ctx.fillStyle = '#2F4F4F';
                break;
            case 'fridge':
                ctx.fillStyle = '#B0C4DE';
                break;
            case 'tire':
                ctx.fillStyle = '#36454F';
                break;
            case 'goal':
                ctx.fillStyle = '#FFD700';
                break;
            default:
                ctx.fillStyle = '#654';
        }
        
        // Draw the object
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        
        // Add some detail to objects
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    }
}

function drawPlayer() {
    // Draw player as a QWOP-like stick figure
    const centerX = player.x + player.width / 2;
    const headY = player.y + 10;
    const torsoY = player.y + 35;
    
    // Save context for rotation if needed
    ctx.save();
    
    // Apply slight lean based on velocity
    const leanAngle = player.vx * 0.01;
    ctx.translate(centerX, player.y);
    ctx.rotate(leanAngle);
    ctx.translate(-centerX, -player.y);
    
    // Draw head
    ctx.fillStyle = '#F5D0A9'; // Skin tone
    ctx.beginPath();
    ctx.arc(centerX, headY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw torso
    ctx.beginPath();
    ctx.moveTo(centerX, headY + 10);
    ctx.lineTo(centerX, torsoY);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw arms
    ctx.beginPath();
    
    // Left arm (changes with kettlebell position)
    const leftArmAngle = player.kettlebellAngle - Math.PI/4;
    const leftShoulderX = centerX - 2;
    const leftShoulderY = headY + 15;
    const leftElbowX = leftShoulderX - 10;
    const leftElbowY = leftShoulderY + 5;
    
    ctx.moveTo(leftShoulderX, leftShoulderY);
    ctx.lineTo(leftElbowX, leftElbowY);
    
    // Right arm
    const rightShoulderX = centerX + 2;
    const rightShoulderY = headY + 15;
    const rightElbowX = rightShoulderX + 8;
    const rightElbowY = rightShoulderY + 10;
    const rightHandX = rightElbowX + 5;
    const rightHandY = rightElbowY + 5;
    
    ctx.moveTo(rightShoulderX, rightShoulderY);
    ctx.lineTo(rightElbowX, rightElbowY);
    ctx.lineTo(rightHandX, rightHandY);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw legs
    const hipY = torsoY;
    const kneeY = hipY + 15;
    const footY = player.y + player.height;
    
    // Left leg
    const leftHipX = centerX - 5;
    const leftKneeX = leftHipX - 5;
    const leftFootX = leftKneeX - 5;
    
    ctx.beginPath();
    ctx.moveTo(leftHipX, hipY);
    ctx.lineTo(leftKneeX, kneeY);
    ctx.lineTo(leftFootX, footY);
    
    // Right leg
    const rightHipX = centerX + 5;
    const rightKneeX = rightHipX + 5;
    const rightFootX = rightKneeX + 5;
    
    ctx.beginPath();
    ctx.moveTo(leftHipX, hipY);
    ctx.lineTo(leftKneeX, kneeY);
    ctx.lineTo(leftFootX, footY);
    ctx.moveTo(rightHipX, hipY);
    ctx.lineTo(rightKneeX, kneeY);
    ctx.lineTo(rightFootX, footY);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw body (shirt)
    ctx.beginPath();
    ctx.moveTo(centerX - 8, headY + 10);
    ctx.lineTo(centerX - 8, torsoY);
    ctx.lineTo(centerX + 8, torsoY);
    ctx.lineTo(centerX + 8, headY + 10);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c'; // Red shirt
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw kettlebell
    const kettlebellSize = 15;
    
    // Apply kettlebell position based on arm angle
    const kettlebellDistance = 25;
    const kettlebellX = leftElbowX + Math.cos(leftArmAngle) * kettlebellDistance;
    const kettlebellY = leftElbowY + Math.sin(leftArmAngle) * kettlebellDistance;
    
    // Draw arm holding kettlebell
    ctx.beginPath();
    ctx.moveTo(leftElbowX, leftElbowY);
    ctx.lineTo(kettlebellX, kettlebellY - kettlebellSize/2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw kettlebell
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(kettlebellX, kettlebellY, kettlebellSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw kettlebell handle
    ctx.beginPath();
    ctx.moveTo(kettlebellX - kettlebellSize/3, kettlebellY - kettlebellSize);
    ctx.lineTo(kettlebellX + kettlebellSize/3, kettlebellY - kettlebellSize);
    ctx.lineTo(kettlebellX + kettlebellSize/3, kettlebellY - kettlebellSize/2);
    ctx.lineTo(kettlebellX - kettlebellSize/3, kettlebellY - kettlebellSize/2);
    ctx.closePath();
    ctx.fillStyle = '#555';
    ctx.fill();
    
    // Restore context
    ctx.restore();
    
    // Draw charge meter if charging
    if (player.charging) {
        const meterWidth = 40;
        const meterHeight = 5;
        const meterX = player.x + (player.width - meterWidth) / 2;
        const meterY = player.y - 15;
        
        // Draw background
        ctx.fillStyle = '#444';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Draw charge level
        const chargeWidth = (player.chargePower / MAX_CHARGE) * meterWidth;
        ctx.fillStyle = player.chargePower < MAX_CHARGE * 0.8 ? '#3498db' : '#e74c3c';
        ctx.fillRect(meterX, meterY, chargeWidth, meterHeight);
    }
}

function drawUI() {
    // Draw game stats
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    // Draw jump count
    ctx.fillText(`Jumps: ${player.jumpCount}`, 20, 30);
    
    // Draw fall count
    ctx.fillText(`Falls: ${player.fallCount}`, 20, 55);
    
    // Draw time
    const elapsedTime = Math.floor((Date.now() - player.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 80);
    
    // Draw controls help
    ctx.textAlign = 'right';
    ctx.fillText('Hold Left/Right to charge, release to jump', canvas.width - 20, 30);
    ctx.fillText('Press R to reset to checkpoint', canvas.width - 20, 55);
}

function drawVictoryScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Victory message
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    ctx.fillText('Victory!', canvas.width / 2, canvas.height / 2 - 50);
    
    // Stats
    ctx.font = '24px Arial';
    
    const elapsedTime = Math.floor((Date.now() - player.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    
    ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Jumps: ${player.jumpCount}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText(`Falls: ${player.fallCount}`, canvas.width / 2, canvas.height / 2 + 80);
    
    // Restart prompt
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 140);
}

// ===== Game Loop =====
function gameLoop() {
    updatePhysics();
    render();
    requestAnimationFrame(gameLoop);
}

// ===== Initialize Game =====
function init() {
    loadAssets();
    resetGame();
    player.checkpointPlatform = findCheckpointPlatform();
    gameLoop();
}

// Start the game
init();
