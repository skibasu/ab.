module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // file-type (used by music-metadata) contains /v regexes unsupported by Hermes.
    plugins: ['@babel/plugin-transform-unicode-sets-regex'],
    overrides: [
      {
        test: (filename) =>
          Boolean(
            filename && /node_modules[/\\]file-type[/\\]source[/\\]index\.js$/.test(filename),
          ),
        plugins: [
          function disableNodeOnlyImports({ types: t }) {
            return {
              visitor: {
                // file-type's Node-only stream helpers use import(variable), which
                // Hermes cannot compile. Buffer parsing never calls this helper.
                FunctionDeclaration(path) {
                  if (path.node.id?.name !== 'importAtRuntime') return;
                  path.node.body = t.blockStatement([
                    t.throwStatement(
                      t.newExpression(t.identifier('Error'), [
                        t.stringLiteral(BUILD_ERROR_MESSAGES.nodeStreamsUnavailable),
                      ]),
                    ),
                  ]);
                },
              },
            };
          },
        ],
      },
    ],
  };
};
const { BUILD_ERROR_MESSAGES } = require('./tooling-messages.cjs');
