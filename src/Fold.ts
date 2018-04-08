'use strict';
import * as vscode from 'vscode';
import {Lines, Region, View} from 'vscode-extension-common';

export function foldLevelOfParent() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    const parentLine = Lines.findNextLineUpSpacedLeft(textEditor.document, textEditor.selection.active.line, +textEditor.options.tabSize);
    const level = Lines.calculateLineLevel(textEditor, parentLine.lineNumber);

    textEditor.selection = new vscode.Selection(parentLine.lineNumber, 0, parentLine.lineNumber, 0);
    vscode.commands.executeCommand('editor.foldLevel' + level)
        .then(()=> vscode.commands.executeCommand('editor.fold'));
}

export function foldLevelOfCursor() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    const promises = [];

    const level = Lines.calculateLineLevel(textEditor, selection.anchor.line);
    promises.push(vscode.commands.executeCommand('editor.foldLevel' + level));

    // Fold current line if it is a foldable line.  If we don't check, vscode will fold parent.
    if (Lines.isNextLineDownSpacedRight(textEditor.document, selection.anchor.line, +textEditor.options.tabSize))
        promises.push(vscode.commands.executeCommand('editor.fold'));

    // Restore selection
    Promise.all(promises).then(() => {
        textEditor.selection = selection;
        View.triggerWordHighlighting();
    })    
}

export function foldChildren() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    const promises = [];
    const linesToFold = Lines.findAllLinesSpacedOneLevelRight(textEditor.document, selection.active.line, +textEditor.options.tabSize);
    foldLines(linesToFold.filter(line=>Lines.isNextLineDownSpacedRight(textEditor.document,line.lineNumber, +textEditor.options.tabSize)).map(line=>line.lineNumber));
}

export function foldLines(foldLines: Array<number>) {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    let endOfPreviousRegion = -1;
    const promises = [];
    foldLines.forEach(lineNumber => {
        const foldingRegion = Region.makeRangeFromFoldingRegion(textEditor.document, lineNumber, +textEditor.options.tabSize);
        // Are we outside previous fold and is current line foldable
        // Executing fold on a non-foldable line will fold the parent
        if ((lineNumber > endOfPreviousRegion) && (foldingRegion.end.line - foldingRegion.start.line > 1)) {
            endOfPreviousRegion = foldingRegion.end.line;
            textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
            //console.log('folding ' + textEditor.selection.anchor.line);
            promises.push(vscode.commands.executeCommand('editor.fold'));
        }
    });

    Promise.all(promises).then(() => {
        textEditor.selection = selection;
        textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
        View.triggerWordHighlighting();
    });
}  

export function foldAllExcept(excludedLines: Array<number>) {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    vscode.commands.executeCommand('editor.foldAll').then(() => {
        const promises = [];
        const linesToUnfold = new Set<number>();
        excludedLines.forEach(lineNumber => {
            textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
            Lines.findLinesByLevelToRoot(textEditor.document, lineNumber, +textEditor.options.tabSize).forEach(line => {
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
        textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
        View.triggerWordHighlighting();
    });
}