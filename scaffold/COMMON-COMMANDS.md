> KIT · [agnostic] — Operating cheat-sheet: environment, ports/hosts, installed CLI tools, pre-commit quality routine, process/OOM/port management. The skeleton applies everywhere; fill in the values for your environment.

# COMMON-COMMANDS.md — {{PROJECT}} operating cheat-sheet

> Most-used commands on **this** environment. For project instructions see `CLAUDE.md`; this file is just the cheat-sheet.
> Stack: {{STACK}} · package manager: {{PKG_MANAGER}} · process manager: {{PROCESS_MANAGER}}.

---

## Environment at a glance

| What | Where |
|------|------|
| Repo | `{{REPO_PATH}}` |
| Dev DB | {{DB}} (host/port/credentials) |
| Persistent dev services | under **{{PROCESS_MANAGER}}** (see below) |
| Dev domain | `{{DOMAIN_DEV}}` |
| Prod domain | `{{DOMAIN_PROD}}` |

**Ports / hosts in use** (check with `ss -ltnp`):

| Port | Process | Host |
|-------|----------|------|
| <port> | <app> | `{{DOMAIN_DEV}}` |

> 🚫 **NO `localhost` in the browser**: if {{OPERATOR}} works via a remote editor, pages can **only** be seen on the subdomains (`{{DOMAIN_DEV}}`), never at `http://localhost:port`. Note known port collisions here (e.g. two apps on the same port can't run together).

---

## Installed CLI tools

> **What you already have available** (system binaries, not project dependencies). Updated <date>.
> Golden rule: **don't install anything without {{OPERATOR}}'s explicit consent**. If you need a tool listed under "NOT installed", **ask** — no `apt install` / `npm i -g` / `pip install` / `npx -y`.

| Tool | Path | Version | What it's for |
|------|------|----------|--------------|
| <tool> | `/usr/bin/<tool>` | <ver> | <use> |

> Project tools (linter, build, etc.) run from the repo via `{{PKG_MANAGER}}` / `node_modules/.bin/`, **not** at the system level.

### ❌ NOT installed (ask before installing)

<explicit list of tools commonly assumed present but missing — so the agent doesn't take them for granted>

---

## Development

```bash
# All packages in dev
{{PKG_MANAGER}} dev

# A single package / app
{{PKG_MANAGER}} --filter <pkg> dev

# Build / clean
{{PKG_MANAGER}} build
{{PKG_MANAGER}} clean
```

---

## Quality — the routine BEFORE committing

```bash
{{PKG_MANAGER}} lint:fix && {{PKG_MANAGER}} check && {{PKG_MANAGER}} test
```

| Command | What it does |
|---------|---------|
| `{{PKG_MANAGER}} lint:fix` | Auto-fix format + lint. **Mandatory**: CI treats a format diff as an error |
| `{{PKG_MANAGER}} lint` | Check without writing (like CI) |
| `{{PKG_MANAGER}} check` | Typecheck on every package |
| `{{PKG_MANAGER}} test` | Test suite (note here if DB tests must run **serially** to avoid false reds) |

---

## Database (if applicable)

```bash
{{PKG_MANAGER}} db:up      # starts the dev DB
{{PKG_MANAGER}} db:down    # stops it
{{PKG_MANAGER}} db:reset   # ⚠️ DELETES the data and recreates it
```

---

## {{PROCESS_MANAGER}} — persistent dev services

```bash
<list>            # status + CPU/RAM per process
<logs> <name>     # logs for a service
<restart> <name>  # restarts
<stop> <name>     # stops (no respawn)
```

> ⚠️ If processes **respawn**, killing the child PID by hand isn't enough: use the process manager's commands (`stop`/`delete`), not `kill`.

---

## Monitoring resources / checking for OOM

```bash
free -h                                  # RAM
df -h /                                  # disk
uptime                                   # load average (if > CPU count you're overloaded)
ps aux --sort=-%mem | head -12           # top RAM
htop                                     # interactive view (q to quit)

# OOM kills (if the machine went OOM under full load):
journalctl -k --since "1 hour ago" | grep -i -E "oom|killed process"
dmesg | grep -i -E "oom|killed process"
```

> On machines with limited RAM, a prod build + full test suite + all services together can trigger the OOM-killer. Before heavy operations, run `free -h` and stop unneeded services.

---

## Finding and killing a resource-hogging process

```bash
ps aux --sort=-%cpu | head        # identify the culprit
pgrep -af <pattern>               # check FIRST what you'd be hitting
kill <PID>                        # SIGTERM (clean)
kill -9 <PID>                     # SIGKILL (last resort)
```

> Rules: **never** `kill -9` the DB lightly (corruption/hanging connections — prefer a clean restart); services under the process manager **respawn** if killed by hand; always check with `pgrep -af <pattern>` *before* a `pkill`.

---

## Ports: who's on it / how to free it

```bash
ss -ltnp                          # all ports in LISTEN + PID/process
ss -ltnp | grep :<port>           # who's holding the port
lsof -i :<port>                   # alternative
readlink /proc/<PID>/cwd          # working dir of a PID (figure out WHICH app it is)
```
