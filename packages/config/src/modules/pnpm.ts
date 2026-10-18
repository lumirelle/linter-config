import type { ConfigObject } from '../types'
import { GLOB_JSON } from '../globs'
import { pluginRef } from '../plugins'

/**
 * The `pnpm-workspace.yaml` keys Upstream orders, as `pathPattern: '^$'` scopes them to the root map.
 * Transcribed from Upstream's `configs/pnpm.ts`, whose groups carry the reading order pnpm documents.
 */
const WORKSPACE_YAML_ORDER: readonly string[] = [
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
  'catalogMode',
  'catalogPrune',
  'cleanupUnusedCatalogs',
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
  'autoInstallPeers',
  'dedupePeerDependents',
  'dedupePeers',
  'peerDependencyRules',
  'resolvePeersFromWorkspaceRoot',
  'strictPeerDependencies',
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
  'hoist',
  'hoistingLimits',
  'hoistPattern',
  'hoistWorkspacePackages',
  'publicHoistPattern',
  'shamefullyHoist',
  'frozenStore',
  'storeDir',
  'strictStorePkgContentCheck',
  'useRunningStoreServer',
  'verifyStoreIntegrity',
  'gitBranchLockfile',
  'lockfile',
  'lockfileIncludeTarballUrl',
  'mergeGitBranchLockfilesBranchPattern',
  'peersSuffixMaxLength',
  'preferFrozenLockfile',
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
  'managePackageManagerVersions',
  'nodeDownloadMirrors',
  'nodeVersion',
  'packageManagerStrict',
  'packageManagerStrictVersion',
  'pmOnFail',
  'runtimeOnFail',
  'ci',
  'color',
  'engineStrict',
  'loglevel',
  'npmPath',
  'recursiveInstall',
  'updateNotifier',
  'useBetaCli',
  'useStderr',
  'cacheDir',
  'globalBinDir',
  'globalDir',
  'globalPnpmfile',
  'globalShims',
  'ignorePnpmfile',
  'npmrcAuthFile',
  'pnpmfile',
  'stateDir',
  'audit',
  'versioning',
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
  'packages',
  'packageConfigs',
  'overrides',
  'packageExtensions',
  'patchedDependencies',
  'configDependencies',
  'allowBuilds',
  'ignoredBuiltDependencies',
  'neverBuiltDependencies',
  'onlyBuiltDependencies',
  'onlyBuiltDependenciesFile',
  'catalog',
  'catalogs',
]

/**
 * Upstream's `configs/pnpm.ts`: `eslint-plugin-pnpm` keeps `package.json` and `pnpm-workspace.yaml`
 * in the shape pnpm expects.
 *
 * The Module is opt-in twice over, exactly as Upstream has it: Source turns it on only when the
 * project has a `pnpm-workspace.yaml` (see {@link Options.pnpm}), and `catalogs` additionally
 * gates `pnpm/json-enforce-catalog` on the workspace actually declaring catalogs.
 *
 * `package.json` is read through the `jsonc` Module's `jsonc/x` language, which the plugin needs
 * and does not register itself; the YAML objects carry the `yaml` Plugin's parser.
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
                'error',
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
              order: WORKSPACE_YAML_ORDER,
              pathPattern: '^$',
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
