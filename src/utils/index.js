import { diffLines as diffLinesOriginal } from "diff";

export function debounce(func, wait) {
    let timeout;

    return function (...args) {
        const context = this;

        clearTimeout(timeout);

        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

export function diffLines(oldText, newText) {
    const changes = diffLinesOriginal(oldText, newText, { newlineIsToken: false });

    let lineNumber = 1;
    const operations = [];

    for (const change of changes) {
        const lines = change.value.split('\n').filter(Boolean);
        const numLines = change.count;
        let newLineNumber = lineNumber;

        if (change.added) {
            for (const line of lines) {
                operations.push({
                    op: 'add',
                    range: {
                        startLineNumber: newLineNumber,
                        startColumn: 1,
                        endLineNumber: newLineNumber,
                        endColumn: 1
                    },
                    text: line
                });

                newLineNumber += 1;
            }
        } else if (change.removed) {
            for (const line of lines) {
                operations.push({
                    op: 'remove',
                    range: {
                        startLineNumber: newLineNumber,
                        startColumn: 1,
                        endLineNumber: newLineNumber,
                        endColumn: line.length + 1
                    }
                });

                newLineNumber += 1;
            }
        }

        if (!change.removed) {
            lineNumber += numLines;
        }
    }

    return operations;
}

export function extractLineNumberFromError(str) {
    const regex = /<anonymous>:(\d+):\d+/;
    const match = str.match(regex);

    if (match && match[1]) {
        return parseInt(match[1], 10);
    } else {
        return null;
    }
}