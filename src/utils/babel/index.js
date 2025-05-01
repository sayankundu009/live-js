export function customLogTransformPlugin({ types }) {
    return {
        visitor: {
            CallExpression(path) {
                const isConsoleLog = types.isMemberExpression(path.node.callee) &&
                    path.node.callee.object.name === "console" &&
                    path.node.callee.property.name === "log";

                if (isConsoleLog) {
                    const line = path.node.loc.start.line;

                    const customLogger = types.callExpression(
                        types.identifier("customLogFunction"),
                        [types.numericLiteral(line), ...path.node.arguments]
                    );

                    path.replaceWith(customLogger);
                }
            },
        },
    };
}

export function infiniteLoopSafetyPlugin({ types }) {
    return {
        visitor: {
            WhileStatement(path) {
                addLoopCheck(path, types);
            },
            ForStatement(path) {
                addLoopCheck(path, types);
            },
            DoWhileStatement(path) {
                addLoopCheck(path, types);
            },
        }
    };
}

export function replaceCommentsPlugin() {
    return {
        visitor: {
            Program(path) {
                path.traverse({
                    enter(path) {
                        if (path.node.leadingComments) {
                            path.node.leadingComments.forEach(comment => {
                                if (comment.type === "CommentLine") {
                                    comment.type = "CommentBlock";
                                    comment.value = comment.value;
                                }
                            });
                        }
                        if (path.node.trailingComments) {
                            path.node.trailingComments.forEach(comment => {
                                if (comment.type === "CommentLine") {
                                    comment.type = "CommentBlock";
                                    comment.value = comment.value;
                                }
                            });
                        }
                    },
                });
            },
        },
    };
}

function addLoopCheck(path, types) {
    const iterationLimit = 10000;
    const errorMessage = `🔄 Whoa there! Infinite loop detected! 🛑`;
    const loopBody = path.get("body");
    const lineNumber = loopBody.node.loc?.start?.line || 0;

    const counterName = path.scope.generateUidIdentifier("loopCounter");

    const counterDeclaration = types.variableDeclaration("let", [
        types.variableDeclarator(counterName, types.numericLiteral(0))
    ]);

    const counterIncrement = types.expressionStatement(
        types.updateExpression("++", counterName)
    );

    const onErrorCall = types.callExpression(
        types.identifier("onError"),
        [
            types.newExpression(types.identifier("Error"), [types.stringLiteral(errorMessage)]),
            types.numericLiteral(lineNumber)
        ]
    );

    const limitCheck = types.ifStatement(
        types.binaryExpression(
            ">",
            counterName,
            types.numericLiteral(iterationLimit)
        ),
        types.blockStatement([
            types.expressionStatement(
                onErrorCall
            ),
            types.breakStatement(),
        ])
    );

    const bodyStatements = types.isBlockStatement(loopBody.node)
        ? loopBody.node.body
        : [loopBody.node];

    const newBody = types.blockStatement([
        counterIncrement,
        limitCheck,
        ...bodyStatements
    ]);

    path.insertBefore(counterDeclaration);

    loopBody.replaceWith(newBody);
}
