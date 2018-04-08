'use strict';
import * as vscode from 'vscode';
import { Application, Lines } from 'vscode-extension-common';
import * as fold from './Fold';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('dakara-foldplus.levelAtCursor', () => {
        warnFoldStrategy()
        fold.foldLevelOfCursor();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.levelOfParent', () => {
        warnFoldStrategy()
        fold.foldLevelOfParent();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.children', () => {
        warnFoldStrategy()
        fold.foldChildren();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.parent', () => {
        warnFoldStrategy()
        const textEditor = vscode.window.activeTextEditor;
        const parentLine = Lines.findNextLineUpSpacedLeft(textEditor.document, textEditor.selection.active.line, +textEditor.options.tabSize);
        textEditor.selection = new vscode.Selection(parentLine.lineNumber, 0, parentLine.lineNumber, 0);
        vscode.commands.executeCommand('editor.fold');
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.selection', () => {
        warnFoldStrategy()
        const foldLines = Lines.findAllLinesContainingCurrentWordOrSelection();
        fold.foldLines(foldLines);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.selection.exclude', () => {
        warnFoldStrategy()
        const excludedLines = Lines.findAllLinesContainingCurrentWordOrSelection();
        fold.foldAllExcept(excludedLines);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.cursor.exclude', () => {
        warnFoldStrategy()
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;        
        fold.foldAllExcept([selection.anchor.line]);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.toggle.indentation', async () => {
        const newValue = await Application.settingsCycleNext('editor', 'foldingStrategy', ['auto', 'indentation'])
        vscode.window.showInformationMessage('Set Folding Strategy: ' + newValue)
    });
    context.subscriptions.push(disposable);

}

export function deactivate() {
}

function warnFoldStrategy() {
    const currentFoldingStrategy = vscode.workspace.getConfiguration('editor').get('foldingStrategy')
    if (currentFoldingStrategy === 'auto')
        vscode.window.showWarningMessage("Fold Plus features require 'indentation' folding.  Use command `Fold Plus: Toggle Indentation/Language Folding` to set 'indentation' folding when using Fold Plus")
}