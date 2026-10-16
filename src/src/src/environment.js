
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createEnvironment(scene) {
  // Sky and atmospheric fog
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 700, 6500);

  // Main sunlight
  const sunlight = new THREE.DirectionalLight(0xfff1d1, 2.2);
  sunlight.position.set(-500, 800, 300);
  scene.add(sunlight);

  // Soft light for shaded aircraft and buildings
  const ambientLight = new THREE.HemisphereLight(
    0xc8e7ff,
    0x526044,
    1.4
  );
  scene.add(ambientLight);

  // Sun sphere
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(90, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff0b0 })
  );

  sun.position.set(-1800, 1700, -4000);
  scene.add(sun);

  // Cloud group
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    transparent: true,
    opacity: 0.9,
    flatShading: true
  });

  // Build fluffy clouds from overlapping spheres.
  function createCloud(x, y, z, scale = 1) {
    const cloud = new THREE.Group();

    const puffs = [
      [-18, 0, 0, 1.1],
      [-7, 5, 1, 1.35],
      [7, 3, -2, 1.5],
      [19, 0, 1, 1.0],
      [1, -2, 7, 1.1]
    ];

    for (const [px, py, pz, size] of puffs) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(10 * size, 10, 8),
        cloudMaterial
      );

      puff.position.set(px, py, pz);
      puff.scale.y = 0.65;
      cloud.add(puff);
    }

    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    cloudGroup.add(cloud);

    return cloud;
  }

  // Place clouds around the airport and flight area.
  const clouds = [];

  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const radius = 900 + (i % 4) * 350;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 260 + (i % 5) * 65;

    const cloud = createCloud(
      x,
      y,
      z,
      0.8 + (i % 4) * 0.18
    );

    clouds.push(cloud);
  }

  // Simple environment presets.
  const weatherPresets = {
    clear: {
      sky: 0x87ceeb,
      fog: 0x87ceeb,
      fogNear: 700,
      fogFar: 6500,
      sunlight: 2.2,
      ambient: 1.4
    },

    cloudy: {
      sky: 0xa8b6c5,
      fog: 0xa8b6c5,
      fogNear: 450,
      fogFar: 4200,
      sunlight: 1.2,
      ambient: 1.2
    },

    sunset: {
      sky: 0xffa36c,
      fog: 0xffbd91,
      fogNear: 600,
      fogFar: 5000,
      sunlight: 1.5,
      ambient: 0.9
    },

    night: {
      sky: 0x071326,
      fog: 0x071326,
      fogNear: 350,
      fogFar: 3200,
      sunlight: 0.15,
      ambient: 0.35
    }
  };

  let currentWeather = "clear";
  let elapsed = 0;

  function setWeather(presetName) {
    const preset = weatherPresets[presetName];

    if (!preset) return false;

    currentWeather = presetName;

    scene.background.setHex(preset.sky);
    scene.fog.color.setHex(preset.fog);
    scene.fog.near = preset.fogNear;
    scene.fog.far = preset.fogFar;

    sunlight.intensity = preset.sunlight;
    ambientLight.intensity = preset.ambient;

    sun.visible = presetName !== "night";

    // Clouds are more visible in daytime conditions.
    cloudGroup.visible = presetName !== "night";

    return true;
  }

  function update(delta = 1 / 60, gameState = {}) {
    if (!Number.isFinite(delta) || delta < 0) return;

    elapsed += delta;

    // Slowly drift clouds to make the sky feel alive.
    for (let i = 0; i < clouds.length; i++) {
      const cloud = clouds[i];

      cloud.position.x += delta * (2 + (i % 3));
      cloud.position.z += delta * 0.5;

      if (cloud.position.x > 2200) {
        cloud.position.x = -2200;
      }

      if (cloud.position.z > 2200) {
        cloud.position.z = -2200;
      }
    }

    // Optional future weather setting.
    if (
      gameState.weather &&
      gameState.weather !== currentWeather &&
      weatherPresets[gameState.weather]
    ) {
      setWeather(gameState.weather);
    }
  }

  function dispose() {
    scene.remove(cloudGroup);
    scene.remove(sun);
    scene.remove(sunlight);
    scene.remove(ambientLight);

    cloudGroup.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
    });

    cloudMaterial.dispose();
    sun.geometry.dispose();
    sun.material.dispose();
  }

  return {
    update,
    setWeather,
    getWeather: () => currentWeather,
    dispose
  };
                                                       }
       
