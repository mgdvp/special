// Babylon.js FPS scene with door logic (vanilla JS version)
// Requires <script src="https://cdn.babylonjs.com/babylon.js"></script>

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Camera setup
const camera = new BABYLON.UniversalCamera("playerCam", new BABYLON.Vector3(0, 1.6, -4), scene);
camera.speed = 1.7;
const joystickSpeed = 6.0;
camera.inertia = 0.6;
camera.angularSensibility = 1000;
camera.angularSensibilityX = 1000;
camera.angularSensibilityY = 1000;
camera.cameraAcceleration = 0;
camera.attachControl(canvas, true);

// --- Virtual joystick ---
const joystick = document.createElement('div');
Object.assign(joystick.style, {
  position: 'absolute',
  left: '36px',
  bottom: '36px',
  width: '140px',
  height: '140px',
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.25)',
  touchAction: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '1000'
});
const knob = document.createElement('div');
Object.assign(knob.style, {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.8)',
  transform: 'translate(0,0)',
  touchAction: 'none'
});
joystick.appendChild(knob);
document.body.appendChild(joystick);

let rect = joystick.getBoundingClientRect();
let joystickVec = { x: 0, y: 0 };

function handlePointer(x, y) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const max = rect.width / 2;
  const nx = Math.max(-1, Math.min(1, dx / max));
  const ny = Math.max(-1, Math.min(1, dy / max));
  knob.style.transform = `translate(${nx*36}px, ${ny*36}px)`;
  joystickVec.x = nx;
  joystickVec.y = -ny; // forward is negative screen Y
}

function releaseJoystick() {
  knob.style.transform = 'translate(0,0)';
  joystickVec.x = 0;
  joystickVec.y = 0;
}

joystick.addEventListener('touchstart', (e) => { rect = joystick.getBoundingClientRect(); handlePointer(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); });
joystick.addEventListener('touchmove', (e) => { handlePointer(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); });
joystick.addEventListener('touchend', (e) => { releaseJoystick(); e.preventDefault(); });

// Mouse support for desktop testing
joystick.addEventListener('pointerdown', (e) => { rect = joystick.getBoundingClientRect(); joystick.setPointerCapture(e.pointerId); handlePointer(e.clientX, e.clientY); });
joystick.addEventListener('pointermove', (e) => { if (e.buttons) handlePointer(e.clientX, e.clientY); });
joystick.addEventListener('pointerup', (e) => { releaseJoystick(); try { joystick.releasePointerCapture(e.pointerId); } catch {} });

// --- Move camera directly from joystick vector ---
engine.runRenderLoop(() => {
  const dt = engine.getDeltaTime() / 1000; // seconds
  const speed = joystickSpeed || camera.speed || 1.7;
  const jx = joystickVec.x;
  const jy = joystickVec.y;
  if (Math.abs(jx) > 0.01 || Math.abs(jy) > 0.01) {
    const forward = camera.getDirection(new BABYLON.Vector3(0,0,1));
    forward.y = 0; forward.normalize();
    const right = camera.getDirection(new BABYLON.Vector3(1,0,0));
    right.y = 0; right.normalize();
    const move = forward.scale(jy * speed * dt).add(right.scale(jx * speed * dt));
    try { camera.moveWithCollisions(move); } catch (e) { camera.position.addInPlace(move); }
  }

  scene.render();
});


// Pointer lock setup
const pointerSound = new Audio("assets/sound.mp3");
pointerSound.preload = "auto";
pointerSound.volume = 0.8;
const doorSound = new Audio("assets/menenazzarafateliyin.mp3");
doorSound.preload = "auto";
doorSound.volume = 1;

canvas.addEventListener("click", () => {
  const el = document.pointerLockElement;
  if (el !== canvas) {
    canvas.requestPointerLock();
    pointerSound.play().catch(() => {});
  }
});

function _onPointerLockChange() {
  const el = document.pointerLockElement;
  if (el === canvas) pointerSound.play().catch(() => {});
  else { try { pointerSound.pause(); pointerSound.currentTime = 0; } catch (e) {} }
}
document.addEventListener("pointerlockchange", _onPointerLockChange);

// WASD movement keys
camera.keysUp = [87];
camera.keysDown = [83];
camera.keysLeft = [65];
camera.keysRight = [68];

// Collisions & gravity
scene.collisionsEnabled = true;
camera.applyGravity = true;
camera.checkCollisions = true;
camera.ellipsoid = new BABYLON.Vector3(0.75, 1.2, 0.75);

// Lights
const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
hemi.intensity = 0.6;
const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -2, -1), scene);
dir.position = new BABYLON.Vector3(20, 40, 20);
dir.intensity = 0.6;

// Materials
const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
wallMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.95);
const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
floorMat.diffuseColor = new BABYLON.Color3(0.8, 0.75, 0.7);

// Room
const roomSize = 16;
const wallThickness = 0.2;
const wallHeight = 3;

// Ground
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
ground.material = floorMat;
ground.checkCollisions = true;

// Walls
function createWall(name, width, height, depth, position, rotation) {
  const w = BABYLON.MeshBuilder.CreateBox(name, { width, height, depth }, scene);
  w.position = position;
  if (rotation) w.rotation = rotation;
  w.material = wallMat;
  w.checkCollisions = true;
  w.isPickable = false;
  return w;
}

