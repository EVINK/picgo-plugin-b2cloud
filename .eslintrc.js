module.exports = {
    //ESLint的解析器换成 @typescript-eslint/parser 用于解析ts文件
    'parser': '@typescript-eslint/parser',
    // 让ESLint继承 @typescript-eslint/recommended 定义的规则
    'extends': ['plugin:@typescript-eslint/recommended'],
    'env': { 'node': true },
    'rules': {
        'semi': ['error', 'never'],
        'semi-style': ['error', 'last'],
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        '@typescript-eslint/indent': ['error', 4, { 'SwitchCase': 1 }],
        'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1, 'maxBOF': 0 }],
        'quotes': ['error', 'single'],
        'keyword-spacing': ['error', { 'before': true, 'after': true }],
        'key-spacing': ['error', { 'afterColon': true, 'beforeColon': false }],
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'always',
            'asyncArrow': 'always'
        }],
        'no-multi-spaces': ['error', { ignoreEOLComments: true }],
        'no-await-in-loop': 'error',
        'require-await': 'error',
        'no-async-promise-executor': 1,
        'prefer-promise-reject-errors': 'error',
        'require-await': 'error',
        'no-return-await': 2,
        'no-useless-catch': 'error',
        '@typescript-eslint/no-var-requires': 0,
    }

}
