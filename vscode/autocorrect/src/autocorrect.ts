import * as vscode from "vscode";
import fetch from "node-fetch";

const url = "http://localhost:5000/mask";

export function getSuggestions(activeEditor: vscode.TextEditor) {
  console.log("getSuggestions");

  const text = activeEditor?.document.getText();
  if (!text) {
    return [];
  }

  const mousePosition = activeEditor?.selection.active;
  if (!mousePosition) {
    return [];
  }

  console.log(mousePosition);

  fetch(url, {
    method: "POST",
    body: JSON.stringify({ text, line: mousePosition.line }),
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  console.log("getSuggestions end");
  return [];
}