createWall("backWall", roomSize, wallHeight, wallThickness, new BABYLON.Vector3(0, wallHeight / 2, roomSize / 2));

const doorWidth = 2;
const frontSideWidth = (roomSize - doorWidth) / 2;
createWall("frontLeft", frontSideWidth, wallHeight, wallThickness, new BABYLON.Vector3(-(doorWidth / 2 + frontSideWidth / 2), wallHeight / 2, -roomSize / 2));
createWall("frontRight", frontSideWidth, wallHeight, wallThickness, new BABYLON.Vector3((doorWidth / 2 + frontSideWidth / 2), wallHeight / 2, -roomSize / 2));
createWall("leftWall", wallThickness, wallHeight, roomSize, new BABYLON.Vector3(-roomSize / 2, wallHeight / 2, 0));
createWall("rightWall", wallThickness, wallHeight, roomSize, new BABYLON.Vector3(roomSize / 2, wallHeight / 2, 0));

// Door setup
const doorHinge = new BABYLON.TransformNode("doorHinge", scene);
doorHinge.position = new BABYLON.Vector3(-doorWidth / 2, 0, -roomSize / 2);
const doorMat = new BABYLON.StandardMaterial("doorMat", scene);
doorMat.diffuseColor = new BABYLON.Color3(0.55, 0.33, 0.07);
const door = BABYLON.MeshBuilder.CreateBox("door", { width: doorWidth, height: 3, depth: wallThickness }, scene);
door.parent = doorHinge;
door.position = new BABYLON.Vector3(doorWidth / 2, 1.5, 0);
door.material = doorMat;
door.checkCollisions = true;

const openOutward = -Math.PI / 2;
const openInward = Math.PI / 2;
let isDoorOpen = false;
let doorTargetAngle = 0;
let doorCurrentAngle = 0;

// Debug sphere
const debugMat = new BABYLON.StandardMaterial("debugMat", scene);
debugMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
const doorCenterSphere = BABYLON.MeshBuilder.CreateSphere("doorCenter", { diameter: 0.12 }, scene);
doorCenterSphere.position = new BABYLON.Vector3(0, 0.12, -roomSize / 2);
doorCenterSphere.material = debugMat;

// Camera initial pos
camera.position = new BABYLON.Vector3(0, 2.4, 6);
camera.setTarget(new BABYLON.Vector3(0, 1.6, -roomSize / 2));

// Center marker
const centerMarker = BABYLON.MeshBuilder.CreateBox("centerBox", { size: 0.2 }, scene);
centerMarker.position = new BABYLON.Vector3(0, 0.1, 0);
const markMat = new BABYLON.StandardMaterial("markMat", scene);
markMat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.9);
centerMarker.material = markMat;

// Thumbnail plane
const thumbPlane = BABYLON.MeshBuilder.CreatePlane("thumbPlane", { width: 3.6, height: 4.5 }, scene);
thumbPlane.position = new BABYLON.Vector3(0.5, 4.5 / 2, -roomSize / 1.5 - 2);
thumbPlane.rotation = new BABYLON.Vector3(Math.PI, 0, Math.PI);
const thumbMat = new BABYLON.StandardMaterial("thumbMat", scene);
thumbMat.diffuseTexture = new BABYLON.Texture("assets/cin.webp", scene);
thumbMat.backFaceCulling = false;
thumbPlane.material = thumbMat;

// Subtitle UI
const subtitle = document.createElement("div");
subtitle.className = "subtitle";
subtitle.innerText = "qapıya yaxınlaşma";
Object.assign(subtitle.style, {
  position: "absolute",
  left: "0",
  right: "0",
  bottom: "80px",
  textAlign: "center",
  fontSize: "22px",
  color: "#fff",
  textShadow: "0 2px 6px rgba(0,0,0,0.8)",
  opacity: "0",
  transition: "opacity 0.35s ease",
  background: "rgba(0,0,0,0.3)",
});
document.body.appendChild(subtitle);
requestAnimationFrame(() => {
  subtitle.style.opacity = "1";
  setTimeout(() => (subtitle.style.opacity = "0"), 8000);
});

// Render loop (door open logic)
let prevCamPos = camera.position.clone();

engine.runRenderLoop(() => {
  const doorCenter = new BABYLON.Vector3(0, 0, -roomSize / 2);
  const dx = camera.position.x - doorCenter.x;
  const dz = camera.position.z - doorCenter.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const moveVec = camera.position.subtract(prevCamPos);
  const moveLen = moveVec.length();

  if (!isDoorOpen && dist < 4.0) {
    let shouldOpenInward = moveLen > 0.02 ? moveVec.z > 0 : camera.position.z < doorCenter.z;
    doorTargetAngle = shouldOpenInward ? openOutward : openInward;
    isDoorOpen = true;
    doorSound.play().catch(() => {});
    subtitle.style.opacity = "1";
    setTimeout(() => (subtitle.style.opacity = "0"), 2500);
  } else if (isDoorOpen && dist > 5.0) {
    isDoorOpen = false;
    doorTargetAngle = 0;
  }

  doorCurrentAngle += (doorTargetAngle - doorCurrentAngle) * 0.15;
  doorHinge.rotation = new BABYLON.Vector3(0, doorCurrentAngle, 0);

  prevCamPos.copyFrom(camera.position);
  scene.render();
});

window.addEventListener("resize", () => engine.resize());

