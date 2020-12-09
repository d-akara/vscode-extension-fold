'use strict';
import * as vscode from 'vscode';
import { Application, Lines, Modify, View } from 'vscode-extension-common';
import * as fold from './Fold';

export function activate(context: vscode.ExtensionContext) {

    Application.registerCommand(context,'dakara-foldplus.levelAtCursor', () => {
        warnFoldStrategy()
        fold.foldLevelOfCursor();
    });

    Application.registerCommand(context,'dakara-foldplus.levelAtCursor.unfold', () => {
        warnFoldStrategy()
        fold.unfoldLevelOfCursor();
    });

    Application.registerCommand(context,'dakara-foldplus.levelOfParent', () => {
        warnFoldStrategy()
        fold.foldLevelOfParent();
    });

    Application.registerCommand(context,'dakara-foldplus.children', () => {
        warnFoldStrategy()
        fold.foldChildren();
    });

    Application.registerCommand(context,'dakara-foldplus.parent', () => {
        warnFoldStrategy()
        const textEditor = vscode.window.activeTextEditor;
        const parentLine = Lines.findNextLineUpSpacedLeft(textEditor.document, textEditor.selection.active.line, +textEditor.options.tabSize);
        textEditor.selection = new vscode.Selection(parentLine.lineNumber, 0, parentLine.lineNumber, 0);
        vscode.commands.executeCommand('editor.fold');
    });

    Application.registerCommand(context,'dakara-foldplus.selection', () => {
        warnFoldStrategy()
        const foldLines = Lines.findAllLinesContainingCurrentWordOrSelection();
        fold.foldLines(foldLines);
    });

    Application.registerCommand(context,'dakara-foldplus.selection.unfold', async () => {
        warnFoldStrategy()
        const foldLines = Lines.findAllLinesContainingCurrentWordOrSelection();
        const regexUnfold = Lines.makeRegExpToMatchWordUnderCursorOrSelection(vscode.window.activeTextEditor.document, vscode.window.activeTextEditor.selection)
        await fold.unfoldLines(foldLines, false);

        View.moveCursorForwardUntilMatch(vscode.window.activeTextEditor, regexUnfold)
        View.triggerWordHighlighting()
    });

    Application.registerCommand(context,'dakara-foldplus.regex.unfold', async () => {
        warnFoldStrategy()
        const userInput = await vscode.window.showInputBox({prompt:'regex to unfold lines', value: ''});
        const regexUnfold = new RegExp(userInput)
        const foldLines = Lines.findAllLineNumbersContaining(vscode.window.activeTextEditor.document, regexUnfold);
        if (foldLines.length) {
            await fold.unfoldLines(foldLines, true);
            View.moveCursorForwardUntilMatch(vscode.window.activeTextEditor, regexUnfold)
            View.triggerWordHighlighting()
        } else {
            vscode.window.showWarningMessage("No lines found with '" + userInput + "'")
        }
    });

    Application.registerCommand(context,'dakara-foldplus.selection.exclude', () => {
        warnFoldStrategy()
        const excludedLines = Lines.findAllLinesContainingCurrentWordOrSelection();
        fold.foldAllExcept(excludedLines);
    });

    Application.registerCommand(context,'dakara-foldplus.cursor.exclude', () => {
        warnFoldStrategy()
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;        
        fold.foldAllExcept([selection.anchor.line]);
    });

    Application.registerCommand(context,'dakara-foldplus.toggle.indentation', async () => {
        const newValue = await Application.settingsCycleNext('editor', 'foldingStrategy', ['auto', 'indentation'])
        vscode.window.showInformationMessage('Set Folding Strategy: ' + newValue)
    });

}

export function deactivate() {
}

function warnFoldStrategy() {
    const currentFoldingStrategy = vscode.workspace.getConfiguration('editor').get('foldingStrategy')
    if (currentFoldingStrategy === 'auto')
        vscode.window.showWarningMessage("Fold Plus features require 'indentation' folding.  Use command `Fold Plus: Toggle Indentation/Language Folding` to set 'indentation' folding when using Fold Plus")
}