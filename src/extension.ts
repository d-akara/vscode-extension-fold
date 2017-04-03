'use strict';
import * as vscode from 'vscode';
import * as edit from './common/EditorFunctions';

// TODO new commands:
// - Fold all below cursor line
// - Fold all above cursor line
// - Fold all keep cursor line
export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('dakara-foldplus.levelAtCursor', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const level = edit.calculateLineLevel(textEditor, selection.anchor.line);
        vscode.commands.executeCommand('editor.foldLevel' + level);
        vscode.commands.executeCommand('editor.fold');
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.selection', () => {
        const textEditor = vscode.window.activeTextEditor;   
        const selection = textEditor.selection;
        const textForFold = edit.textOfSelectionOrWordAtCursor(textEditor.document, selection);
        let endOfPreviousRegion = 0;
        const promises = [];
        edit.findAllLineNumbersContaining(textEditor.document, textForFold).forEach( lineNumber => {
            const foldingRegion = edit.makeRangeFromFoldingRegion(textEditor.document, lineNumber, +textEditor.options.tabSize);
            // TODO have option to fold with selected at same level or not fold sub regions
            if ((lineNumber > endOfPreviousRegion) && (foldingRegion.end.line - foldingRegion.start.line > 1)) {
                endOfPreviousRegion = foldingRegion.end.line;
                textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
                promises.push(vscode.commands.executeCommand('editor.fold'));
            }
        });

        Promise.all(promises).then(() => {
            textEditor.selection = selection;
            textEditor.revealRange(textEditor.selection);
        });
    });
    context.subscriptions.push(disposable);
    
    disposable = vscode.commands.registerCommand('dakara-foldplus.selection.exclude', () => {
        const textEditor = vscode.window.activeTextEditor; 
        const selection = textEditor.selection;       
        vscode.commands.executeCommand('editor.foldAll').then(()=>{
            const promises = [];
            const textForFold = edit.textOfSelectionOrWordAtCursor(textEditor.document, selection);
            const linesToUnfold = new Set<number>();
            edit.findAllLineNumbersContaining(textEditor.document, textForFold).forEach( lineNumber => {
                textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
                edit.findLinesByLevelToRoot(textEditor, lineNumber).forEach(line => {
                    linesToUnfold.add(line.lineNumber);
                });
                promises.push(vscode.commands.executeCommand('editor.unfoldRecursively'));              
            });
            linesToUnfold.forEach(lineNumber => {
                textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
                promises.push(vscode.commands.executeCommand('editor.unfold'));
            });  
            return Promise.all(promises);
        }).then(() => {
            textEditor.selection = selection;
            textEditor.revealRange(textEditor.selection);
        });
    });
    context.subscriptions.push(disposable);
    
}


export function deactivate() {
}