"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectStorage = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProjectStorage {
    constructor(context) {
        this.context = context;
        this.projectsPath = null;
        this.projectsPath = this.context.globalState.get(ProjectStorage.STORAGE_KEY) || null;
    }
    /**
     * Verifica si hay un directorio configurado
     */
    hasDirectory() {
        return this.projectsPath !== null && fs.existsSync(this.projectsPath);
    }
    /**
     * Configura el directorio donde se guardarán los proyectos
     */
    async setDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        this.projectsPath = dirPath;
        await this.context.globalState.update(ProjectStorage.STORAGE_KEY, dirPath);
        // Migrar datos existentes si hay
        await this.migrateFromGlobalState();
    }
    /**
     * Obtiene el directorio actual
     */
    getDirectory() {
        return this.projectsPath;
    }
    /**
     * Carga los proyectos desde el archivo JSON
     */
    loadProjects() {
        if (!this.hasDirectory()) {
            return [];
        }
        const filePath = path.join(this.projectsPath, ProjectStorage.FILE_NAME);
        if (!fs.existsSync(filePath)) {
            return [];
        }
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error('Error al cargar proyectos:', error);
            return [];
        }
    }
    /**
     * Guarda los proyectos en el archivo JSON
     */
    saveProjects(projects) {
        if (!this.hasDirectory()) {
            throw new Error('No hay directorio configurado');
        }
        const filePath = path.join(this.projectsPath, ProjectStorage.FILE_NAME);
        fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8');
    }
    /**
     * Migra proyectos desde globalState al archivo JSON
     */
    async migrateFromGlobalState() {
        const oldProjects = this.context.globalState.get('projectManager.projects', []);
        if (oldProjects.length > 0) {
            this.saveProjects(oldProjects);
            // Limpiar globalState antiguo
            await this.context.globalState.update('projectManager.projects', undefined);
            vscode.window.showInformationMessage(`Migrados ${oldProjects.length} proyectos al nuevo almacenamiento`);
        }
    }
}
exports.ProjectStorage = ProjectStorage;
ProjectStorage.STORAGE_KEY = 'projectManager.projectsDirectory';
ProjectStorage.FILE_NAME = 'projects.json';
//# sourceMappingURL=projectStorage.js.map