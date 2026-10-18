import type { ConfigObject } from '../types'
import { GLOB_JSON } from '../globs'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/pnpm.ts`: `eslint-plugin-pnpm` keeps `package.json` and `pnpm-workspace.yaml`
 * in the shape pnpm expects.
 *
 * The Module is opt-in twice over, exactly as Upstream has it: Source turns it on only when the
 * project has a `pnpm-workspace.yaml` (see {@link Options.pnpm}), and `catalogs` additionally
 * gates `pnpm/json-enforce-catalog` on the workspace actually declaring catalogs.
 *
 * `package.json` is read through the `jsonc` Module's `jsonc/x` language, so the plugin has to
 * register nothing of its own for it; the YAML objects carry `yaml-eslint-parser`.
 */
export function pnpm(options: {
  catalogs?: boolean
  isInEditor?: boolean
  json?: boolean
  sort?: boolean
  stylistic?: boolean
  yaml?: boolean
} = {}): ConfigObject[] {
  const {
    catalogs = false,
    isInEditor = false,
    json = true,
    sort = true,
    stylistic = false,
    yaml = true,
  } = options

  const configs: ConfigObject[] = []

  if (json) {
    configs.push({
      name: 'lumirelle/pnpm/package-json',
      module: 'pnpm',
      domain: 'data',
      files: ['package.json', GLOB_JSON],
      tools: {
        eslint: { language: 'jsonc/x' },
      },
      plugins: {
        pnpm: pluginRef('pnpm'),
      },
      rules: {
        ...catalogs
          ? {
              'pnpm/json-enforce-catalog': [
                'error' as const,
                { autofix: !isInEditor, ignores: ['@types/vscode'] },
              ],
            }
          : {},
        'pnpm/json-prefer-workspace-settings': ['error', { autofix: !isInEditor }],
        'pnpm/json-valid-catalog': ['error', { autofix: !isInEditor }],
      },
    })
  }

  if (yaml) {
    configs.push({
      name: 'lumirelle/pnpm/pnpm-workspace-yaml',
      module: 'pnpm',
      domain: 'data',
      files: ['pnpm-workspace.yaml'],
      tools: {
        eslint: { parser: pluginRef('yaml') },
      },
      plugins: {
        pnpm: pluginRef('pnpm'),
      },
      rules: {
        'pnpm/yaml-enforce-settings': ['error', {
          settings: {
            minimumReleaseAgeExcludePrune: true,
            shellEmulator: true,
            trustPolicy: 'no-downgrade',
          },
        }],
        'pnpm/yaml-no-duplicate-catalog-item': 'error',
        'pnpm/yaml-no-unused-catalog-item': 'error',
      },
    })

    if (stylistic) {
      configs.push({
        name: 'lumirelle/pnpm/pnpm-workspace-yaml-stylistic',
        module: 'pnpm',
        domain: 'data',
        files: ['pnpm-workspace.yaml'],
        tools: {
          eslint: { parser: pluginRef('yaml') },
        },
        plugins: {
          pnpm: pluginRef('pnpm'),
        },
        rules: {
          'pnpm/yaml-blank-lines': 'error',
        },
      })
    }

    if (sort) {
      configs.push({
        name: 'lumirelle/pnpm/pnpm-workspace-yaml-sort',
        module: 'pnpm',
        domain: 'data',
        files: ['pnpm-workspace.yaml'],
        tools: {
          eslint: { parser: pluginRef('yaml') },
        },
        plugins: {
          yaml: pluginRef('yaml'),
        },
        rules: {
          'yaml/sort-keys': [
            'error',
            {
              order: [
                // Workspace
                // @keep-sorted

                // Build approvals
                'allowBuilds',

                // Dependency resolution
                'allowedDeprecatedVersions',

                // Misc
                // @keep-sorted
                'allowNonAppliedPatches',

                // Audit and versioning
                // @keep-sorted
                'audit',

                // Peer dependencies
                // @keep-sorted
                'autoInstallPeers',
                'blockExoticSubdeps',

                // Directories and pnpmfile
                // @keep-sorted
                'cacheDir',

                // Catalogs, usually the largest blocks
                'catalog',

                // Catalogs
                // @keep-sorted
                'catalogMode',
                'catalogPrune',
                'catalogs',

                // Scripts and builds
                // @keep-sorted
                'childConcurrency',

                // CLI and output
                // @keep-sorted
                'ci',
                'cleanupUnusedCatalogs',
                'color',
                'configDependencies',
                'dangerouslyAllowAllBuilds',
                'dedupeDirectDeps',
                'dedupeInjectedDeps',
                'dedupePeerDependents',
                'dedupePeers',
                'deployAllFiles',
                'disallowWorkspaceCycles',

                // node_modules
                // @keep-sorted
                'dlxCacheMaxAge',
                'enableGlobalVirtualStore',
                'enableModulesDir',
                'enablePrePostScripts',
                'engineStrict',
                'extendNodePath',
                'failIfNoMatch',

                // Registry and network
                // @keep-sorted
                'fetchMinSpeedKiBps',
                'fetchRetries',
                'fetchRetryFactor',
                'fetchRetryMaxtimeout',
                'fetchRetryMintimeout',
                'fetchTimeout',
                'fetchWarnTimeoutMs',

                // Store
                // @keep-sorted
                'frozenStore',

                // Lockfile
                // @keep-sorted
                'gitBranchLockfile',
                'gitShallowHosts',
                'globalBinDir',
                'globalDir',
                'globalPnpmfile',
                'globalShims',

                // Hoisting
                // @keep-sorted
                'hoist',
                'hoistingLimits',
                'hoistPattern',
                'hoistWorkspacePackages',
                'httpProxy',
                'httpsProxy',
                'ignoreCompatibilityDb',
                // Superseded by `allowBuilds` in pnpm v11
                // @keep-sorted
                'ignoredBuiltDependencies',
                'ignoreDepScripts',
                'ignoredOptionalDependencies',
                'ignorePnpmfile',
                'ignoreScripts',
                'ignoreWorkspaceCycles',
                'ignoreWorkspaceRootCheck',
                'includeWorkspaceRoot',
                'initAuthorEmail',
                'initAuthorName',
                'initAuthorUrl',
                'initLicense',
                'initVersion',
                'injectWorkspacePackages',
                'legacyDirFiltering',
                'linkWorkspacePackages',
                'localAddress',
                'lockfile',
                'lockfileIncludeTarballUrl',
                'loglevel',

                // Node.js and package manager versions
                // @keep-sorted
                'managePackageManagerVersions',
                'maxsockets',
                'mergeGitBranchLockfilesBranchPattern',
                'minimumReleaseAge',
                'minimumReleaseAgeExclude',
                'minimumReleaseAgeExcludePrune',
                'minimumReleaseAgeIgnoreMissingTime',
                'minimumReleaseAgeStrict',
                'modulesCacheMaxAge',
                'modulesDir',
                'namedRegistries',
                'networkConcurrency',
                'neverBuiltDependencies',
                'nodeDownloadMirrors',
                'nodeExperimentalPackageMap',
                'nodeLinker',
                'nodeOptions',
                'nodePackageMapType',
                'nodeVersion',
                'noProxy',
                'npmPath',
                'npmrcAuthFile',
                'onlyBuiltDependencies',
                'onlyBuiltDependenciesFile',
                'optimisticRepeatInstall',
                'overrides',
                'packageConfigs',
                'packageExtensions',
                'packageImportMethod',
                'packageManagerStrict',
                'packageManagerStrictVersion',

                // Workspace layout and dependency declarations, ordered by how
                // a `pnpm-workspace.yaml` usually reads top to bottom
                'packages',
                'patchedDependencies',
                'peerDependencyRules',
                'peersSuffixMaxLength',
                'pmOnFail',
                'pnpmfile',
                'preferFrozenLockfile',
                'preferSymlinkedExecutables',
                'preferWorkspacePackages',
                'publicHoistPattern',
                'recursiveInstall',
                'registries',
                'registry',
                'registrySupportsTimeField',
                'requiredScripts',
                'resolutionMode',
                'resolvePeersFromWorkspaceRoot',
                'runtimeOnFail',
                'saveExact',
                'savePrefix',
                'saveWorkspaceProtocol',
                'scriptShell',
                'shamefullyHoist',
                'sharedWorkspaceLockfile',
                'shellEmulator',
                'sideEffectsCache',
                'sideEffectsCacheReadonly',
                'stateDir',
                'storeDir',
                'strictDepBuilds',
                'strictPeerDependencies',
                'strictSsl',
                'strictStorePkgContentCheck',
                'supportedArchitectures',
                'symlink',
                'syncInjectedDepsAfterScripts',
                'tag',
                'trustLockfile',
                'trustPolicy',
                'trustPolicyExclude',
                'trustPolicyIgnoreAfter',
                'unsafePerm',
                'update',
                'updateNotifier',
                'useBetaCli',
                'useRunningStoreServer',
                'useStderr',
                'verifyDepsBeforeRun',
                'verifyStoreIntegrity',
                'versioning',
                'virtualStoreDir',
                'virtualStoreDirMaxLength',
                'virtualStoreOnly',
                'virtualStoreType',
              ],
            },
            {
              order: { type: 'asc' },
              pathPattern: '.*',
            },
          ],
        },
      })
    }
  }

  return configs
}
