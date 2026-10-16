
/* =========================================
   AIRPORT CHIEF & PILOT SIMULATOR
   File 7: src/flightPhysics.js
   Aircraft movement and flight physics
   ========================================= */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const DEG = Math.PI / 180;

const PHYSICS = {
  maxSpeed: 250,          // Approximate game speed in knots
  acceleration: 9,        // Speed increase per second
  braking: 22,             // Ground braking strength
  airDrag: 0.018,
  groundFriction: 0.8,
  taxiSpeed: 25,
  rotationSpeed: 38,       // Pitch degrees per second
  rollSpeed: 55,           // Roll degrees per second
  yawSpeed: 24,            // Heading degrees per second
  climbRate: 24,           // Game altitude units per second
  descentRate: 20,
  stallSpeed: 65,
  takeoffSpeed: 95,
  landingSpeed: 80,
  groundHeight: 2
};

const clamp = THREE.MathUtils.clamp;

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

/* ---------- Main flight update ---------- */

export function updateFlightPhysics(
  aircraft,
  input = {},
  gameState = {},
  delta = 1 / 60
) {
  if (!aircraft) return;

  const dt = clamp(Number(delta) || 0, 0, 0.05);
  const state = aircraft.userData;

  if (!state || dt <= 0) return;

  // Read controls safely.
  const throttleInput = clamp(
    Number(gameState.throttle ?? state.throttle ?? 0),
    0,
    100
  );

  const pitchInput = clamp(Number(input.pitch) || 0, -1, 1);
  const rollInput = clamp(Number(input.roll) || 0, -1, 1);
  const yawInput = clamp(Number(input.yaw) || 0, -1, 1);

  const engineOn = Boolean(gameState.engineOn ?? state.engineOn);
  const brakesOn = Boolean(gameState.brakesOn ?? state.brakesOn);
  const gearDown = Boolean(gameState.gearDown ?? state.gearDown);

  // Keep both game state and aircraft state synchronized.
  state.throttle = throttleInput;
  state.engineOn = engineOn;
  state.brakesOn = brakesOn;
  state.gearDown = gearDown;

  /* ---------- Engine and speed ---------- */

  let targetSpeed = engineOn
    ? (throttleInput / 100) * PHYSICS.maxSpeed
    : 0;

  if (gearDown && state.altitude > PHYSICS.groundHeight + 1) {
    // Landing gear creates a small drag penalty in the air.
    targetSpeed *= 0.94;
  }

  if (brakesOn) {
    targetSpeed = 0;
  }

  const acceleration = brakesOn
    ? PHYSICS.braking
    : engineOn
      ? PHYSICS.acceleration
      : PHYSICS.braking * 0.35;

  state.speed = moveTowards(
    Math.max(0, Number(state.speed) || 0),
    targetSpeed,
    acceleration * dt
  );

  // Mild aerodynamic drag.
  if (!brakesOn && state.speed > 0 && state.speed > targetSpeed) {
    state.speed = Math.max(
      targetSpeed,
      state.speed - PHYSICS.airDrag * state.speed * dt
    );
  }

  /* ---------- Aircraft attitude ---------- */

  const targetRoll = -rollInput * 35;

  state.roll = moveTowards(
    Number(state.roll) || 0,
    targetRoll,
    PHYSICS.rollSpeed * dt
  );

  const targetPitch = pitchInput * 18;

  state.pitch = moveTowards(
    Number(state.pitch) || 0,
    targetPitch,
    PHYSICS.rotationSpeed * dt
  );

  // Turning is stronger while airborne and when the aircraft is banked.
  const airborne =
    state.altitude > PHYSICS.groundHeight + 0.5;

  const bankTurn = airborne
    ? Math.sin(state.roll * DEG) * 65
    : 0;

  const turnRate = yawInput * PHYSICS.yawSpeed + bankTurn;

  state.heading = (
    (Number(state.heading) || 0) + turnRate * dt + 360
  ) % 360;

  /* ---------- Takeoff and landing ---------- */

  const altitude = Number(state.altitude) || PHYSICS.groundHeight;
  const onGround = altitude <= PHYSICS.groundHeight + 0.01;

  if (onGround) {
    state.altitude = PHYSICS.groundHeight;
    state.verticalSpeed = 0;

    // Rotate the nose upward only when sufficient speed is available.
    if (
      state.speed >= PHYSICS.takeoffSpeed &&
      pitchInput > 0 &&
      !brakesOn
    ) {
      state.verticalSpeed = Math.min(
        pitchInput * PHYSICS.climbRate,
        PHYSICS.climbRate
      );
    }
  } else {
    // Low speed reduces the ability to climb.
    const speedFactor = clamp(
      state.speed / PHYSICS.stallSpeed,
      0,
      1.2
    );

    state.verticalSpeed = state.pitch >= 0
      ? (state.pitch / 18) * PHYSICS.climbRate * speedFactor
      : (state.pitch / 18) * PHYSICS.descentRate;

    // A simple game-style stall response.
    if (state.speed < PHYSICS.stallSpeed) {
      state.verticalSpeed = Math.min(
        state.verticalSpeed,
        -3
      );
    }

    state.altitude += state.verticalSpeed * dt;

    if (state.altitude <= PHYSICS.groundHeight) {
      state.altitude = PHYSICS.groundHeight;
      state.verticalSpeed = 0;
      state.pitch = 0;
      state.roll *= 0.5;

      if (state.speed < PHYSICS.landingSpeed) {
        state.brakesOn = true;
        gameState.brakesOn = true;
      }
    }
  }

  /* ---------- Position and movement ---------- */

  // Convert game speed into world movement units.
  const worldSpeed = state.speed * 0.18;

  const headingRadians = state.heading * DEG;

  const forwardX = -Math.sin(headingRadians);
  const forwardZ = -Math.cos(headingRadians);

  // Prevent the aircraft from rolling over on the ground.
  if (onGround && state.speed < PHYSICS.takeoffSpeed) {
    state.roll = moveTowards(state.roll, 0, PHYSICS.rollSpeed * dt);
  }

  aircraft.position.x += forwardX * worldSpeed * dt;
  aircraft.position.z += forwardZ * worldSpeed * dt;
  aircraft.position.y = state.altitude;

  /* ---------- Apply aircraft orientation ---------- */

  // The model faces -Z at heading 0.
  aircraft.rotation.order = "YXZ";
  aircraft.rotation.y = state.heading * DEG;
  aircraft.rotation.x = -state.pitch * DEG;
  aircraft.rotation.z = -state.roll * DEG;

  /* ---------- Publish useful telemetry ---------- */

  state.onGround =
    state.altitude <= PHYSICS.groundHeight + 0.01;

  state.verticalSpeed = Number(state.verticalSpeed) || 0;

  state.telemetry = {
    speed: Math.round(state.speed),
    altitude: Math.round(state.altitude),
    heading: Math.round(state.heading),
    throttle: Math.round(state.throttle),
    verticalSpeed: Math.round(state.verticalSpeed),
    onGround: state.onGround,
    gearDown: state.gearDown,
    engineOn: state.engineOn,
    brakesOn: state.brakesOn
  };

  // Make the latest telemetry available to the HUD.
  gameState.speed = state.telemetry.speed;
  gameState.altitude = state.telemetry.altitude;
  gameState.heading = state.telemetry.heading;
  gameState.verticalSpeed = state.telemetry.verticalSpeed;
  gameState.onGround = state.telemetry.onGround;
}

/* ---------- Physics settings ---------- */

export function getFlightPhysicsSettings() {
  return { ...PHYSICS };
}

export function resetFlightPhysics(aircraft) {
  if (!aircraft?.userData) return;

  const state = aircraft.userData;

  state.speed = 0;
  state.altitude = PHYSICS.groundHeight;
  state.heading = 0;
  state.throttle = 0;
  state.verticalSpeed = 0;
  state.pitch = 0;
  state.roll = 0;
  state.engineOn = false;
  state.gearDown = true;
  state.brakesOn = true;
  state.onGround = true;

  aircraft.position.set(0, PHYSICS.groundHeight, 390);
  aircraft.rotation.set(0, 0, 0);
}
