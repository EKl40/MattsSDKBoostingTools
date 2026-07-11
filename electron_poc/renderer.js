const statusOutput = document.getElementById("statusOutput");
const deliveryOutput = document.getElementById("deliveryOutput");
const serialInput = document.getElementById("serialInput");
const editorFrame = document.getElementById("editorFrame");

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function setOutput(node, value) {
  node.textContent = typeof value === "string" ? value : pretty(value);
}

async function bridgeStatus() {
  setOutput(statusOutput, "Checking bridge...");
  const result = await window.msbt.bridgeRequest({ method: "GET", path: "/status" });
  setOutput(statusOutput, result);
}

async function sendSerial(mode) {
  const serial = serialInput.value.trim();
  if (!serial) {
    setOutput(deliveryOutput, "Paste one @U serial before sending.");
    return;
  }
  const actionByMode = {
    selected: "give_serial_selected",
    all: "give_serial_all",
    nonhost: "give_serial_nonhost"
  };
  const action = actionByMode[mode];
  setOutput(deliveryOutput, `Sending ${action}...`);
  const result = await window.msbt.bridgeRequest({
    method: "POST",
    path: "/action",
    payload: {
      action,
      payload: {
        serial_text: serial,
        serial_override_level: false,
        serial_level: 60
      }
    },
    timeoutMs: 15000
  });
  setOutput(deliveryOutput, result);
}

async function loadEditor() {
  const url = await window.msbt.mattEditorUrl();
  editorFrame.src = url;
}

document.getElementById("statusBtn").addEventListener("click", bridgeStatus);
document.getElementById("repoBtn").addEventListener("click", () => {
  window.msbt.openExternal("https://github.com/funkyoushift/MattsSDKBoostingTools");
});
document.getElementById("loadEditorBtn").addEventListener("click", loadEditor);
document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => sendSerial(button.dataset.mode));
});

bridgeStatus();
