'use strict';
import * as vscode from 'vscode';
import {Lines, Region, View} from 'vscode-extension-common';

export function foldLevelOfParent() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    const lineOfReferenceForFold = whenBlankLineUsePreviousOrNextLine(textEditor, selection.anchor.line)
    const parentLine = Lines.findNextLineUpSpacedLeft(textEditor.document, lineOfReferenceForFold, +textEditor.options.tabSize);
    const level = Lines.calculateLineLevel(textEditor, parentLine.lineNumber);

    textEditor.selection = new vscode.Selection(parentLine.lineNumber, 0, parentLine.lineNumber, 0);
    // vscode.commands.executeCommand('editor.foldLevel' + level)
    //     .then(()=> vscode.commands.executeCommand('editor.fold'));
    foldLevel(textEditor, level, parentLine.lineNumber, textEditor.selection)
}

export function foldLevelOfCursor() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    
    const lineOfReferenceForFold = whenBlankLineUsePreviousOrNextLine(textEditor, selection.anchor.line)
    
    const level = Lines.calculateLineLevel(textEditor, lineOfReferenceForFold);
    
    foldLevel(textEditor, level, lineOfReferenceForFold, selection)
}

export function unfoldLevelOfCursor() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    
    const lineOfReferenceForFold = whenBlankLineUsePreviousOrNextLine(textEditor, selection.anchor.line)
    
    const level = Lines.calculateLineLevel(textEditor, lineOfReferenceForFold);
    
    unfoldLevel(textEditor, level, lineOfReferenceForFold, selection)
}

export function foldChildren() {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    const linesToFold = Lines.findAllLinesSpacedOneLevelRight(textEditor.document, selection.active.line, +textEditor.options.tabSize);
    foldLines(linesToFold.filter(line=>Lines.isNextLineDownSpacedRight(textEditor.document,line.lineNumber, +textEditor.options.tabSize)).map(line=>line.lineNumber));
}

export async function foldLines(foldLines: Array<number>) {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    let endOfPreviousRegion = -1;
    for (const lineNumber of foldLines) {
        const foldingRegion = Region.makeRangeFromFoldingRegion(textEditor.document, lineNumber, +textEditor.options.tabSize);
        // Are we outside previous fold and is current line foldable
        // Executing fold on a non-foldable line will fold the parent
        if ((lineNumber > endOfPreviousRegion) && (foldingRegion.end.line !== lineNumber)) {
            endOfPreviousRegion = foldingRegion.end.line;
            textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
            await vscode.commands.executeCommand('editor.fold')
            //console.log('folding ' + textEditor.selection.anchor.line);
        }
    }
    textEditor.selection = selection;
    textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
}  

export async function unfoldLines(foldLines: Array<number>, unfoldRecursively: boolean) {
    const textEditor = vscode.window.activeTextEditor;

    await unfoldLinesAndParents(foldLines, textEditor, unfoldRecursively)
    const rangeOfFirstLine = Region.makeRangeLineStart(foldLines[0])
    textEditor.selection = new vscode.Selection(rangeOfFirstLine.start, rangeOfFirstLine.start)
    textEditor.revealRange(rangeOfFirstLine, vscode.TextEditorRevealType.InCenter);
}  

export async function foldAllExcept(excludedLines: Array<number>) {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    await vscode.commands.executeCommand('editor.foldAll');
    await unfoldLinesAndParents(excludedLines, textEditor, true);
    
    textEditor.selection = selection;
    textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
}

async function unfoldLinesAndParents(requestUnfoldLines: number[], textEditor: vscode.TextEditor, unfoldRecursively: boolean) {
    const linesToUnfold = new Set<number>();

    for (const lineNumber of requestUnfoldLines) {
        textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
        Lines.findLinesByLevelToRoot(textEditor.document, lineNumber, +textEditor.options.tabSize).forEach(line => {
            linesToUnfold.add(line.lineNumber);
        });
        if (unfoldRecursively)
            await vscode.commands.executeCommand('editor.unfoldRecursively');
        else
            await vscode.commands.executeCommand('editor.unfold');
    }

    for (const lineNumber of Array.from(linesToUnfold)) {
        textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
        await vscode.commands.executeCommand('editor.unfold');
    }
}

/**
 * If the line on which the command is executed is blank, then we want to use either the 
 * previous line or next line with text to determine the correct level.
 * In this event, whichever line (previous or next) is the higher level (further right) will be used.
 * 
 * @param editor 
 * @param line 
 */
function whenBlankLineUsePreviousOrNextLine(editor:vscode.TextEditor, line:number) {
    const currentLine = editor.document.lineAt(line)
    if (!currentLine.isEmptyOrWhitespace) return line

    const nextLineup   = Lines.findNextLineUp(  editor.document, line, line => !line.isEmptyOrWhitespace)
    const nextLineDown = Lines.findNextLineDown(editor.document, line, line => !line.isEmptyOrWhitespace)

    const lineUpLevel   = Lines.calculateLineLevel(editor, nextLineup.lineNumber)
    const lineDownLevel = Lines.calculateLineLevel(editor, nextLineDown.lineNumber)

    return lineUpLevel > lineDownLevel ? nextLineup.lineNumber : nextLineDown.lineNumber
}

function foldLevel(editor:vscode.TextEditor, level:number, lineOfReferenceForFold:number, originalSelection:vscode.Selection) {
    if (level < 8) {
        const promises = [];
        promises.push(vscode.commands.executeCommand('editor.foldLevel' + level));

        // Fold current line if it is a foldable line.  If we don't check, vscode will fold parent.
        if (Lines.isNextLineDownSpacedRight(editor.document, lineOfReferenceForFold, +editor.options.tabSize))
            promises.push(vscode.commands.executeCommand('editor.fold'));

        // Restore selection
        Promise.all(promises).then(() => {
            editor.selection = originalSelection;
        })    
    } else {
        const linesToFold = linesByLevel(editor, level)
        foldLines(linesToFold)
    }
}

function unfoldLevel(editor:vscode.TextEditor, level:number, lineOfReferenceForFold:number, originalSelection:vscode.Selection) {
    const linesToFold = linesByLevel(editor, level)
    unfoldLines(linesToFold, false)
}

function linesByLevel(editor:vscode.TextEditor, level: number) {
    const linesToFold = []
    const levels = Lines.calculateAllLineLevels(editor)
    levels.forEach((lineLevel, lineNumber) => {
        if (lineLevel === level) {
            linesToFold.push(lineNumber)
        }
    })

    return linesToFold
}