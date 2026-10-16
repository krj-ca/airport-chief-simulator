
/* =========================================
   AIRPORT CHIEF & PILOT SIMULATOR
   File 6: src/aircraft.js
   Player aircraft model
   ========================================= */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createAircraft(scene) {
  const aircraft = new THREE.Group();
  aircraft.name = "PlayerAircraft";

  // Aircraft faces forward along the negative Z axis.
  aircraft.rotation.order = "YXZ";
  aircraft.position.set(0, 2, 390);

  scene.add(aircraft);

  /* ---------- Materials ---------- */

  const whitePaint = new THREE.MeshStandardMaterial({
    color: 0xf1f5fa,
    metalness: 0.18,
    roughness: 0.38
  });

  const bluePaint = new THREE.MeshStandardMaterial({
    color: 0x1267b0,
    metalness: 0.22,
    roughness: 0.36
  });

  const darkPaint = new THREE.MeshStandardMaterial({
    color: 0x202a35,
    metalness: 0.2,
    roughness: 0.42
  });

  const glass = new THREE.MeshStandardMaterial({
    color: 0x65c6ed,
    metalness: 0.25,
    roughness: 0.18
  });

  const rubber = new THREE.MeshStandardMaterial({
    color: 0x16191d,
    roughness: 0.95
  });

  const metal = new THREE.MeshStandardMaterial({
    color: 0x929da8,
    metalness: 0.8,
    roughness: 0.25
  });

  const engineInterior = new THREE.MeshStandardMaterial({
    color: 0x080c12,
    metalness: 0.35,
    roughness: 0.6
  });

  const red = new THREE.MeshStandardMaterial({
    color: 0xff3d4f,
    emissive: 0x330008
  });

  const green = new THREE.MeshStandardMaterial({
    color: 0x38ff98,
    emissive: 0x063b1b
  });

  /* ---------- Geometry helper ---------- */

  function addMesh(
    name,
    geometry,
    material,
    x = 0,
    y = 0,
    z = 0,
    castShadow = true
  ) {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;

    aircraft.add(mesh);
    return mesh;
  }

  function addBox(
    name,
    width,
    height,
    depth,
    x,
    y,
    z,
    material
  ) {
    return addMesh(
      name,
      new THREE.BoxGeometry(width, height, depth),
      material,
      x,
      y,
      z
    );
  }

  function addCylinder(
    name,
    radius,
    length,
    x,
    y,
    z,
    material,
    rotationX = Math.PI / 2
  ) {
    return addMesh(
      name,
      new THREE.CylinderGeometry(
        radius,
        radius,
        length,
        20
      ),
      material,
      x,
      y,
      z
    ).setRotationFromEuler(
      new THREE.Euler(rotationX, 0, 0)
    );
  }

  /* ---------- Main fuselage ---------- */

  // The aircraft body is long and narrow.
  const fuselage = addMesh(
    "Fuselage",
    new THREE.CylinderGeometry(
      2.1,
      2.5,
      28,
      16,
      1,
      false
    ),
    whitePaint,
    0,
    0,
    0
  );

  // Rotate the cylinder to align it with the aircraft.
  fuselage.rotation.x = Math.PI / 2;

  // Rounded nose.
  const nose = addMesh(
    "AircraftNose",
    new THREE.SphereGeometry(
      2.05,
      20,
      14
    ),
    whitePaint,
    0,
    0,
    -14
  );

  nose.scale.set(0.95, 0.85, 1.3);

  // Rear body taper.
  const rear = addMesh(
    "RearFuselage",
    new THREE.ConeGeometry(
      2.05,
      5,
      16
    ),
    whitePaint,
    0,
    0,
    15
  );

  rear.rotation.x = -Math.PI / 2;

  /* ---------- Blue lower fuselage stripe ---------- */

  const stripe = addMesh(
    "FuselageBlueStripe",
    new THREE.CylinderGeometry(
      2.15,
      2.4,
      25,
      16,
      1,
      false,
      Math.PI * 0.15,
      Math.PI * 0.7
    ),
    bluePaint,
    0,
    -0.65,
    0
  );

  stripe.rotation.x = Math.PI / 2;

  /* ---------- Main wings ---------- */

  const wingShape = new THREE.Shape();

  wingShape.moveTo(-18, 0);
  wingShape.lineTo(18, 0);
  wingShape.lineTo(15, 2.6);
  wingShape.lineTo(-15, 2.6);
  wingShape.closePath();

  const wingGeometry = new THREE.ExtrudeGeometry(
    wingShape,
    {
      depth: 0.55,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.08
    }
  );

  const wings = addMesh(
    "MainWings",
    wingGeometry,
    whitePaint,
    0,
    -0.15,
    -1.5
  );

  // Shape coordinates form the horizontal span.
  wings.rotation.x = Math.PI / 2;

  /* ---------- Wing tips ---------- */

  const leftWingTip = addMesh(
    "LeftWingTip",
    new THREE.BoxGeometry(1.5, 0.8, 3),
    bluePaint,
    -17.4,
    0,
    -0.1
  );

  leftWingTip.rotation.z = -0.18;

  const rightWingTip = addMesh(
    "RightWingTip",
    new THREE.BoxGeometry(1.5, 0.8, 3),
    bluePaint,
    17.4,
    0,
    -0.1
  );

  rightWingTip.rotation.z = 0.18;

  /* ---------- Horizontal tail ---------- */

  const tailShape = new THREE.Shape();

  tailShape.moveTo(-6, 0);
  tailShape.lineTo(6, 0);
  tailShape.lineTo(4.5, 1.4);
  tailShape.lineTo(-4.5, 1.4);
  tailShape.closePath();

  const tailGeometry = new THREE.ExtrudeGeometry(
    tailShape,
    {
      depth: 0.35,
      bevelEnabled: false
    }
  );

  const tail = addMesh(
    "HorizontalTail",
    tailGeometry,
    whitePaint,
    0,
    0.7,
    12
  );

  tail.rotation.x = Math.PI / 2;

  /* ---------- Vertical tail fin ---------- */

  const finShape = new THREE.Shape();

  finShape.moveTo(0, 0);
  finShape.lineTo(0, 5.5);
  finShape.lineTo(3.2, 5.5);
  finShape.lineTo(2.1, 0);
  finShape.closePath();

  const finGeometry = new THREE.ExtrudeGeometry(
    finShape,
    {
      depth: 0.45,
      bevelEnabled: false
    }
  );

  const fin = addMesh(
    "VerticalTailFin",
    finGeometry,
    bluePaint,
    0,
    0.5,
    12
  );

  fin.rotation.y = Math.PI / 2;

  /* ---------- Cockpit windows ---------- */

  const windshieldLeft = addMesh(
    "CockpitWindowLeft",
    new THREE.BoxGeometry(1.1, 0.85, 0.18),
    glass,
    -0.72,
    1.15,
    -13.1
  );

  windshieldLeft.rotation.y = -0.18;
  windshieldLeft.rotation.x = -0.18;

  const windshieldRight = addMesh(
    "CockpitWindowRight",
    new THREE.BoxGeometry(1.1, 0.85, 0.18),
    glass,
    0.72,
    1.15,
    -13.1
  );

  windshieldRight.rotation.y = 0.18;
  windshieldRight.rotation.x = -0.18;

  /* ---------- Passenger windows ---------- */

  for (let side of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const z = -9 + i * 1.65;

      const windowMesh = addMesh(
        "PassengerWindow",
        new THREE.SphereGeometry(
          0.24,
          8,
          6
        ),
        glass,
        side * 2.02,
        0.65,
        z,
        false
      );

      windowMesh.scale.set(0.25, 1, 1.25);
    }
  }

  /* ---------- Engines ---------- */

  const engines = [];

  for (const side of [-1, 1]) {
    const engineX = side * 8.5;
    const engineZ = 1.5;

    const engine = addMesh(
      side < 0 ? "LeftEngine" : "RightEngine",
      new THREE.CylinderGeometry(
        1.25,
        1.35,
        5,
        20
      ),
      whitePaint,
      engineX,
      -1.15,
      engineZ
    );

    engine.rotation.x = Math.PI / 2;
    engines.push(engine);

    // Dark intake ring.
    const intake = addMesh(
      "EngineIntake",
      new THREE.TorusGeometry(
        1.02,
        0.16,
        8,
        20
      ),
      metal,
      engineX,
      -1.15,
      engineZ - 2.5
    );

    intake.rotation.x = Math.PI / 2;

    // Dark fan opening.
    addMesh(
      "EngineOpening",
      new THREE.CircleGeometry(0.94, 20),
      engineInterior,
      engineX,
      -1.15,
      engineZ - 2.57,
      false
    );
  }

  /* ---------- Landing gear ---------- */

  const landingGear = new THREE.Group();
  landingGear.name = "LandingGear";
  aircraft.add(landingGear);

  function addLandingWheel(x, y, z, size) {
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12,
        0.16,
        1.25,
        8
      ),
      metal
    );

    strut.position.set(x, y + 0.55, z);
    landingGear.add(strut);

    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(
        size,
        size,
        0.42,
        16
      ),
      rubber
    );

    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;

    landingGear.add(wheel);
  }

  // Nose wheel.
  addLandingWheel(0, -2.5, -10.5, 0.65);

  // Main wheels.
  addLandingWheel(-3.2, -2.5, 3, 0.85);
  addLandingWheel(3.2, -2.5, 3, 0.85);

  /* ---------- Navigation lights ---------- */

  const leftLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 8),
    red
  );

  leftLight.position.set(-18, 0.3, -0.1);
  aircraft.add(leftLight);

  const rightLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 8),
    green
  );

  rightLight.position.set(18, 0.3, -0.1);
  aircraft.add(rightLight);

  /* ---------- Aircraft state ---------- */

  aircraft.userData = {
    speed: 0,
    altitude: 2,
    heading: 0,
    throttle: 0,
    verticalSpeed: 0,
    pitch: 0,
    roll: 0,
    engineOn: false,
    gearDown: true,
    brakesOn: true,
    maxSpeed: 250,
    engines,
    landingGear,
    initialPosition: aircraft.position.clone()
  };

  aircraft.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  /* ---------- Public aircraft methods ---------- */

  aircraft.setGearDown = function (isDown) {
    landingGear.visible = isDown;
    aircraft.userData.gearDown = isDown;
  };

  aircraft.setThrottle = function (value) {
    aircraft.userData.throttle = THREE.MathUtils.clamp(
      Number(value) || 0,
      0,
      100
    );
  };

  aircraft.setEngine = function (isOn) {
    aircraft.userData.engineOn = Boolean(isOn);
  };

  aircraft.resetAircraft = function () {
    aircraft.position.copy(
      aircraft.userData.initialPosition
    );

    aircraft.rotation.set(0, 0, 0);

    aircraft.userData.speed = 0;
    aircraft.userData.altitude = 2;
    aircraft.userData.heading = 0;
    aircraft.userData.throttle = 0;
    aircraft.userData.verticalSpeed = 0;
    aircraft.userData.pitch = 0;
    aircraft.userData.roll = 0;
    aircraft.userData.engineOn = false;
    aircraft.userData.gearDown = true;
    aircraft.userData.brakesOn = true;

    landingGear.visible = true;
  };

  aircraft.dispose = function () {
    scene.remove(aircraft);

    aircraft.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose();
      }
    });

    const materialsToDispose = [
      whitePaint,
      bluePaint,
      darkPaint,
      glass,
      rubber,
      metal,
      engineInterior,
      red,
      green
    ];

    for (const material of materialsToDispose) {
      material.dispose();
    }
  };

  return aircraft;
    }
      
