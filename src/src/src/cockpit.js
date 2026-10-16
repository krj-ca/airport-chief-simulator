
export function createCockpit(aircraft) {
  const elements = {
    speed: document.getElementById("speed"),
    altitude: document.getElementById("altitude"),
    heading: document.getElementById("heading"),
    message: document.getElementById("flight-message")
  };

  let lastMessage = "";

  function formatNumber(value, digits = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toFixed(digits);
  }

  function setText(element, value) {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  }

  function getFlightMessage(state, plane) {
    if (state.paused) {
      return "SIMULATION PAUSED";
    }

    if (state.mode === "chief") {
      return "AIRPORT CHIEF MODE";
    }

    if (state.mode === "map") {
      return "NAVIGATION MAP MODE";
    }

    if (!state.engineOn) {
      return "ENGINE OFF — PRESS E TO START";
    }

    if (state.brakesOn) {
      return "PARKING BRAKES ON";
    }

    if (plane.altitude < 8 && plane.speed < 35) {
      return "READY FOR TAXI";
    }

    if (plane.altitude < 15 && plane.speed >= 35) {
      return "TAKEOFF — MONITOR SPEED";
    }

    if (plane.verticalSpeed > 2) {
      return "CLIMBING";
    }

    if (plane.verticalSpeed < -2) {
      return "DESCENDING";
    }

    return "FLIGHT NORMAL";
  }

  function update(state, delta = 0) {
    if (!aircraft || !aircraft.userData) return;

    const plane = aircraft.userData;

    const speed = Number(plane.speed) || 0;
    const altitude = Number(plane.altitude) || 0;
    const heading = ((Number(plane.heading) || 0) % 360 + 360) % 360;

    // Keep the main HUD values updated.
    setText(elements.speed, formatNumber(speed));
    setText(elements.altitude, formatNumber(altitude));
    setText(elements.heading, formatNumber(heading).padStart(3, "0") + "°");

    // Optional cockpit instruments can be added to index.html.
    setText(
      document.getElementById("vertical-speed"),
      formatNumber(plane.verticalSpeed || 0)
    );

    setText(
      document.getElementById("throttle-value"),
      formatNumber((state.throttle || 0) * 100) + "%"
    );

    setText(
      document.getElementById("engine-status"),
      state.engineOn ? "ENGINE ON" : "ENGINE OFF"
    );

    setText(
      document.getElementById("gear-status"),
      state.gearDown ? "GEAR DOWN" : "GEAR UP"
    );

    setText(
      document.getElementById("brake-status"),
      state.brakesOn ? "BRAKES ON" : "BRAKES OFF"
    );

    // Update the flight information message only when it changes.
    const message = getFlightMessage(state, plane);

    if (message !== lastMessage) {
      setText(elements.message, message);
      lastMessage = message;
    }
  }

  function reset() {
    lastMessage = "";
  }

  return {
    update,
    reset
  };
                            }
      
