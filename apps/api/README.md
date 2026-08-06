# @manasik/api

Spring Boot 4.1 API. **Not yet scaffolded** — see ROADMAP Phase 2.

## Why there's a `package.json` in a Java project

Turborepo drives every workspace through npm-style scripts. This shim lets
`pnpm dev` / `pnpm build` at the repo root reach Maven. There is no Node code
here and there never should be.

## Why the scripts call `mvn` and not `./mvnw`

The Maven wrapper is committed (from Phase 2 onward) and is the right thing to
use — but it cannot be invoked portably from a package.json script:

- On Linux/macOS the shell needs `./mvnw`, because `.` is not on `PATH`.
- On Windows `cmd` needs the bare `mvnw` so `PATHEXT` resolves `mvnw.cmd`.

One string cannot satisfy both. So the scripts use `mvn` (Maven 3.9.10 is
installed locally), while **CI pins the version by calling `./mvnw` directly**
in the workflow, where the OS is known to be Ubuntu. Same guarantee, no
cross-platform breakage.

If you'd rather not install Maven locally, run the wrapper by hand:

```powershell
.\mvnw.cmd spring-boot:run     # Windows
./mvnw spring-boot:run         # Linux / macOS
```
