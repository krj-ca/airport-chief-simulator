
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createCamera(scene, aircraft) {
  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    15000
  );

  camera.position.set(0, 8, 410);
  camera.lookAt(aircraft.position);

  const cameraModes = ["chase", "cockpit", "external"];
  let modeIndex = 0;

  const desiredPosition = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3(1, 0, 0);
  const cockpitOffset = new THREE.Vector3(0, 1.4, -1.2);

  function getMode() {
    return cameraModes[modeIndex];
  }

  function nextMode() {
    modeIndex = (modeIndex + 1) % cameraModes.length;
    return getMode();
  }

  function setMode(mode) {
    const index = cameraModes.indexOf(mode);

    if (index !== -1) {
      modeIndex = index;
    }
  }

  function update(delta = 1 / 60) {
    const position = aircraft.position;
    const rotation = aircraft.rotation;
    const mode = getMode();

    // Aircraft forward direction; its nose points toward -Z.
    forward.set(0, 0, -1).applyQuaternion(
      aircraft.quaternion
    ).normalize();

    right.set(1, 0, 0).applyQuaternion(
      aircraft.quaternion
    ).normalize();

    if (mode === "cockpit") {
      // Camera close to the pilot's position.
      const offset = cockpitOffset
        .clone()
        .applyQuaternion(aircraft.quaternion);

      desiredPosition.copy(position).add(offset);

      desiredLookAt
        .copy(position)
        .add(forward.clone().multiplyScalar(100));

      desiredLookAt.y += 0.2;
    } else if (mode === "external") {
      // Wider view from the side and above.
      desiredPosition
        .copy(position)
        .add(right.clone().multiplyScalar(32))
        .add(up.clone().multiplyScalar(24))
        .add(forward.clone().multiplyScalar(-35));

      desiredLookAt.copy(position);
    } else {
      // Smooth chase camera behind and above the aircraft.
      desiredPosition
        .copy(position)
        .add(forward.clone().multiplyScalar(-18))
        .add(up.clone().multiplyScalar(7));

      desiredLookAt
        .copy(position)
        .add(forward.clone().multiplyScalar(20));

      desiredLookAt.y += 1.5;
    }

    // Smoothly follow the aircraft without sudden camera jumps.
    const smoothing = 1 - Math.exp(
      -Math.max(0, delta) * 4.5
    );

    camera.position.lerp(desiredPosition, smoothing);

    // Look toward the target while respecting aircraft orientation.
    const targetQuaternion = new THREE.Quaternion();

    const direction = desiredLookAt
      .clone()
      .sub(camera.position)
      .normalize();

    if (direction.lengthSq() > 0.0001) {
      targetQuaternion.setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          camera.position,
          desiredLookAt,
          up
        )
      );

      camera.quaternion.slerp(
        targetQuaternion,
        smoothing
      );
    }

    camera.updateProjectionMatrix();
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);

  return {
    camera,
    update,
    getMode,
    nextMode,
    setMode,
    resize,
    dispose() {
      window.removeEventListener("resize", resize);
    }
  };
             }
        
