'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('dakara-foldplus.levelAtCursor', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const level = calculateLineLevel(textEditor, selection.anchor.line);
        vscode.commands.executeCommand('editor.foldLevel' + level);
        vscode.commands.executeCommand('editor.fold');
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('dakara-foldplus.selection', () => {
        const textEditor = vscode.window.activeTextEditor;   
        const selection = textEditor.selection;
        const textForFold = textOfSelectionOrWordAtCursor(textEditor.document, selection);
        let endOfPreviousRegion = 0;
        findAllLineNumbersContaining(textEditor.document, textForFold).forEach( lineNumber => {
            console.log('line containing match: ' + lineNumber + ' end of previous' + endOfPreviousRegion);
            const foldingRegion = makeRangeFromFoldingRegion(textEditor.document, lineNumber, +textEditor.options.tabSize);
            console.log('folding region' + foldingRegion.start.line + ' : ' + foldingRegion.end.line);
            // TODO have option to fold with selected at same level or not fold sub regions
            if ((lineNumber > endOfPreviousRegion) && (foldingRegion.end.line - foldingRegion.start.line > 1)) {
                endOfPreviousRegion = foldingRegion.end.line;
                console.log('folding: ' + lineNumber);
                textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
                vscode.commands.executeCommand('editor.fold');
            }
        });
    });
    context.subscriptions.push(disposable);
    
    disposable = vscode.commands.registerCommand('dakara-foldplus.selection.exclude', () => {
        const textEditor = vscode.window.activeTextEditor; 
        const selection = textEditor.selection;       
        vscode.commands.executeCommand('editor.foldAll').then(()=>{
            const promises = [];
            const textForFold = textOfSelectionOrWordAtCursor(textEditor.document, selection);
            const linesToUnfold = new Set<number>();
            findAllLineNumbersContaining(textEditor.document, textForFold).forEach( lineNumber => {
                textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
                findLinesByLevelToRoot(textEditor, lineNumber).forEach(line => {
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

function makeRangeFromFoldingRegion(document: vscode.TextDocument, lineNumber: number, tabSize: number) {
    const endFoldLine = findNextLineDownSameLevelOrLess(document, lineNumber, tabSize);
    return new vscode.Range(lineNumber, 0, endFoldLine.lineNumber, 0);
}

function findNextLineDownSameLevelOrLess(document: vscode.TextDocument, lineNumber: number, tabSize: number) {
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

function textOfSelectionOrWordAtCursor(document: vscode.TextDocument, selection: vscode.Selection) {
    let range = selection as vscode.Range;
    if (selection.isEmpty) {
        range = document.getWordRangeAtPosition(new vscode.Position(selection.anchor.line, selection.anchor.character));
    } 
    return document.getText(range);
}

function findAllLineNumbersContaining(document: vscode.TextDocument, text: string) {
    let lineNumbers = Array<number>();
    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        if (line.text.includes(text)) lineNumbers.push(line.lineNumber);
    }
    return lineNumbers;
}

function calculateLineLevel(textEditor: vscode.TextEditor, lineNumber: number) {
    let level = 1;
    let nextLine = findLineNextLevelUp(textEditor, lineNumber);
    while(nextLine) {
        level++;
        nextLine = findLineNextLevelUp(textEditor, nextLine.lineNumber);
    }
    return level;
}

function findLinesByLevelToRoot(textEditor: vscode.TextEditor, lineNumber: number) {
    const lines = [textEditor.document.lineAt(lineNumber)];
    let nextLine = findLineNextLevelUp(textEditor, lineNumber);
    while(nextLine) {
        lines.push(nextLine);
        nextLine = findLineNextLevelUp(textEditor, nextLine.lineNumber);
    }
    return lines;
}

function findLineNextLevelUp(textEditor: vscode.TextEditor, lineNumber: number) {
    const line = textEditor.document.lineAt(lineNumber);
    const tabSize = +textEditor.options.tabSize;
    let lastSpacing = calculateLineOffsetSpacing(line.text, tabSize);
    for(let index = lineNumber; index > 0; index--) {
        const line = textEditor.document.lineAt(index);
        if ( line.text.length ) {
            const currentSpacing = calculateLineOffsetSpacing(line.text, tabSize);
            if (currentSpacing < lastSpacing) return line;
        }
    }
    return null;
}

function calculateLineOffsetSpacing(lineText: string, tabSize: number): number {
    let spacing = 0;
    for(let index = 0; index < lineText.length; index++) {
        if (lineText.charAt(index) === ' ') spacing++;
        else if (lineText.charAt(index) === '\t') spacing += tabSize;
        else break;
    }
    return spacing;
}

export function deactivate() {
}