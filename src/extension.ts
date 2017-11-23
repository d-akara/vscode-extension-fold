'use strict';
import * as vscode from 'vscode';
import * as edit from 'vscode-extension-common';
import * as fold from './Fold';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('dakara-foldplus.levelAtCursor', () => {
        fold.foldLevelOfCursor();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.levelOfParent', () => {
        fold.foldLevelOfParent();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.children', () => {
        fold.foldChildren();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.parent', () => {
        const textEditor = vscode.window.activeTextEditor;
        const parentLine = edit.findNextLineUpSpacedLeft(textEditor, textEditor.selection.active.line);
        textEditor.selection = new vscode.Selection(parentLine.lineNumber, 0, parentLine.lineNumber, 0);
        vscode.commands.executeCommand('editor.fold');
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