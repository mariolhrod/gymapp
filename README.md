# Gym · App personal de entrenamiento

App web instalable para iPhone: rutinas, entrenos, alimentación y progreso. Funciona sin internet y guarda los datos
solo en el teléfono (con copia de seguridad en Ajustes).

- Dirección: https://mariolhrod.github.io/gymapp/
- Especificación y plan: `docs/specs/app-gym.md`, `docs/plans/app-gym.md`.
- Fotos de ejercicios: free-exercise-db, dominio público (`app/img/ejercicios/LICENCIA-FOTOS.md`).

## Probar
```
node --test "tests/*.test.mjs"        # reglas y datos
node tools/prueba-navegador.mjs        # recorrido completo en Edge (390 × 844), capturas en docs/evidencia/
node tools/servidor.mjs                # abrir la app en http://127.0.0.1:8765/
```

## Publicar una versión nueva
```
node tools/generar-sw.mjs              # actualiza la lista para usar sin internet
git subtree split --prefix app -b gh-pages-nueva
git push origin gh-pages-nueva:gh-pages --force
git branch -D gh-pages-nueva
```
El iPhone descarga la versión nueva la próxima vez que abre la app con conexión.

Esta app es una ayuda personal; no es consejo médico ni nutricional.
