
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createNavigationMap({ scene, airport, aircraft }) {
  const mapGroup = new THREE.Group();
  mapGroup.name = "NavigationMap";

  // The map is drawn as a small 3D overlay scene.
  const mapScene = new THREE.Scene();
  mapScene.background = new THREE.Color(0x101d2a);

  const mapCamera = new THREE.OrthographicCamera(
    -250, 250, 250, -250, 0.1, 2000
  );

  mapCamera.position.set(0, 800, 0);
  mapCamera.up.set(0, 0, -1);
  mapCamera.lookAt(0, 0, 0);

  const mapRenderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true
  });

  mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  mapRenderer.setSize(240, 240);
  mapRenderer.domElement.style.width = "240px";
  mapRenderer.domElement.style.height = "240px";
  mapRenderer.domElement.style.borderRadius = "12px";
  mapRenderer.domElement.style.border = "2px solid #6a8ca8";
  mapRenderer.domElement.style.background = "#101d2a";
  mapRenderer.domElement.style.position = "absolute";
  mapRenderer.domElement.style.right = "12px";
  mapRenderer.domElement.style.top = "12px";
  mapRenderer.domElement.style.zIndex = "20";
  mapRenderer.domElement.style.pointerEvents = "none";

  const mapLight = new THREE.AmbientLight(0xffffff, 2);
  mapScene.add(mapLight);

  // Ground plane for the navigation display.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000),
    new THREE.MeshBasicMaterial({ color: 0x203b38 })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  mapScene.add(ground);

  // Runway shown as a long rectangle.
  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 1000),
    new THREE.MeshBasicMaterial({ color: 0x626d79 })
  );

  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 0, 0);
  mapScene.add(runway);

  // Runway centre line.
  const centreLine = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 940),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  centreLine.rotation.x = -Math.PI / 2;
  centreLine.position.y = 0.2;
  mapScene.add(centreLine);

  // Terminal marker.
  const terminal = new THREE.Mesh(
    new THREE.BoxGeometry(80, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0x55b8ff })
  );

  terminal.position.set(145, 4, -145);
  mapScene.add(terminal);

  // Aircraft marker.
  const aircraftMarker = new THREE.Mesh(
    new THREE.ConeGeometry(9, 24, 3),
    new THREE.MeshBasicMaterial({ color: 0xffd34d })
  );

  aircraftMarker.rotation.x = -Math.PI / 2;
  mapScene.add(aircraftMarker);

  // Navigation compass markers.
  function makeLabel(text, x, z, color = "#ffffff") {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 48;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, 10, z);
    sprite.scale.set(50, 19, 1);
    mapScene.add(sprite);

    return sprite;
  }

  const northLabel = makeLabel("N", 0, -180);
  const southLabel = makeLabel("S", 0, 180);
  const eastLabel = makeLabel("E", 180, 0);
  const westLabel = makeLabel("W", -180, 0);

  let visible = true;

  function setVisible(value) {
    visible = Boolean(value);

    if (mapRenderer.domElement.parentElement !== document.body) {
      document.body.appendChild(mapRenderer.domElement);
    }

    mapRenderer.domElement.style.display = visible ? "block" : "none";
  }

  function toggle() {
    setVisible(!visible);
  }

  function update(gameState, plane, delta = 0) {
    if (!plane || !plane.position) return;

    // Keep the marker aligned with the aircraft's world position.
    aircraftMarker.position.x = plane.position.x;
    aircraftMarker.position.z = plane.position.z;
    aircraftMarker.position.y = 2;

    // Match the marker's direction to the aircraft.
    aircraftMarker.rotation.z = -plane.rotation.y;

    // Follow the aircraft so it stays centred on the map.
    mapCamera.position.x = plane.position.x;
    mapCamera.position.z = plane.position.z;
    mapCamera.lookAt(
      plane.position.x,
      0,
      plane.position.z
    );

    mapCamera.updateProjectionMatrix();

    if (visible) {
      mapRenderer.render(mapScene, mapCamera);
    }
  }

  // Add the map overlay to the page.
  setVisible(true);

  // Resize support for mobile and desktop screens.
  function resize() {
    mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mapRenderer.setSize(240, 240);
  }

  window.addEventListener("resize", resize);

  function dispose() {
    window.removeEventListener("resize", resize);

    if (mapRenderer.domElement.parentElement) {
      mapRenderer.domElement.parentElement.removeChild(
        mapRenderer.domElement
      );
    }

    mapRenderer.dispose();

    mapScene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();

      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const material of materials) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
      }
    });
  }

  return {
    update,
    setVisible,
    toggle,
    resize,
    dispose,
    mapScene,
    mapCamera,
    mapRenderer
  };
}
