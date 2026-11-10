# TODO

The structure of the separate `xpm-package.json`:

```json
{
    "minimumXpmRequired": "2.0.0",
    "license": "MIT",
    "copyright": "Copyright (c) 2022-2026 Liviu Ionescu. All rights reserved."
    "xpmPackage": {
        "dependencies": {},
        "devDependencies": {},
        "properties": {},
        "actions": {},
        "buildConfigurations": {}
    }
}
```

The file is searched in `config` and in the project root.

If no separate file is found, for compatibility with older configurations,
the `xpack` property in top `package.json` is used.

Command line options:

- `--config-file`, `--config`, `-c`
- `--build-configuration`, `build-config`, `-b`
- `--all-build-configurations`, `--all-build-configs`, `--all-configs`, `-a`

For version pre 0.