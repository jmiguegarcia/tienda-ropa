---
name: git-commit
description: Analiza los cambios pendientes del repositorio y entrega un plan de commits (Conventional Commits) y push con los comandos exactos, sin ejecutarlos. Úsala cuando el usuario escriba /git-commit o diga "estoy listo para hacer commit y push".
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git remote:*), Bash(git branch:*), Bash(git check-ignore:*), Bash(git ls-files:*), Read, Grep, Glob
---

# Plan de commits y push

El usuario hace los commits a mano. Tu trabajo es **solo entregar el plan en el chat**.

**Nunca ejecutes** `git add`, `git commit`, `git push`, `git reset`, `git stash` ni ningún otro comando que modifique el repositorio o el índice. Solo puedes usar comandos de lectura.

## 1. Recoger el estado

Ejecuta estos comandos de lectura:

```bash
git status --porcelain -uall
git diff --stat
git diff --cached --stat
git log --oneline -10
git branch -vv
git remote -v
```

Lee el diff de los ficheros que no entiendas solo por el nombre (`git diff <fichero>`, o léelo entero si es nuevo) para saber qué cambio hace cada uno.

## 2. Revisar problemas antes del plan

Comprueba cada punto y avisa al principio de la respuesta si alguno se cumple:

- **Secretos**: si aparece `.env`, `*.pem`, `*.key` o un fichero con contraseñas o tokens entre los cambios, no lo incluyas en ningún commit y explica cómo añadirlo al `.gitignore`. `servidor/.env.example` sí se sube, pero comprueba que sus valores sensibles estén vacíos.
- **Ficheros generados**: `node_modules/`, `dist/`, `.angular/` y `*.log` no deben aparecer. Si aparecen, el `.gitignore` está mal.
- **Ficheros ya en staging** (columna izquierda de `git status --porcelain` distinta de espacio y de `?`): `git commit` incluiría todo lo que haya en staging, no solo lo del `git add` de ese paso. Si hay ficheros preparados que no encajan en el primer commit del plan, empieza el plan con `git reset` (quita todo del staging sin tocar los ficheros).
- **Sin remoto**: si `git remote -v` no devuelve nada, añade al final `git remote add origin <URL>` y explica que debe crear antes el repositorio vacío en GitHub.
- **Commits sin subir**: si `git branch -vv` muestra `ahead N`, indica que ya hay N commits pendientes de push.
- **Nada que commitear**: si no hay cambios ni commits pendientes, dilo y no generes plan.

## 3. Agrupar en commits

- Un commit por cambio lógico, no por fichero ni por carpeta a ciegas. Un cambio de servidor y el del cliente que lo usa pueden ir juntos si forman una sola funcionalidad, o separados si cada uno tiene sentido por sí mismo.
- Ordena los commits para que cada uno deje el proyecto funcionando: primero lo que otros cambios necesitan (por ejemplo, la ruta del servidor antes de la pantalla que la llama).
- Pon los cambios de documentación (`README.md`, `AGENTS.md`) junto al código que documentan, o en un commit `docs:` al final si son independientes.
- En cada `git add`, lista las rutas exactas. Usa una carpeta entera (`git add cliente/src/app/catalogo/`) solo si todos sus ficheros pertenecen a ese commit. Nunca uses `git add .` ni `git add -A`.

## 4. Formato de los mensajes

[Conventional Commits](https://www.conventionalcommits.org/), en español, en minúsculas y en imperativo:

```
<tipo>(<ámbito>): <descripción>
```

- **Tipos**: `feat` (funcionalidad nueva), `fix` (corrección), `refactor`, `style` (solo formato o CSS sin cambiar comportamiento), `docs`, `test`, `chore` (configuración, dependencias, herramientas).
- **Ámbitos** de este proyecto: `servidor`, `cliente`. Omite el ámbito si el commit toca la raíz o ambos lados por igual.
- Descripción de 72 caracteres como máximo y sin punto final.

## 5. Formato de la respuesta

1. Avisos del paso 2, si los hay.
2. Una línea con el estado: cuántos ficheros cambiados, en qué rama y si hay remoto.
3. El plan, un bloque por commit:

   **N. Título corto del commit**
   ```bash
   git add <rutas>
   git commit -m "<tipo>(<ámbito>): <descripción>"
   ```

4. El push al final:
   ```bash
   git push
   ```
   Usa `git push -u origin <rama>` si la rama todavía no sigue a ninguna rama remota.

5. Una frase final: "Cuando termines, dime y compruebo que se haya subido todo."

No añadas nada más: ni explicaciones largas de Conventional Commits ni alternativas.
