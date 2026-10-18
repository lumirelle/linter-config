import { eslint } from '@lumirelle/linter-config/eslint'
import { oxlint } from '@lumirelle/linter-config/oxlint'

async function main(): Promise<void> {
  // Both factories are thenable, so a consumer config awaits them exactly like this.
  const [eslintConfig, oxlintConfig] = await Promise.all([eslint(), oxlint()])

  // oxlint-disable-next-line no-console
  console.log('ESLint emission:', eslintConfig)
  // oxlint-disable-next-line no-console
  console.log('Oxlint emission:', oxlintConfig)
}

void main()
