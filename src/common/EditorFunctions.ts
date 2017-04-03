'use strict';
import * as vscode from 'vscode';



export function makeRangeFromFoldingRegion(document: vscode.TextDocument, lineNumber: number, tabSize: number) {
    const endFoldLine = findNextLineDownSameLevelOrLess(document, lineNumber, tabSize);
    return new vscode.Range(lineNumber, 0, endFoldLine.lineNumber, 0);
}

export function findNextLineDownSameLevelOrLess(document: vscode.TextDocument, lineNumber: number, tabSize: number) {
    const line = document.lineAt(lineNumber);
    const documentLength = document.lineCount;
    let lastSpacing = calculateLineOffsetSpacing(line.text, tabSize);
    for(let index = lineNumber + 1; index < documentLength; index++) {
        const nextLine = document.lineAt(index);
        if ( nextLine.text.length ) {
            const currentSpacing = calculateLineOffsetSpacing(nextLine.text, tabSize);
            if (currentSpacing <= lastSpacing) return nextLine;
        }
    }
    return null;    
}

export function textOfSelectionOrWordAtCursor(document: vscode.TextDocument, selection: vscode.Selection) {
    let range = selection as vscode.Range;
    if (selection.isEmpty) {
        range = document.getWordRangeAtPosition(new vscode.Position(selection.anchor.line, selection.anchor.character));
    } 
    return document.getText(range);
}

export function findAllLineNumbersContaining(document: vscode.TextDocument, text: string) {
    let lineNumbers = Array<number>();
    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        if (line.text.includes(text)) lineNumbers.push(line.lineNumber);
    }
    return lineNumbers;
}

export function calculateLineLevel(textEditor: vscode.TextEditor, lineNumber: number) {
    let level = 1;
    let nextLine = findLineNextLevelUp(textEditor, lineNumber);
    while(nextLine) {
        level++;
        nextLine = findLineNextLevelUp(textEditor, nextLine.lineNumber);
    }
    return level;
}

export function findLinesByLevelToRoot(textEditor: vscode.TextEditor, lineNumber: number) {
    const lines = [textEditor.document.lineAt(lineNumber)];
    let nextLine = findLineNextLevelUp(textEditor, lineNumber);
    while(nextLine) {
        lines.push(nextLine);
        nextLine = findLineNextLevelUp(textEditor, nextLine.lineNumber);
    }
    return lines;
}

export function findLineNextLevelUp(textEditor: vscode.TextEditor, lineNumber: number) {
    const line = textEditor.document.lineAt(lineNumber);
    const tabSize = +textEditor.options.tabSize;
    let lastSpacing = calculateLineOffsetSpacing(line.text, tabSize);
    for(let index = lineNumber; index >= 0; index--) {
        const line = textEditor.document.lineAt(index);
        if ( line.text.length ) {
            const currentSpacing = calculateLineOffsetSpacing(line.text, tabSize);
            if (currentSpacing < lastSpacing) return line;
        }
    }
    return null;
}

export function calculateLineOffsetSpacing(lineText: string, tabSize: number): number {
    let spacing = 0;
    for(let index = 0; index < lineText.length; index++) {
        if (lineText.charAt(index) === ' ') spacing++;
        else if (lineText.charAt(index) === '\t') spacing += tabSize;
        else break;
    }
    return spacing;
}