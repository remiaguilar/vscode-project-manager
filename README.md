# Project Manager

Administrador de proyectos con soporte para apps externas y carpetas.

## Funcionalidad

**Vista: Project Manager**
- Proyectos VS Code (carpetas locales)
- Apps externas (web, macOS nativas, Bundle IDs)
- Organización en carpetas ilimitadas
- Drag & Drop para reorganizar
- Detección automática de apps macOS
- Agregar workspace actual

**Tipos de Proyectos:**
- **Carpeta Local** - Abre en VS Code
- **URL Web** - Abre en navegador
- **App macOS** - Lanza con `open -b bundleID`
- **Carpeta** - Contenedor de proyectos

## Comandos

**Vista:**
- **Select Directory** - Agregar proyecto (icon: `+`)
- **Add Current Project** - Agregar workspace actual
- **Create Folder** - Nueva carpeta
- **Add External App** - Agregar app/URL
- **Refresh** - Refrescar vista (icon: `↻`)

**Contexto (click derecho en proyecto):**
- **Abrir** - Abre proyecto/app
- **Add Project to Folder** - Agregar a carpeta específica
- **Open in Finder** - Ver en Finder (icon: `📂`)
- **Remove** - Eliminar (icon: `🗑`)

## Aplicaciones Externas

**Detectar App macOS:**
1. Busca por nombre: `Terminal`, `Xcode`, `Postman`
2. Se extrae Bundle ID automáticamente

**Manual Bundle ID:**
- Ejemplo: `com.apple.Safari`
- Encuentra con: `osascript -e 'id of app "Safari"'`

**URL Web:**
- Ejemplo: `https://github.com/usuario/repo`
- Se abre en navegador predeterminado

## Drag & Drop

- Arrastra proyectos entre carpetas
- Arrastra carpetas para reorganizar
- Suelta en carpeta existente

## Autor

**Remi Aguilar**
- Website: [remiaguilar.com](https://remiaguilar.com)
- GitHub: [@remiaguilar](https://github.com/remiaguilar)

## Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## Contribuciones

Este proyecto es open source. Contribuciones, issues y sugerencias son bienvenidas.

Si encuentras un bug o tienes una idea para mejorar la extensión, por favor abre un [issue](https://github.com/remiaguilar/vs-notes/issues).
