import * as vscode from "vscode";
import { getSuggestions } from "./autocorrect";

// this method is called when vs code is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log("decorator sample is activated");

  let timeout: NodeJS.Timer | undefined = undefined;

  // create a decorator type that we use to decorate large numbers
  const contextErrorDecorationType =
    vscode.window.createTextEditorDecorationType({
      // use a themable color. See package.json for the declaration and default values.
      backgroundColor: { id: "myextension.contextErrorBackground" },
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
      contextErrorDecorationType,
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
