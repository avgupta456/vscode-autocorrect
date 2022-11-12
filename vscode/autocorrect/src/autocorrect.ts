import * as vscode from "vscode";
import fetch from "node-fetch";

const url = "http://localhost:5000/mask";

export async function getSuggestions(activeEditor: vscode.TextEditor) {
  const text = activeEditor?.document.getText();
  if (!text) {
    return [];
  }

  const mousePosition = activeEditor?.selection.active;
  if (!mousePosition) {
    return [];
  }

  // await fetched suggestions
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      text,
      line: mousePosition.line,
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!data || !data.suggestions) {
    return [];
  }
  return data.suggestions as [[string, number, number], string][];
}
