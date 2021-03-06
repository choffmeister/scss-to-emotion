import { convert } from '../convert'
import { normalize } from '../helpers'

it('flatten nested global', () => {
  const scss = normalize(`
    :global {
      .first {
        color: blue;
        &-second {
          color: red;
          &-third {
            color: green;
            &-forth {
              color: blue;
            }
          }
        }
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { injectGlobal } from 'emotion'

    // tslint:disable-next-line no-unused-expression
    injectGlobal\`
      .first {
        color: blue;
      }
      .first-second {
        color: red;
      }
      .first-second-third {
        color: green;
      }
      .first-second-third-forth {
        color: blue;
      }
    \`
  `))
})

it('flatten nested local', () => {
  const scss = normalize(`
    .first {
      color: blue;
      &-second {
        color: red;
        &-third {
          color: green;
          &-forth {
            color: blue;
          }
        }
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css } from 'emotion'

    export const first = css\`
      color: blue;
    \`

    export const firstSecond = css\`
      color: red;
    \`

    export const firstSecondThird = css\`
      color: green;
    \`

    export const firstSecondThirdForth = css\`
      color: blue;
    \`
  `))
})

it('not flatten nested pseudo 1', () => {
  const scss = normalize(`
    .foo {
      color: blue;
      &:hover {
        color: red;
        &:hover:disabled {
          color: green;
        }
      }
      &:hover form {
        color: yellow;
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css } from 'emotion'

    export const foo = css\`
      color: blue;
      &:hover {
        color: red;
        &:hover:disabled {
          color: green;
        }
      }
      &:hover form {
        color: yellow;
      }
    \`
  `))
})


it('not flatten nested pseudo 2', () => {
  const scss = normalize(`
    .foo:hover {
      color: red;
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    // TODO
    // .foo:hover {
    //   color: red;
    // }
  `))
})

it('nested element selector', () => {
  const scss = normalize(`
    .foo {
      color: red;
      svg {
        color: blue;
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css } from 'emotion'

    export const foo = css\`
      color: red;
      svg {
        color: blue;
      }
    \`
  `))
})

it('nested wildcard selector', () => {
  const scss = normalize(`
    .foo {
      color: red;
      * {
        color: blue;
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css } from 'emotion'

    export const foo = css\`
      color: red;
      * {
        color: blue;
      }
    \`
  `))
})

it('direct child selector', () => {
  const scss = normalize(`
    .foo {
      & > * {
        color: red;
      }
      & > div {
        color: blue;
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css } from 'emotion'

    export const foo = css\`
      & > * {
        color: red;
      }
      & > div {
        color: blue;
      }
    \`
  `))
})

it('convert scss variables to javascript variables', () => {
  const scss = normalize(`
    $first-var: red;

    .foo {
      color: $first-var;
      $second-var: blue;
      &-bar {
        color: $second-var;
      }
    }

    :global {
      $third-var: green;
      .apple {
        color: $third-var;
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css, injectGlobal } from 'emotion'

    // TODO const firstVar = 'red'

    export const foo = css\`
      color: \${firstVar};
    \`

    // tslint:disable-next-line no-unused-expression
    injectGlobal\`
      .apple {
        color: \${thirdVar};
      }
    \`

    // TODO const secondVar = 'blue'

    export const fooBar = css\`
      color: \${secondVar};
    \`

    // TODO const thirdVar = 'green'
  `))
})

it('ignore unsupported atrules', () => {
  const scss = normalize(`
    @import 'foo'
    @keyframes highlighted-bubble-animation {
      name: test;
    }
    @media only screen and (max-width: 768px) {
      color: red;
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    // TODO
    // @import 'foo'

    // TODO
    // @keyframes highlighted-bubble-animation {
    //   name: test;
    // }

    @media only screen and (max-width: 768px) {
      color: red;
    }
  `))
})

it('convert comments', () => {
  const scss = normalize(`
    // test
    /* foo
       bar */
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    /* test */

    /* foo bar */
  `))
})

it('only imports what is needed', () => {
  const scss1 = normalize(``)
  const emotion1 = convert(scss1, 'test.scss', 'scss')
  expect(normalize(emotion1)).toBe(normalize(``))

  const scss2 = normalize(`
    .foo {
      color: red;
    }
  `)
  const emotion2 = convert(scss2, 'test.scss', 'scss')
  expect(normalize(emotion2)).toBe(normalize(`
    import { css } from 'emotion'

    export const foo = css\`
      color: red;
    \`
  `))

  const scss3 = normalize(`
    :global {
      .foo {
        color: red;
      }
    }
  `)
  const emotion3 = convert(scss3, 'test.scss', 'scss')
  expect(normalize(emotion3)).toBe(normalize(`
    import { injectGlobal } from 'emotion'

    // tslint:disable-next-line no-unused-expression
    injectGlobal\`
      .foo {
        color: red;
      }
    \`
  `))
})

it('ignore nested classes', () => {
  const scss = normalize(`
    .first {
      &-inner {
        .forth {
          color: green;
        }
      }
      .second {
        color: red;
      }
      &.third {
        color: blue;
      }
    }
  `)
  const emotion = convert(scss, 'test.scss', 'scss')
  expect(normalize(emotion)).toBe(normalize(`
    import { css } from 'emotion'

    export const first = css\`
      // TODO
      // .second {
      //   color: red;
      // }
      // TODO
      // &.third {
      //   color: blue;
      // }
    \`

    export const firstInner = css\`
      // TODO
      // .forth {
      //   color: green;
      // }
    \`
  `))
})
