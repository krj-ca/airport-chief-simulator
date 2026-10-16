
export function createControls() {
  const input = {
    pitch: 0,
    roll: 0,
    yaw: 0
  };

  const keys = new Set();
  const touchControls = new Map();

  let callbacks = {};
  let bound = false;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  function bind(newCallbacks = {}) {
    callbacks = newCallbacks;

    if (bound) return;
    bound = true;

    // Keyboard controls
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
          .includes(key)
      ) {
        event.preventDefault();
      }

      keys.add(key);

      if (event.repeat) return;

      if (key === "e") {
        callbacks.onToggleEngine?.();
      }

      if (key === "g") {
        callbacks.onToggleGear?.();
      }

      if (key === "b") {
        callbacks.onToggleBrakes?.();
      }

      if (key === "c") {
        callbacks.onToggleCamera?.();
      }

      if (key === "escape" || key === "p") {
        callbacks.onPause?.();
      }

      if (key === "1") {
        callbacks.onModeChange?.("pilot");
      }

      if (key === "2") {
        callbacks.onModeChange?.("chief");
      }

      if (key === "3") {
        callbacks.onModeChange?.("map");
      }
    });

    window.addEventListener("keyup", (event) => {
      keys.delete(event.key.toLowerCase());
    });

    window.addEventListener("blur", () => {
      keys.clear();
      touchControls.clear();
      resetInput();
    });

    // Mobile touch controls
    bindHoldButton("btn-left", "roll", -1);
    bindHoldButton("btn-right", "roll", 1);
    bindHoldButton("btn-pitch-up", "pitch", -1);
    bindHoldButton("btn-pitch-down", "pitch", 1);

    // Optional extra yaw buttons, if present in the HTML
    bindHoldButton("btn-yaw-left", "yaw", -1);
    bindHoldButton("btn-yaw-right", "yaw", 1);

    // System buttons
    bindClick("engine-button", () =>
      callbacks.onToggleEngine?.()
    );

    bindClick("gear-button", () =>
      callbacks.onToggleGear?.()
    );

    bindClick("brake-button", () =>
      callbacks.onToggleBrakes?.()
    );

    bindClick("camera-button", () =>
      callbacks.onToggleCamera?.()
    );

    bindClick("pause-button", () =>
      callbacks.onPause?.()
    );

    bindClick("btn-pilot", () =>
      callbacks.onModeChange?.("pilot")
    );

    bindClick("btn-chief", () =>
      callbacks.onModeChange?.("chief")
    );

    bindClick("btn-map", () =>
      callbacks.onModeChange?.("map")
    );

    // Throttle slider
    const throttleSlider = document.getElementById("throttle");

    if (throttleSlider) {
      throttleSlider.addEventListener("input", () => {
        const value = clamp(
          Number(throttleSlider.value) / 100,
          0,
          1
        );

        callbacks.onThrottleChange?.(value);
      });
    }
  }

  function bindHoldButton(id, axis, direction) {
    const element = document.getElementById(id);
    if (!element) return;

    element.style.touchAction = "none";

    const start = (event) => {
      event.preventDefault();
      touchControls.set(`${id}-${event.pointerId}`, {
        axis,
        direction
      });

      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional.
      }
    };

    const stop = (event) => {
      touchControls.delete(`${id}-${event.pointerId}`);
    };

    element.addEventListener("pointerdown", start);
    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);
    element.addEventListener("lostpointercapture", stop);
  }

  function bindClick(id, callback) {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("click", (event) => {
      event.preventDefault();
      callback();
    });
  }

  function resetInput() {
    input.pitch = 0;
    input.roll = 0;
    input.yaw = 0;
  }

  function getInput() {
    let pitch = 0;
    let roll = 0;
    let yaw = 0;

    // Keyboard flight controls
    if (keys.has("arrowup") || keys.has("w")) pitch -= 1;
    if (keys.has("arrowdown") || keys.has("s")) pitch += 1;

    if (keys.has("arrowleft") || keys.has("a")) roll -= 1;
    if (keys.has("arrowright") || keys.has("d")) roll += 1;

    if (keys.has("q")) yaw -= 1;
    if (keys.has("r")) yaw += 1;

    // Combine mobile touch input
    for (const control of touchControls.values()) {
      if (control.axis === "pitch") {
        pitch += control.direction;
      }

      if (control.axis === "roll") {
        roll += control.direction;
      }

      if (control.axis === "yaw") {
        yaw += control.direction;
      }
    }

    input.pitch = clamp(pitch, -1, 1);
    input.roll = clamp(roll, -1, 1);
    input.yaw = clamp(yaw, -1, 1);

    return { ...input };
  }

  return {
    bind,
    getInput
  };
    }
      
