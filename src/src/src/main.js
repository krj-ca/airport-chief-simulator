
/* =========================================
   AIRPORT CHIEF & PILOT SIMULATOR
   File 3: src/main.js
   Main game controller
   ========================================= */

import { createScene } from "./scene.js";
import { createAirport } from "./airport.js";
import { createAircraft } from "./aircraft.js";
import { updateFlightPhysics } from "./flightPhysics.js";
import { createControls } from "./controls.js";
import { createCamera } from "./camera.js";
import { createCockpit } from "./cockpit.js";
import { createEnvironment } from "./environment.js";
import { createNavigationMap } from "./map.js";
import { createAudio } from "./audio.js";
import { createUI } from "./ui.js";
import { createGameState } from "./gameState.js";
import { createAirportManager } from "./airportManager.js";

/* ---------- Game setup ---------- */

const gameWorld = document.getElementById("game-world");
const loadingScreen = document.getElementById("loading-screen");

let gameState;
let gameScene;
let airport;
let aircraft;
let flightControls;
let cameraRig;
let cockpit;
let environment;
let navigationMap;
let audio;
let userInterface;
let airportManager;

let previousTime = 0;
let animationFrame = 0;
let isInitialized = false;

const MAX_DELTA = 0.05;

/* ---------- Helpful messages ---------- */

function showMessage(message) {
  const messageBox = document.getElementById("flight-message");

  if (messageBox) {
    messageBox.textContent = message;
    messageBox.hidden = false;
  }
}

/* ---------- Start the game ---------- */

async function startGame() {
  try {
    if (!gameWorld) {
      throw new Error(
        'The game container "#game-world" was not found in index.html.'
      );
    }

    showMessage("Preparing airport systems...");

    // 1. Create the game state.
    gameState = createGameState();

    // 2. Create the Three.js scene and renderer.
    gameScene = createScene(gameWorld);

    // 3. Build the airport environment.
    airport = createAirport(gameScene.scene);
    environment = createEnvironment(gameScene.scene);

    // 4. Create the player's aircraft.
    aircraft = createAircraft(gameScene.scene);

    // 5. Set up the following camera.
    cameraRig = createCamera(gameScene.scene, aircraft);

    // 6. Initialize flight controls.
    flightControls = createControls();

    // 7. Initialize cockpit information.
    cockpit = createCockpit(aircraft);

    // 8. Create the navigation map.
    navigationMap = createNavigationMap({
      scene: gameScene.scene,
      airport,
      aircraft
    });

    // 9. Prepare audio.
    audio = createAudio();

    // 10. Prepare airport management.
    airportManager = createAirportManager(airport, gameState);

    // 11. Connect the interface to the game.
    userInterface = createUI({
      state: gameState,
      controls: flightControls,
      airportManager,
      aircraft
    });

    // 12. Connect buttons and game actions.
    connectGameControls();

    // Hide loading screen after successful initialization.
    if (loadingScreen) {
      loadingScreen.hidden = true;
    }

    isInitialized = true;
    showMessage("Airport ready. Start the engines!");

    // Start the animation loop.
    previousTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);

    console.log("Airport Chief & Pilot Simulator initialized.");
  } catch (error) {
    console.error("Game initialization failed:", error);

    if (loadingScreen) {
      loadingScreen.hidden = false;
      loadingScreen.innerHTML = `
        <h1>Airport Simulator</h1>
        <p>The game is still being assembled.</p>
        <p>Complete all JavaScript files, then reload this page.</p>
        <p style="font-size:12px;opacity:0.7">
          ${escapeHTML(error.message)}
        </p>
      `;
    }
  }
}

/* ---------- Connect the controls ---------- */

