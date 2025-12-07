import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectData {
    name: string;
    path: string;
    isFolder?: boolean;
    parent?: string;
    isExternalApp?: boolean;
    appUrl?: string;  // Para aplicaciones web como WhatsApp Web, Discord Web
    isNativeApp?: boolean;  // Para aplicaciones nativas del sistema
    appBundleId?: string;  // Bundle ID de la app (ej: com.tinyspeck.slackmacgap)
}

export class ProjectStorage {
    private static readonly STORAGE_KEY = 'projectManager.projectsDirectory';
    private static readonly FILE_NAME = 'projects.json';
    private projectsPath: string | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.projectsPath = this.context.globalState.get<string>(ProjectStorage.STORAGE_KEY) || null;
    }

    /**
     * Verifica si hay un directorio configurado
     */
    hasDirectory(): boolean {
        return this.projectsPath !== null && fs.existsSync(this.projectsPath);
    }

    /**
     * Configura el directorio donde se guardarán los proyectos
     */
    async setDirectory(dirPath: string): Promise<void> {
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
    getDirectory(): string | null {
        return this.projectsPath;
    }

    /**
     * Carga los proyectos desde el archivo JSON
     */
    loadProjects(): ProjectData[] {
        if (!this.hasDirectory()) {
            return [];
        }

        const filePath = path.join(this.projectsPath!, ProjectStorage.FILE_NAME);

        if (!fs.existsSync(filePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            return [];
        }
    }

    /**
     * Guarda los proyectos en el archivo JSON
     */
    saveProjects(projects: ProjectData[]): void {
        if (!this.hasDirectory()) {
            throw new Error('No hay directorio configurado');
        }

        const filePath = path.join(this.projectsPath!, ProjectStorage.FILE_NAME);
        fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8');
    }

    /**
     * Migra proyectos desde globalState al archivo JSON
     */
    private async migrateFromGlobalState(): Promise<void> {
        const oldProjects = this.context.globalState.get<ProjectData[]>('projectManager.projects', []);
        
        if (oldProjects.length > 0) {
            this.saveProjects(oldProjects);
            // Limpiar globalState antiguo
            await this.context.globalState.update('projectManager.projects', undefined);
            vscode.window.showInformationMessage(`Migrados ${oldProjects.length} proyectos al nuevo almacenamiento`);
        }
    }
}
