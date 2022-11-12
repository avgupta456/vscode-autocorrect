import * as vscode from "vscode";
import { getSuggestions } from "./autocorrect";

// this method is called when vs code is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log("decorator sample is activated");

  let timeout: NodeJS.Timer | undefined = undefined;
  let activeEditor = vscode.window.activeTextEditor;

  // create a decorator type that we use to decorate large numbers
  const contextErrorDecorationType =
    vscode.window.createTextEditorDecorationType({
      textDecoration: "underline wavy #4073C4",
    });

  /*
  vscode.languages.registerHoverProvider("*", {
    provideHover(document, position, token) {
      return new vscode.Hover("Autocorrect suggests:");
    },
  });
  */

  const command = "autocorrect.autocorrect";

  interface Args {
    start: number;
    end: number;
    to: string;
  }

  const commandHandler = (args: Args) => {
    const start = args.start;
    const end = args.end;
    const to = args.to;

    if (!activeEditor) {
      return;
    }

    const text = activeEditor.document.getText();
    if (!text) {
      return;
    }

    const range = new vscode.Range(
      activeEditor.document.positionAt(start),
      activeEditor.document.positionAt(end)
    );

    activeEditor.edit((editBuilder) => {
      editBuilder.replace(range, to);
    });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(command, commandHandler)
  );

  async function updateDecorations() {
    if (activeEditor === undefined) {
      return;
    }

    // get current document language
    const suggestions = await getSuggestions(activeEditor);

    const suggestionDecorations: vscode.DecorationOptions[] = suggestions.map(
      (suggestion) => {
        const startPos = activeEditor!.document.positionAt(suggestion[0][1]);
        const endPos = activeEditor!.document.positionAt(suggestion[0][2]);
        const args = [
          { start: suggestion[0][1], end: suggestion[0][2], to: suggestion[1] },
        ];
        const commandUri = vscode.Uri.parse(
          `command:${command}?${encodeURIComponent(JSON.stringify(args))}`
        );
        const content = new vscode.MarkdownString(
          "**Autocorrect suggests:**  \n[" +
            suggestion[1] +
            "](" +
            commandUri +
            ") (click to autocorrect)"
        );
        content.isTrusted = true;
        const decoration = {
          range: new vscode.Range(startPos, endPos),
          hoverMessage: content,
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
