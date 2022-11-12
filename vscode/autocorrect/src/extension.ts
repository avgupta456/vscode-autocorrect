import * as vscode from "vscode";
import { getSuggestions } from "./autocorrect";

// this method is called when vs code is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log("decorator sample is activated");

  let timeout: NodeJS.Timer | undefined = undefined;

  // create a decorator type that we use to decorate small numbers
  const smallNumberDecorationType =
    vscode.window.createTextEditorDecorationType({
      borderWidth: "1px",
      borderStyle: "solid",
      overviewRulerColor: "blue",
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      light: {
        // this color will be used in light color themes
        borderColor: "darkblue",
      },
      dark: {
        // this color will be used in dark color themes
        borderColor: "lightblue",
      },
    });

  // create a decorator type that we use to decorate large numbers
  const largeNumberDecorationType =
    vscode.window.createTextEditorDecorationType({
      cursor: "crosshair",
      // use a themable color. See package.json for the declaration and default values.
      backgroundColor: { id: "myextension.largeNumberBackground" },
    });

  let activeEditor = vscode.window.activeTextEditor;

  async function updateDecorations() {
    if (activeEditor === undefined) {
      return;
    }
    const suggestions = await getSuggestions(activeEditor);

    const suggestionDecorations: vscode.DecorationOptions[] = suggestions.map(
      (suggestion) => {
        const startPos = activeEditor!.document.positionAt(suggestion[0][1]);
        const endPos = activeEditor!.document.positionAt(suggestion[0][2]);
        const decoration = {
          range: new vscode.Range(startPos, endPos),
          hoverMessage: suggestion[1],
        };
        return decoration;
      }
    );

    activeEditor.setDecorations(
      largeNumberDecorationType,
      suggestionDecorations
    );
  }

  function triggerUpdateDecorations(throttle = false) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (throttle) {
      timeout = setTimeout(updateDecorations, 500);
    } else {
      updateDecorations();
    }
  }

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations(true);
      }
    },
    null,
    context.subscriptions
  );
}