function connectGameControls() {
  flightControls.bind({
    onModeChange: (mode) => {
      gameState.mode = mode;

      if (userInterface?.setMode) {
        userInterface.setMode(mode);
      }

      const messages = {
        pilot: "Pilot mode selected.",
        chief: "Airport Chief mode selected.",
        map: "Navigation map selected."
      };

      showMessage(messages[mode] || "Game mode changed.");
    },

    onToggleEngine: () => {
      gameState.engineOn = !gameState.engineOn;

      showMessage(
        gameState.engineOn
          ? "Engine started."
          : "Engine switched off."
      );
    },

    onToggleGear: () => {
      gameState.gearDown = !gameState.gearDown;

      showMessage(
        gameState.gearDown
          ? "Landing gear selected down."
          : "Landing gear selected up."
      );
    },

    onToggleBrakes: () => {
      gameState.brakesOn = !gameState.brakesOn;

      showMessage(
        gameState.brakesOn
          ? "Brakes engaged."
          : "Brakes released."
      );
    },

    onToggleCamera: () => {
      gameState.cameraMode =
        gameState.cameraMode === "chase" ? "cockpit" : "chase";

      if (cameraRig?.setMode) {
        cameraRig.setMode(gameState.cameraMode);
      }

      showMessage(
        gameState.cameraMode === "cockpit"
          ? "Cockpit camera selected."
          : "External camera selected."
      );
    },

    onPause: () => {
      gameState.paused = !gameState.paused;

      showMessage(
        gameState.paused ? "Game paused." : "Game resumed."
      );

      if (userInterface?.setPaused) {
        userInterface.setPaused(gameState.paused);
      }
    },

    onThrottleChange: (value) => {
      gameState.throttle = Number(value);
    }
  });
}

/* ---------- Main animation loop ---------- */

function gameLoop(currentTime) {
  if (!isInitialized) return;

  animationFrame = requestAnimationFrame(gameLoop);

  // Avoid large physics jumps when the browser lags.
  const delta = Math.min(
    (currentTime - previousTime) / 1000,
    MAX_DELTA
  );

  previousTime = currentTime;

  if (gameState.paused) {
    renderFrame();
    return;
  }

  try {
    // Read the current keyboard and touch input.
    const input = flightControls.getInput();

    // Update aircraft movement and flight information.
    updateFlightPhysics(
      aircraft,
      input,
      gameState,
      delta
    );

    // Update the camera and aircraft environment.
    if (cameraRig?.update) {
      cameraRig.update(delta);
    }

    if (environment?.update) {
      environment.update(delta, gameState);
    }

    // Update cockpit instruments and navigation.
    if (cockpit?.update) {
      cockpit.update(gameState, aircraft, delta);
    }

    if (navigationMap?.update) {
      navigationMap.update(gameState, aircraft, delta);
    }

    // Update airport business systems.
    if (airportManager?.update) {
      airportManager.update(delta, gameState);
    }

    // Refresh HUD and management panels.
    if (userInterface?.update) {
      userInterface.update(gameState, delta);
    }

    // Update sound systems.
    if (audio?.update) {
      audio.update(gameState, delta);
    }

    renderFrame();
  } catch (error) {
    console.error("Game update error:", error);
    showMessage("A game system encountered an error. Check the console.");
  }
}

/* ---------- Render the 3D scene ---------- */

function renderFrame() {
  if (!gameScene?.renderer || !gameScene?.scene) return;
  if (!cameraRig?.camera) return;

  gameScene.renderer.render(
    gameScene.scene,
    cameraRig.camera
  );
}

/* ---------- Browser resizing ---------- */

window.addEventListener("resize", () => {
  if (!gameScene || !cameraRig) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  if (gameScene.renderer) {
    gameScene.renderer.setSize(width, height);
  }

  if (cameraRig.camera) {
    cameraRig.camera.aspect = width / height;
    cameraRig.camera.updateProjectionMatrix();
  }
});

/* ---------- Safe error-message text ---------- */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

/* ---------- Start ---------- */

startGame();

/* Stop animation if the page is being closed. */
window.addEventListener("pagehide", () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  if (audio?.dispose) {
    audio.dispose();
  }

  if (gameScene?.renderer) {
    gameScene.renderer.dispose();
  }
});
