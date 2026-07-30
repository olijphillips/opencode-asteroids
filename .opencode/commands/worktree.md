---
description: Crea un git worktree en .worktrees/<nombre> a partir del argumento dado.
---

Ejecuta exactamente este comando y nada más. No cambies de directorio. No hagas nada adicional.

1. Toma el texto: `$ARGUMENTS`
2. Normalízalo como nombre de carpeta: reemplaza espacios por guiones (`-`), elimina caracteres especiales, y pásalo a minúsculas.
3. Ejecuta: `git worktree add .worktrees/<nombre-normalizado>`

Solo ejecuta ese comando de git worktree add. Nada más.
