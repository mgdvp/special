// FULL CLEANED / FIXED BABYLON JS SCENE
// Requires <script src="https://cdn.babylonjs.com/babylon.js"></script>

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
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

// --- Virtual joystick (unchanged) ---
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
  rect = joystick.getBoundingClientRect();
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

let joystickSoundPlayed = false;

const joystickSound = new Audio("assets/sound.mp3");
joystickSound.preload = "auto";
joystickSound.volume = 0.8;
const doorSound = new Audio("assets/menenazzarafateliyin.mp3");
doorSound.preload = "auto";
doorSound.volume = 1;

joystick.addEventListener('touchstart', (e) => {
  handlePointer(e.touches[0].clientX, e.touches[0].clientY);
  if (!joystickSoundPlayed) { joystickSound.play().catch(()=>{}); joystickSoundPlayed = true; }
  e.preventDefault();
});
joystick.addEventListener('touchmove', (e) => { handlePointer(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); });
joystick.addEventListener('touchend', (e) => { releaseJoystick(); e.preventDefault(); });

joystick.addEventListener('pointerdown', (e) => { handlePointer(e.clientX, e.clientY); joystick.setPointerCapture && joystick.setPointerCapture(e.pointerId); if (!joystickSoundPlayed) { joystickSound.play().catch(()=>{}); joystickSoundPlayed = true; } });
joystick.addEventListener('pointermove', (e) => { if (e.buttons) handlePointer(e.clientX, e.clientY); });
joystick.addEventListener('pointerup', (e) => { releaseJoystick(); try { joystick.releasePointerCapture(e.pointerId); } catch {} });

// Pointer lock
canvas.addEventListener("click", () => {
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
});

// WASD movement keys (for built-in camera controls)
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

// Walls helper
function createWall(name, width, height, depth, position, rotation) {
  const w = BABYLON.MeshBuilder.CreateBox(name, { width, height, depth }, scene);
  w.position = position;
  if (rotation) w.rotation = rotation;
  w.material = wallMat;
  w.checkCollisions = true;
  w.isPickable = false;
  return w;
}

// Front/back/side walls
createWall("backWall", roomSize, wallHeight, wallThickness, new BABYLON.Vector3(0, wallHeight / 2, roomSize / 2));
// --- SINGLE FRONT WALL WITH TWO DOOR HOLES (CSG) ---
const frontWall = BABYLON.MeshBuilder.CreateBox("frontWall", {
    width: roomSize,
    height: wallHeight,
    depth: wallThickness
}, scene);

frontWall.position = new BABYLON.Vector3(0, wallHeight / 2, -roomSize / 2);
frontWall.material = wallMat;

// DOOR SIZES
const doorWidth = 2;
const doorWidthCSG = 2;
const doorHeightCSG = 3;
const doorThicknessCSG = wallThickness * 2;

// DOOR 1 hole
const doorHole1 = BABYLON.MeshBuilder.CreateBox("doorHole1", {
    width: doorWidthCSG,
    height: doorHeightCSG,
    depth: doorThicknessCSG
}, scene);
doorHole1.position = new BABYLON.Vector3(-doorWidthCSG, doorHeightCSG / 2, -roomSize / 2);

// DOOR 2 hole
const doorHole2 = BABYLON.MeshBuilder.CreateBox("doorHole2", {
    width: doorWidthCSG,
    height: doorHeightCSG,
    depth: doorThicknessCSG
}, scene);
doorHole2.position = new BABYLON.Vector3(doorWidthCSG + 2, doorHeightCSG / 2, -roomSize / 2);

// Run CSG
const wallCSG = BABYLON.CSG.FromMesh(frontWall);
const holeCSG1 = BABYLON.CSG.FromMesh(doorHole1);
const holeCSG2 = BABYLON.CSG.FromMesh(doorHole2);

const finalWall = wallCSG.subtract(holeCSG1).subtract(holeCSG2).toMesh("finalWall", wallMat, scene);

