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
            ...[
              'dedupeInjectedDeps',
              'disallowWorkspaceCycles',
              'failIfNoMatch',
              'ignoreWorkspaceCycles',
              'ignoreWorkspaceRootCheck',
              'includeWorkspaceRoot',
              'injectWorkspacePackages',
              'legacyDirFiltering',
              'linkWorkspacePackages',
              'preferWorkspacePackages',
              'saveWorkspaceProtocol',
              'sharedWorkspaceLockfile',
              'syncInjectedDepsAfterScripts',
            ],

            // Catalogs
            // @keep-sorted
            ...[
              'catalogMode',
              'catalogPrune',
              'cleanupUnusedCatalogs',
            ],

            // Dependency resolution
            ...[
              'allowedDeprecatedVersions',
              'blockExoticSubdeps',
              'ignoredOptionalDependencies',
              'minimumReleaseAge',
              'minimumReleaseAgeIgnoreMissingTime',
              'minimumReleaseAgeStrict',
              'minimumReleaseAgeExcludePrune',
              'minimumReleaseAgeExclude',
              'registrySupportsTimeField',
              'resolutionMode',
              'supportedArchitectures',
              'trustLockfile',
              'trustPolicy',
              'trustPolicyIgnoreAfter',
              'trustPolicyExclude',
              'update',
            ],

            // Peer dependencies
            // @keep-sorted
            ...[
              'autoInstallPeers',
              'dedupePeerDependents',
              'dedupePeers',
              'peerDependencyRules',
              'resolvePeersFromWorkspaceRoot',
              'strictPeerDependencies',
            ],

            // Registry and network
            // @keep-sorted
            ...[
              'fetchMinSpeedKiBps',
              'fetchRetries',
              'fetchRetryFactor',
              'fetchRetryMaxtimeout',
              'fetchRetryMintimeout',
              'fetchTimeout',
              'fetchWarnTimeoutMs',
              'gitShallowHosts',
              'httpProxy',
              'httpsProxy',
              'localAddress',
              'maxsockets',
              'namedRegistries',
              'networkConcurrency',
              'noProxy',
              'registries',
              'registry',
              'strictSsl',
            ],

            // node_modules
            // @keep-sorted
            ...[
              'dlxCacheMaxAge',
              'enableGlobalVirtualStore',
              'enableModulesDir',
              'extendNodePath',
              'modulesCacheMaxAge',
              'modulesDir',
              'nodeExperimentalPackageMap',
              'nodeLinker',
              'nodePackageMapType',
              'packageImportMethod',
              'preferSymlinkedExecutables',
              'symlink',
              'virtualStoreDir',
              'virtualStoreDirMaxLength',
              'virtualStoreOnly',
              'virtualStoreType',
            ],

            // Hoisting
            // @keep-sorted
            ...[
              'hoist',
              'hoistingLimits',
              'hoistPattern',
              'hoistWorkspacePackages',
              'publicHoistPattern',
              'shamefullyHoist',
            ],

            // Store
            // @keep-sorted
            ...[
              'frozenStore',
              'storeDir',
              'strictStorePkgContentCheck',
              'useRunningStoreServer',
              'verifyStoreIntegrity',
            ],

            // Lockfile
            // @keep-sorted
            ...[
              'gitBranchLockfile',
              'lockfile',
              'lockfileIncludeTarballUrl',
              'mergeGitBranchLockfilesBranchPattern',
              'peersSuffixMaxLength',
              'preferFrozenLockfile',
            ],

            // Scripts and builds
            // @keep-sorted
            ...[
              'childConcurrency',
              'dangerouslyAllowAllBuilds',
              'enablePrePostScripts',
              'ignoreDepScripts',
              'ignoreScripts',
              'nodeOptions',
              'requiredScripts',
              'scriptShell',
              'shellEmulator',
              'sideEffectsCache',
              'sideEffectsCacheReadonly',
              'strictDepBuilds',
              'unsafePerm',
              'verifyDepsBeforeRun',
            ],

            // Node.js and package manager versions
            // @keep-sorted
            ...[
              'managePackageManagerVersions',
              'nodeDownloadMirrors',
              'nodeVersion',
              'packageManagerStrict',
              'packageManagerStrictVersion',
              'pmOnFail',
              'runtimeOnFail',
            ],

            // CLI and output
            // @keep-sorted
            ...[
              'ci',
              'color',
              'engineStrict',
              'loglevel',
              'npmPath',
              'recursiveInstall',
              'updateNotifier',
              'useBetaCli',
              'useStderr',
            ],

            // Directories and pnpmfile
            // @keep-sorted
            ...[
              'cacheDir',
              'globalBinDir',
              'globalDir',
              'globalPnpmfile',
              'globalShims',
              'ignorePnpmfile',
              'npmrcAuthFile',
              'pnpmfile',
              'stateDir',
            ],

            // Audit and versioning
            // @keep-sorted
            ...[
              'audit',
              'versioning',
            ],

            // Misc
            // @keep-sorted
            ...[
              'allowNonAppliedPatches',
              'dedupeDirectDeps',
              'deployAllFiles',
              'ignoreCompatibilityDb',
              'initAuthorEmail',
              'initAuthorName',
              'initAuthorUrl',
              'initLicense',
              'initVersion',
              'optimisticRepeatInstall',
              'saveExact',
              'savePrefix',
              'tag',
            ],

            // Workspace layout and dependency declarations, ordered by how
            // a `pnpm-workspace.yaml` usually reads top to bottom
            'packages',
            'packageConfigs',
            'overrides',
            'packageExtensions',
            'patchedDependencies',
            'configDependencies',

            // Build approvals
            'allowBuilds',
            // Superseded by `allowBuilds` in pnpm v11
            // @keep-sorted
            ...[
              'ignoredBuiltDependencies',
              'neverBuiltDependencies',
              'onlyBuiltDependencies',
              'onlyBuiltDependenciesFile',
            ],

            // Catalogs, usually the largest blocks
            'catalog',
            'catalogs',
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
