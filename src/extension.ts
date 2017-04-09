'use strict';
import * as vscode from 'vscode';
import * as edit from 'vscode-extension-common';
import * as fold from './Fold';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('dakara-foldplus.levelAtCursor', () => {
        fold.foldUsingLevelOfCursorLine();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.selection', () => {
        const foldLines = edit.findAllLinesContainingCurrentWordOrSelection();
        fold.foldLines(foldLines);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.selection.exclude', () => {
        const excludedLines = edit.findAllLinesContainingCurrentWordOrSelection();
        fold.foldAllExcept(excludedLines);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.cursor.exclude', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;        
        fold.foldAllExcept([selection.anchor.line]);
    });
    context.subscriptions.push(disposable);

}

export function deactivate() {
}