frontWall.dispose();
doorHole1.dispose();
doorHole2.dispose();

finalWall.checkCollisions = true;
finalWall.isPickable = false;

createWall("leftWall", wallThickness, wallHeight, roomSize, new BABYLON.Vector3(-roomSize / 2, wallHeight / 2, 0));
createWall("rightWall", wallThickness, wallHeight, roomSize, new BABYLON.Vector3(roomSize / 2, wallHeight / 2, 0));

// Door defaults
const openOutward = -Math.PI / 2;
const openInward = Math.PI / 2;

// ---------- DOOR 1 (original) ----------
const doorHinge = new BABYLON.TransformNode("doorHinge", scene);
doorHinge.position = new BABYLON.Vector3(-doorWidth / 2, 0, -roomSize / 2);

// create door and offset slightly forward (Z) to avoid Z-fighting with wall
const door = BABYLON.MeshBuilder.CreateBox("door", { width: doorWidth, height: 3, depth: wallThickness }, scene);
door.parent = doorHinge;
door.position = new BABYLON.Vector3(doorWidth / 2, 1.5, 0.01); // small offset
const doorMat = new BABYLON.StandardMaterial("doorMat", scene);
doorMat.diffuseColor = new BABYLON.Color3(0.55, 0.33, 0.07);
door.material = doorMat;
door.checkCollisions = true;

// door1 state
let isDoorOpen = false;
let doorTargetAngle = 0;
let doorCurrentAngle = 0;

// debug sphere for door 1 center (optional)
const debugMat = new BABYLON.StandardMaterial("debugMat", scene);
debugMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
const doorCenterSphere = BABYLON.MeshBuilder.CreateSphere("doorCenter", { diameter: 0.12 }, scene);
doorCenterSphere.position = new BABYLON.Vector3(0, 0.12, -roomSize / 2);
doorCenterSphere.material = debugMat;

// Camera initial pos
camera.position = new BABYLON.Vector3(0, 2.4, 6);
camera.setTarget(new BABYLON.Vector3(0, 1.6, -roomSize / 2));

// center marker
const centerMarker = BABYLON.MeshBuilder.CreateBox("centerBox", { size: 0.2 }, scene);
centerMarker.position = new BABYLON.Vector3(0, 0.1, 0);
const markMat = new BABYLON.StandardMaterial("markMat", scene);
markMat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.9);
centerMarker.material = markMat;

// thumbnail plane (first)
const thumbPlane = BABYLON.MeshBuilder.CreatePlane("thumbPlane", { width: 3.6, height: 4.5 }, scene);
thumbPlane.position = new BABYLON.Vector3(0.5, 4.5 / 2, -roomSize / 1.5 - 2);
thumbPlane.rotation = new BABYLON.Vector3(Math.PI, 0, Math.PI);
const thumbMat = new BABYLON.StandardMaterial("thumbMat", scene);
thumbMat.diffuseTexture = new BABYLON.Texture("assets/cin.webp", scene);
thumbMat.backFaceCulling = false;
thumbPlane.material = thumbMat;

// ---------- DOOR 2 (same room, right of door1) ----------
const secondDoorOffset = 4; // change to negative to put left

const door2Hinge = new BABYLON.TransformNode("door2Hinge", scene);
door2Hinge.position = new BABYLON.Vector3(-doorWidth / 2 + secondDoorOffset, 0, -roomSize / 2);

// create door2 once and offset slightly to avoid z-fighting
const door2 = BABYLON.MeshBuilder.CreateBox("door2", { width: doorWidth, height: 3, depth: wallThickness }, scene);
door2.parent = door2Hinge;
door2.position = new BABYLON.Vector3(doorWidth / 2, 1.5, 0.01); // small offset in z
door2.material = doorMat.clone("door2Mat");
door2.checkCollisions = true;

// door2 state (separate variables)
let isDoor2Open = false;
let door2TargetAngle = 0;
let door2CurrentAngle = 0;

