
/* =========================================
   AIRPORT CHIEF & PILOT SIMULATOR
   File 4: src/scene.js
   Three.js 3D world and renderer
   ========================================= */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* ---------- Create the scene ---------- */

export function createScene(container) {
  if (!container) {
    throw new Error("3D world container was not found.");
  }

  const scene = new THREE.Scene();

  // Sky color and atmospheric haze.
  scene.background = new THREE.Color(0x87bce3);
  scene.fog = new THREE.Fog(0x9fc8e5, 500, 5000);

  // A large perspective camera is created by camera.js.
  // The scene module owns the renderer and scene only.

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.5)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.domElement.setAttribute(
    "aria-label",
    "Three-dimensional airport game view"
  );

  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  // Replace an old canvas if the scene is initialized again.
  const oldCanvas = container.querySelector("canvas");

  if (oldCanvas) {
    oldCanvas.remove();
  }

  container.appendChild(renderer.domElement);

  /* ---------- Lighting ---------- */

  // Soft light from the sky.
  const skyLight = new THREE.HemisphereLight(
    0xd9edff,
    0x596b45,
    2.0
  );

  scene.add(skyLight);

  // Main sunlight.
  const sunlight = new THREE.DirectionalLight(
    0xfff0d2,
    3.0
  );

  sunlight.position.set(-250, 400, 180);

  sunlight.castShadow = true;

  sunlight.shadow.mapSize.set(1024, 1024);

  sunlight.shadow.camera.left = -500;
  sunlight.shadow.camera.right = 500;
  sunlight.shadow.camera.top = 500;
  sunlight.shadow.camera.bottom = -500;

  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 1200;

  sunlight.shadow.bias = -0.0002;
  sunlight.shadow.normalBias = 0.03;

  scene.add(sunlight);

  // Gentle fill light to soften dark areas.
  const fillLight = new THREE.DirectionalLight(
    0x9ccfff,
    0.65
  );

  fillLight.position.set(250, 120, -250);
  scene.add(fillLight);

  /* ---------- World reference groups ---------- */

  const world = new THREE.Group();
  world.name = "AirportWorld";
  scene.add(world);

  const airportGroup = new THREE.Group();
  airportGroup.name = "AirportObjects";
  world.add(airportGroup);

  const aircraftGroup = new THREE.Group();
  aircraftGroup.name = "AircraftObjects";
  world.add(aircraftGroup);

  /* ---------- Reusable materials ---------- */

  const materials = {
    grass: new THREE.MeshStandardMaterial({
      color: 0x659653,
      roughness: 1
    }),

    runway: new THREE.MeshStandardMaterial({
      color: 0x343b43,
      roughness: 0.92
    }),

    concrete: new THREE.MeshStandardMaterial({
      color: 0x929ba3,
      roughness: 0.88
    }),

    white: new THREE.MeshStandardMaterial({
      color: 0xf3f5f7,
      roughness: 0.62
    }),

    yellow: new THREE.MeshStandardMaterial({
      color: 0xffc928,
      roughness: 0.7
    }),

    glass: new THREE.MeshStandardMaterial({
      color: 0x4faccd,
      roughness: 0.22,
      metalness: 0.1
    }),

    dark: new THREE.MeshStandardMaterial({
      color: 0x202b37,
      roughness: 0.82
    })
  };

  /* ---------- Ground ---------- */

  const groundGeometry = new THREE.PlaneGeometry(
    10000,
    10000
  );

  const ground = new THREE.Mesh(
    groundGeometry,
    materials.grass
  );

  ground.name = "WorldGround";
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  ground.receiveShadow = true;

  world.add(ground);

  /* ---------- Distant terrain ---------- */

  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x708f75,
    roughness: 1,
    flatShading: true
  });

  const terrainPositions = [
    [-1800, -400, -1800, 280],
    [1600, -500, -2200, 350],
    [-2200, -350, 1400, 240],
    [2100, -600, 1600, 420],
    [0, -800, -2600, 320]
  ];

  const terrainGroup = new THREE.Group();
  terrainGroup.name = "DistantTerrain";

  for (let i = 0; i < terrainPositions.length; i++) {
    const [x, z, unused, height] = terrainPositions[i];

    const geometry = new THREE.ConeGeometry(
      height * 1.5,
      height * 2.2,
      7
    );

    const mountain = new THREE.Mesh(
      geometry,
      terrainMaterial
    );

    mountain.position.set(
      x,
      height * 0.75 - 10,
      z + unused
    );

    mountain.rotation.y = i * 0.7;
    mountain.receiveShadow = true;
    mountain.castShadow = true;

    terrainGroup.add(mountain);
  }

  world.add(terrainGroup);

  /* ---------- Sun ---------- */

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(45, 20, 16),
    new THREE.MeshBasicMaterial({
      color: 0xfff0bd
    })
  );

  sun.name = "Sun";
  sun.position.set(-1800, 1100, -3200);
  scene.add(sun);

  /* ---------- Resize handling ---------- */

  function resize() {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);

    renderer.setSize(width, height);

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
  }

  window.addEventListener("resize", resize);

  /* ---------- Return scene resources ---------- */

  return {
    THREE,
    scene,
    world,
    airportGroup,
    aircraftGroup,
    renderer,
    sunlight,
    skyLight,
    materials,
    ground,
    resize,

    dispose() {
      window.removeEventListener("resize", resize);

      renderer.dispose();

      groundGeometry.dispose();

      for (const material of Object.values(materials)) {
        material.dispose();
      }

      terrainMaterial.dispose();
    }
  };
}
