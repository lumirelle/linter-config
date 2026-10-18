import { describePackagesApiSnapshots } from 'tsnapi/vitest'

describePackagesApiSnapshots({
  filter({ packageName }) {
    if (['node_modules', '@typescript/native-preview', 'vscode-jsonrpc'].some(str => packageName.includes(str))) {
      return false
    }
    return true
  },
})