// thumbnail for door2 (use your uploaded image path if you want)
const thumbPlane2 = BABYLON.MeshBuilder.CreatePlane("thumbPlane2", { width: 3.6, height: 4.5 }, scene);
thumbPlane2.position = new BABYLON.Vector3(secondDoorOffset + 1, 4.5 / 2, -roomSize / 1.5 - 2);
thumbPlane2.rotation = new BABYLON.Vector3(Math.PI, 0, Math.PI);

// Use either your asset file or the uploaded image path.
// Uploaded image path (you provided) - system will transform path to URL when needed:
const uploadedImagePath = "/mnt/data/ec06baca-2890-4031-85e7-4d4b79245261.png";

// prefer local asset if exists, otherwise use uploadedImagePath
const thumbMat2 = new BABYLON.StandardMaterial("thumbMat2", scene);
thumbMat2.diffuseTexture = new BABYLON.Texture("assets/cin2.webp", scene); // fallback
// If you want to use the uploaded image, uncomment the next line:
// thumbMat2.diffuseTexture = new BABYLON.Texture(uploadedImagePath, scene);
thumbMat2.backFaceCulling = false;
thumbPlane2.material = thumbMat2;

// subtitle UI (unchanged)
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

// prevCamPos for motion detection (used for door open direction)
let prevCamPos = camera.position.clone();

// SINGLE render loop: movement + door logic + render
engine.runRenderLoop(() => {
  const dt = engine.getDeltaTime() / 1000; // seconds

  // --- camera movement from joystick (kept minimal) ---
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

  // compute move vector for this frame
  const moveVec = camera.position.subtract(prevCamPos);
  const moveLen = moveVec.length();

  // --- DOOR 1 logic ---
  const doorCenter = new BABYLON.Vector3(0, 0, -roomSize / 2);
  const dx1 = camera.position.x - doorCenter.x;
  const dz1 = camera.position.z - doorCenter.z;
  const dist1 = Math.sqrt(dx1 * dx1 + dz1 * dz1);

  if (!isDoorOpen && dist1 < 4.0) {
    let shouldOpenInward = moveLen > 0.02 ? moveVec.z > 0 : camera.position.z < doorCenter.z;
    doorTargetAngle = shouldOpenInward ? openOutward : openInward;
    isDoorOpen = true;
    doorSound.play().catch(()=>{});
    subtitle.style.opacity = "1";
    setTimeout(() => (subtitle.style.opacity = "0"), 2500);
  } else if (isDoorOpen && dist1 > 5.0) {
    isDoorOpen = false;
    doorTargetAngle = 0;
  }

  doorCurrentAngle += (doorTargetAngle - doorCurrentAngle) * 0.15;
  doorHinge.rotation.y = doorCurrentAngle;

  // --- DOOR 2 logic (independent) ---
  const doorCenter2 = new BABYLON.Vector3(secondDoorOffset, 0, -roomSize / 2);
  const dx2 = camera.position.x - doorCenter2.x;
  const dz2 = camera.position.z - doorCenter2.z;
  const dist2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);

  if (!isDoor2Open && dist2 < 4.0) {
    let shouldOpenInward2 = moveLen > 0.02 ? moveVec.z > 0 : camera.position.z < doorCenter2.z;
    door2TargetAngle = shouldOpenInward2 ? openOutward : openInward;
    isDoor2Open = true;
    doorSound.play().catch(()=>{});
    // optional subtitle for second door:
    subtitle.style.opacity = "1";
    setTimeout(() => (subtitle.style.opacity = "0"), 2500);
  } else if (isDoor2Open && dist2 > 5.0) {
    isDoor2Open = false;
    door2TargetAngle = 0;
  }

  door2CurrentAngle += (door2TargetAngle - door2CurrentAngle) * 0.15;
  door2Hinge.rotation.y = door2CurrentAngle;

  // update prevCamPos for next frame
  prevCamPos.copyFrom(camera.position);

  // finally render
  scene.render();
});

// handle resize
window.addEventListener("resize", () => engine.resize());


