Bloomora is deployed using Cloudflare Workers Static Assets.

Target: https://bloomora.atollingo.com
Worker: atollingo-bloomora
Original source commit: 58752a0f44b0fe25ed8b989bd82cf7dc0d2ffa0a

Learning improvements add free staged help, relaxed mode, visible coral restoration,
rule explanations, targeted practice and complete BLOOM2 progress backups.
The service-worker cache version is bumped with each public release.

Run `node build.cjs`, then authenticated Wrangler `deploy` from this folder.
Only runtime HTML, styles, scripts, icons, manifest and service worker are packaged.
The deployment excludes repository metadata, tests, and assessment files.
