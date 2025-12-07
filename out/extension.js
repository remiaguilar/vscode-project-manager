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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const projectStorage_1 = require("./projectStorage");
function activate(context) {
    console.log('Project Manager está activo');
    const projectStorage = new projectStorage_1.ProjectStorage(context);
    const projectManagerProvider = new ProjectManagerProvider(projectStorage);
    const projectManagerTreeView = vscode.window.createTreeView('projectManagerView', {
        treeDataProvider: projectManagerProvider,
        showCollapseAll: false,
        dragAndDropController: projectManagerProvider
    });
    // Función auxiliar para agregar aplicación externa a una carpeta específica
    async function addExternalAppToFolder(targetFolder, appTypeValue) {
        const projects = projectStorage.loadProjects();
        let appName = '';
        let appUrl = '';
        let appBundleId = '';
        if (appTypeValue === 'native') {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            let installedApps = [];
            try {
                const { stdout } = await execAsync('ls /Applications/*.app 2>/dev/null | head -20');
                const appPaths = stdout.trim().split('\n').filter((p) => p);
                for (const appPath of appPaths) {
                    try {
                        const { stdout: bundleIdOutput } = await execAsync(`defaults read "${appPath}/Contents/Info" CFBundleIdentifier 2>/dev/null`);
                        const bundleId = bundleIdOutput.trim();
                        const appName = path.basename(appPath, '.app');
                        if (bundleId && appName) {
                            installedApps.push({
                                label: `📱 ${appName}`,
                                name: appName,
                                bundleId: bundleId
                            });
                        }
                    }
                    catch (err) {
                        // Ignorar aplicaciones sin Bundle ID
                    }
                }
            }
            catch (err) {
                // Si falla la detección, continuar sin apps detectadas
            }
            const commonApps = [
                { label: '💬 WhatsApp', name: 'WhatsApp', bundleId: 'net.whatsapp.WhatsApp' },
                { label: '🎮 Discord', name: 'Discord', bundleId: 'com.hnc.Discord' },
                { label: '💼 Slack', name: 'Slack', bundleId: 'com.tinyspeck.slackmacgap' },
                { label: '📧 Mail', name: 'Mail', bundleId: 'com.apple.mail' },
                { label: '💬 Messages', name: 'Messages', bundleId: 'com.apple.MobileSMS' },
                { label: '🎵 Spotify', name: 'Spotify', bundleId: 'com.spotify.client' },
                { label: '📝 Notes', name: 'Notes', bundleId: 'com.apple.Notes' },
                { label: '📅 Calendar', name: 'Calendar', bundleId: 'com.apple.iCal' },
                { label: '🌐 Safari', name: 'Safari', bundleId: 'com.apple.Safari' },
                { label: '🦊 Firefox', name: 'Firefox', bundleId: 'org.mozilla.firefox' },
                { label: '🎨 Figma', name: 'Figma', bundleId: 'com.figma.Desktop' }
            ];
            for (const app of commonApps) {
                if (!installedApps.some(ia => ia.bundleId === app.bundleId)) {
                    installedApps.push(app);
                }
            }
            installedApps.push({ label: '➕ Otra aplicación...', name: '', bundleId: '' });
            const selected = await vscode.window.showQuickPick(installedApps, {
                placeHolder: 'Selecciona una aplicación instalada'
            });
            if (!selected) {
                return;
            }
            appName = selected.name;
            appBundleId = selected.bundleId;
            if (!appName) {
                const customName = await vscode.window.showInputBox({
                    prompt: 'Nombre de la aplicación (sin .app)',
                    placeHolder: 'Ej: Postman, iTerm'
                });
                if (!customName) {
                    return;
                }
                try {
                    const { stdout } = await execAsync(`defaults read "/Applications/${customName}.app/Contents/Info" CFBundleIdentifier 2>/dev/null`);
                    appBundleId = stdout.trim();
                    appName = customName;
                }
                catch (err) {
                    const customBundleId = await vscode.window.showInputBox({
                        prompt: 'Bundle ID de la aplicación (no se encontró automáticamente)',
                        placeHolder: 'com.company.appname'
                    });
                    if (!customBundleId) {
                        return;
                    }
                    appName = customName;
                    appBundleId = customBundleId;
                }
            }
        }
        else {
            const webApps = [
                { label: '💬 WhatsApp Web', name: 'WhatsApp Web', url: 'https://web.whatsapp.com' },
                { label: '🎮 Discord Web', name: 'Discord Web', url: 'https://discord.com/app' },
                { label: '💼 Slack Web', name: 'Slack Web', url: 'https://app.slack.com' },
                { label: '📧 Gmail', name: 'Gmail', url: 'https://mail.google.com' },
                { label: '📨 Outlook', name: 'Outlook', url: 'https://outlook.office.com' },
                { label: '🐙 GitHub', name: 'GitHub', url: 'https://github.com' },
                { label: '📊 Notion', name: 'Notion', url: 'https://notion.so' },
                { label: '📋 Trello', name: 'Trello', url: 'https://trello.com' },
                { label: '📝 Google Drive', name: 'Google Drive', url: 'https://drive.google.com' },
                { label: '🎵 Spotify Web', name: 'Spotify Web', url: 'https://open.spotify.com' },
                { label: '🎨 Figma', name: 'Figma', url: 'https://www.figma.com' },
                { label: '📊 Linear', name: 'Linear', url: 'https://linear.app' },
                { label: '➕ Otra aplicación...', name: '', url: '' }
            ];
            const selected = await vscode.window.showQuickPick(webApps, {
                placeHolder: 'Selecciona una aplicación web'
            });
            if (!selected) {
                return;
            }
            appName = selected.name;
            appUrl = selected.url;
            if (!appName) {
                const customName = await vscode.window.showInputBox({
                    prompt: 'Nombre de la aplicación',
                    placeHolder: 'Ej: Jira, Asana'
                });
                if (!customName) {
                    return;
                }
                const customUrl = await vscode.window.showInputBox({
                    prompt: 'URL de la aplicación',
                    placeHolder: 'https://...',
                    validateInput: (value) => {
                        if (!value.startsWith('http://') && !value.startsWith('https://')) {
                            return 'La URL debe comenzar con http:// o https://';
                        }
                        return null;
                    }
                });
                if (!customUrl) {
                    return;
                }
                appName = customName;
                appUrl = customUrl;
            }
        }
        const appData = {
            name: appName,
            path: '',
            isExternalApp: true,
            parent: targetFolder
        };
        if (appUrl) {
            appData.appUrl = appUrl;
        }
        if (appBundleId) {
            appData.appBundleId = appBundleId;
            appData.isNativeApp = true;
        }
        projects.push(appData);
        projectStorage.saveProjects(projects);
        projectManagerProvider.refresh();
        const appTypeLabel = appBundleId ? 'nativa' : 'web';
        vscode.window.showInformationMessage(`✅ Aplicación ${appTypeLabel} "${appName}" agregada a "${targetFolder}"`);
    }
    // Comando: Seleccionar directorio de proyectos
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.selectDirectory', async () => {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Seleccionar Directorio de Proyectos'
        });
        if (folderUri && folderUri[0]) {
            await projectStorage.setDirectory(folderUri[0].fsPath);
            projectManagerProvider.refresh();
            vscode.window.showInformationMessage(`Directorio de proyectos: ${folderUri[0].fsPath}`);
        }
    }));
    // Comando: Agregar Proyecto
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.addProject', async () => {
        const type = await vscode.window.showQuickPick([
            { label: '📁 Proyecto Local', value: 'project', description: 'Carpeta de proyecto en tu computadora' },
            { label: '🌐 Aplicación Web', value: 'web', description: 'WhatsApp Web, Gmail, Notion, etc.' },
            { label: '💻 Aplicación Nativa', value: 'native', description: 'Discord, Slack, WhatsApp Desktop, etc.' }
        ], {
            placeHolder: '¿Qué quieres agregar?'
        });
        if (!type) {
            return;
        }
        if (type.value === 'web' || type.value === 'native') {
            await vscode.commands.executeCommand('projectManager.addExternalApp', type.value);
            return;
        }
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Seleccionar Proyecto'
        });
        if (folderUri && folderUri[0]) {
            const projectPath = folderUri[0].fsPath;
            const projectName = path.basename(projectPath);
            const projects = projectStorage.loadProjects();
            const exists = projects.some(p => p.path === projectPath);
            if (exists) {
                vscode.window.showWarningMessage('Este proyecto ya está agregado');
                return;
            }
            const folders = projects.filter(p => p.isFolder).map(f => f.name);
            let parentFolder;
            if (folders.length > 0) {
                const options = ['Sin carpeta (raíz)', ...folders];
                const selected = await vscode.window.showQuickPick(options, {
                    placeHolder: '¿En qué carpeta quieres agregarlo?'
                });
                if (!selected) {
                    return;
                }
                if (selected !== 'Sin carpeta (raíz)') {
                    parentFolder = selected;
                }
            }
            projects.push({
                name: projectName,
                path: projectPath,
                parent: parentFolder
            });
            projectStorage.saveProjects(projects);
            projectManagerProvider.refresh();
            vscode.window.showInformationMessage(`Proyecto agregado: ${projectName}`);
        }
    }));
    // Comando: Agregar Proyecto Actual
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.addCurrentProject', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showWarningMessage('No hay ningún proyecto abierto');
            return;
        }
        const projectPath = workspaceFolder.uri.fsPath;
        const projectName = path.basename(projectPath);
        const projects = projectStorage.loadProjects();
        const exists = projects.some(p => p.path === projectPath);
        if (exists) {
            vscode.window.showInformationMessage('Este proyecto ya está en Project Manager');
            return;
        }
        const folders = projects.filter(p => p.isFolder).map(f => f.name);
        const options = ['📁 Raíz (sin carpeta)', '➕ Nueva carpeta...', ...folders.map(f => `📂 ${f}`)];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: '¿Dónde quieres agregar este proyecto?',
            title: `Agregar "${projectName}" a Project Manager`
        });
        if (!selected) {
            return;
        }
        let parentFolder;
        if (selected === '➕ Nueva carpeta...') {
            const newFolderName = await vscode.window.showInputBox({
                prompt: 'Nombre de la nueva carpeta',
                placeHolder: 'Ej: Trabajo, Personal, Clientes'
            });
            if (!newFolderName) {
                return;
            }
            const folderExists = projects.some(p => p.name === newFolderName && p.isFolder);
            if (folderExists) {
                vscode.window.showWarningMessage('Ya existe una carpeta con ese nombre');
                return;
            }
            projects.push({ name: newFolderName, path: '', isFolder: true });
            parentFolder = newFolderName;
        }
        else if (selected !== '📁 Raíz (sin carpeta)') {
            parentFolder = selected.replace('📂 ', '');
        }
        projects.push({
            name: projectName,
            path: projectPath,
            parent: parentFolder
        });
        projectStorage.saveProjects(projects);
        projectManagerProvider.refresh();
        const location = parentFolder ? `en "${parentFolder}"` : 'en la raíz';
        vscode.window.showInformationMessage(`✅ Proyecto "${projectName}" agregado ${location}`);
    }));
    // Comando: Refrescar
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.refresh', () => {
        projectManagerProvider.refresh();
    }));
    // Comando: Agregar Proyecto a Carpeta
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.addProjectToFolder', async (folderItem) => {
        if (!folderItem || !folderItem.isFolder) {
            return;
        }
        const type = await vscode.window.showQuickPick([
            { label: '📁 Proyecto Local', value: 'project', description: 'Carpeta de proyecto en tu computadora' },
            { label: '🌐 Aplicación Web', value: 'web', description: 'WhatsApp Web, Gmail, Notion, etc.' },
            { label: '💻 Aplicación Nativa', value: 'native', description: 'Discord, Slack, WhatsApp Desktop, etc.' }
        ], {
            placeHolder: `¿Qué quieres agregar a "${folderItem.label}"?`
        });
        if (!type) {
            return;
        }
        if (type.value === 'web' || type.value === 'native') {
            await addExternalAppToFolder(folderItem.label, type.value);
            return;
        }
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Seleccionar Proyecto'
        });
        if (folderUri && folderUri[0]) {
            const projectPath = folderUri[0].fsPath;
            const projectName = path.basename(projectPath);
            const projects = projectStorage.loadProjects();
            const exists = projects.some(p => p.path === projectPath);
            if (exists) {
                vscode.window.showWarningMessage('Este proyecto ya está agregado');
                return;
            }
            projects.push({
                name: projectName,
                path: projectPath,
                parent: folderItem.label
            });
            projectStorage.saveProjects(projects);
            projectManagerProvider.refresh();
            vscode.window.showInformationMessage(`Proyecto agregado a ${folderItem.label}: ${projectName}`);
        }
    }));
    // Comando: Abrir Proyecto
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.openProject', async (projectItem) => {
        if (projectItem) {
            if (projectItem.isExternalApp && projectItem.appUrl) {
                await vscode.env.openExternal(vscode.Uri.parse(projectItem.appUrl));
            }
            else if (projectItem.isExternalApp && projectItem.appBundleId) {
                const { exec } = require('child_process');
                const command = `open -b "${projectItem.appBundleId}"`;
                exec(command, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Error al abrir aplicación: ${error.message}`);
                    }
                });
            }
            else if (projectItem.projectPath) {
                const uri = vscode.Uri.file(projectItem.projectPath);
                await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
            }
        }
    }));
    // Comando: Eliminar Proyecto
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.removeProject', async (projectItem) => {
        if (projectItem) {
            const projects = projectStorage.loadProjects();
            let filtered;
            if (projectItem.isExternalApp) {
                filtered = projects.filter(p => !(p.name === projectItem.label &&
                    (p.appUrl === projectItem.appUrl || p.appBundleId === projectItem.appBundleId)));
            }
            else if (projectItem.projectPath) {
                filtered = projects.filter(p => p.path !== projectItem.projectPath);
            }
            else {
                filtered = projects.filter(p => !(p.name === projectItem.label && p.isFolder));
            }
            projectStorage.saveProjects(filtered);
            projectManagerProvider.refresh();
            vscode.window.showInformationMessage(`${projectItem.isExternalApp ? 'Aplicación' : 'Proyecto'} eliminado: ${projectItem.label}`);
        }
    }));
    // Comando: Abrir en Finder
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.openInFinder', async (projectItem) => {
        if (projectItem && projectItem.projectPath) {
            const platform = process.platform;
            let command;
            if (platform === 'darwin') {
                command = `open "${projectItem.projectPath}"`;
            }
            else if (platform === 'win32') {
                command = `explorer "${projectItem.projectPath}"`;
            }
            else {
                command = `xdg-open "${projectItem.projectPath}"`;
            }
            const { exec } = require('child_process');
            exec(command, (error) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error al abrir: ${error.message}`);
                }
            });
        }
    }));
    // Comando: Crear Carpeta
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.createFolder', async () => {
        const folderName = await vscode.window.showInputBox({
            prompt: 'Nombre de la carpeta',
            placeHolder: 'Ej: Trabajo, Personal, Clientes'
        });
        if (folderName) {
            const projects = projectStorage.loadProjects();
            const exists = projects.some(p => p.name === folderName && p.isFolder);
            if (exists) {
                vscode.window.showWarningMessage('Ya existe una carpeta con ese nombre');
                return;
            }
            projects.push({ name: folderName, path: '', isFolder: true });
            projectStorage.saveProjects(projects);
            projectManagerProvider.refresh();
            vscode.window.showInformationMessage(`Carpeta creada: ${folderName}`);
        }
    }));
    // Comando: Agregar Aplicación Externa
    context.subscriptions.push(vscode.commands.registerCommand('projectManager.addExternalApp', async (preselectedType) => {
        let appType;
        if (preselectedType === 'web') {
            appType = { label: '🌐 Aplicación Web', value: 'web' };
        }
        else if (preselectedType === 'native') {
            appType = { label: '💻 Aplicación Nativa (macOS)', value: 'native' };
        }
        else {
            appType = await vscode.window.showQuickPick([
                { label: '🌐 Aplicación Web', value: 'web', description: 'WhatsApp Web, Gmail, Notion, etc.' },
                { label: '💻 Aplicación Nativa (macOS)', value: 'native', description: 'Discord, Slack, WhatsApp Desktop, etc.' }
            ], {
                placeHolder: '¿Qué tipo de aplicación quieres agregar?'
            });
        }
        if (!appType) {
            return;
        }
        let appName = '';
        let appUrl = '';
        let appBundleId = '';
        if (appType.value === 'native') {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            let installedApps = [];
            try {
                const { stdout } = await execAsync('ls /Applications/*.app 2>/dev/null | head -20');
                const appPaths = stdout.trim().split('\n').filter((p) => p);
                for (const appPath of appPaths) {
                    try {
                        const { stdout: bundleIdOutput } = await execAsync(`defaults read "${appPath}/Contents/Info" CFBundleIdentifier 2>/dev/null`);
                        const bundleId = bundleIdOutput.trim();
                        const appName = path.basename(appPath, '.app');
                        if (bundleId && appName) {
                            installedApps.push({
                                label: `📱 ${appName}`,
                                name: appName,
                                bundleId: bundleId
                            });
                        }
                    }
                    catch (err) {
                        // Ignorar
                    }
                }
            }
            catch (err) {
                // Continuar sin apps detectadas
            }
            const commonApps = [
                { label: '💬 WhatsApp', name: 'WhatsApp', bundleId: 'net.whatsapp.WhatsApp' },
                { label: '🎮 Discord', name: 'Discord', bundleId: 'com.hnc.Discord' },
                { label: '💼 Slack', name: 'Slack', bundleId: 'com.tinyspeck.slackmacgap' },
                { label: '📧 Mail', name: 'Mail', bundleId: 'com.apple.mail' },
                { label: '💬 Messages', name: 'Messages', bundleId: 'com.apple.MobileSMS' },
                { label: '🎵 Spotify', name: 'Spotify', bundleId: 'com.spotify.client' },
                { label: '📝 Notes', name: 'Notes', bundleId: 'com.apple.Notes' },
                { label: '📅 Calendar', name: 'Calendar', bundleId: 'com.apple.iCal' },
                { label: '🌐 Safari', name: 'Safari', bundleId: 'com.apple.Safari' },
                { label: '🦊 Firefox', name: 'Firefox', bundleId: 'org.mozilla.firefox' },
                { label: '🎨 Figma', name: 'Figma', bundleId: 'com.figma.Desktop' },
                { label: '➕ Otra aplicación...', name: '', bundleId: '' }
            ];
            for (const app of commonApps) {
                if (!installedApps.some(ia => ia.bundleId === app.bundleId)) {
                    installedApps.push(app);
                }
            }
            const selectedNative = await vscode.window.showQuickPick(installedApps, {
                placeHolder: 'Selecciona una aplicación instalada'
            });
            if (!selectedNative) {
                return;
            }
            appName = selectedNative.name;
            appBundleId = selectedNative.bundleId;
            if (!appName) {
                const customName = await vscode.window.showInputBox({
                    prompt: 'Nombre de la aplicación (sin .app)',
                    placeHolder: 'Ej: Postman, iTerm'
                });
                if (!customName) {
                    return;
                }
                try {
                    const { stdout } = await execAsync(`defaults read "/Applications/${customName}.app/Contents/Info" CFBundleIdentifier 2>/dev/null`);
                    appBundleId = stdout.trim();
                    appName = customName;
                }
                catch (err) {
                    const customBundleId = await vscode.window.showInputBox({
                        prompt: 'Bundle ID de la aplicación (no se encontró automáticamente)',
                        placeHolder: 'com.company.appname',
                        validateInput: (value) => {
                            if (!value || value.trim().length === 0) {
                                return 'El Bundle ID no puede estar vacío';
                            }
                            return null;
                        }
                    });
                    if (!customBundleId) {
                        return;
                    }
                    appName = customName;
                    appBundleId = customBundleId;
                }
            }
        }
        else {
            const webApps = [
                { label: '💬 WhatsApp Web', name: 'WhatsApp Web', url: 'https://web.whatsapp.com' },
                { label: '🎮 Discord Web', name: 'Discord Web', url: 'https://discord.com/app' },
                { label: '💼 Slack Web', name: 'Slack Web', url: 'https://app.slack.com' },
                { label: '📧 Gmail', name: 'Gmail', url: 'https://mail.google.com' },
                { label: '📨 Outlook', name: 'Outlook', url: 'https://outlook.office.com' },
                { label: '🐙 GitHub', name: 'GitHub', url: 'https://github.com' },
                { label: '📊 Notion', name: 'Notion', url: 'https://notion.so' },
                { label: '📋 Trello', name: 'Trello', url: 'https://trello.com' },
                { label: '📝 Google Drive', name: 'Google Drive', url: 'https://drive.google.com' },
                { label: '🎵 Spotify Web', name: 'Spotify Web', url: 'https://open.spotify.com' },
                { label: '🎨 Figma', name: 'Figma', url: 'https://www.figma.com' },
                { label: '📊 Linear', name: 'Linear', url: 'https://linear.app' },
                { label: '➕ Otra aplicación...', name: '', url: '' }
            ];
            const selectedWeb = await vscode.window.showQuickPick(webApps, {
                placeHolder: 'Selecciona una aplicación web'
            });
            if (!selectedWeb) {
                return;
            }
            appName = selectedWeb.name;
            appUrl = selectedWeb.url;
            if (!appName) {
                const customName = await vscode.window.showInputBox({
                    prompt: 'Nombre de la aplicación',
                    placeHolder: 'Ej: Jira, Asana, Monday'
                });
                if (!customName) {
                    return;
                }
                const customUrl = await vscode.window.showInputBox({
                    prompt: 'URL de la aplicación',
                    placeHolder: 'https://...',
                    validateInput: (value) => {
                        if (!value.startsWith('http://') && !value.startsWith('https://')) {
                            return 'La URL debe comenzar con http:// o https://';
                        }
                        return null;
                    }
                });
                if (!customUrl) {
                    return;
                }
                appName = customName;
                appUrl = customUrl;
            }
        }
        const projects = projectStorage.loadProjects();
        const folders = projects.filter(p => p.isFolder).map(f => f.name);
        const options = ['📁 Raíz (sin carpeta)', '➕ Nueva carpeta...', ...folders.map(f => `📂 ${f}`)];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: '¿Dónde quieres agregar esta aplicación?',
            title: `Agregar "${appName}" a Project Manager`
        });
        if (!selected) {
            return;
        }
        let parentFolder;
        if (selected === '➕ Nueva carpeta...') {
            const newFolderName = await vscode.window.showInputBox({
                prompt: 'Nombre de la nueva carpeta',
                placeHolder: 'Ej: Apps Web, Comunicación'
            });
            if (!newFolderName) {
                return;
            }
            const folderExists = projects.some(p => p.name === newFolderName && p.isFolder);
            if (folderExists) {
                vscode.window.showWarningMessage('Ya existe una carpeta con ese nombre');
                return;
            }
            projects.push({ name: newFolderName, path: '', isFolder: true });
            parentFolder = newFolderName;
        }
        else if (selected !== '📁 Raíz (sin carpeta)') {
            parentFolder = selected.replace('📂 ', '');
        }
        const appData = {
            name: appName,
            path: '',
            isExternalApp: true,
            parent: parentFolder
        };
        if (appUrl) {
            appData.appUrl = appUrl;
        }
        if (appBundleId) {
            appData.appBundleId = appBundleId;
            appData.isNativeApp = true;
        }
        projects.push(appData);
        projectStorage.saveProjects(projects);
        projectManagerProvider.refresh();
        const appTypeLabel = appBundleId ? 'nativa' : 'web';
        const location = parentFolder ? `en "${parentFolder}"` : 'en la raíz';
        vscode.window.showInformationMessage(`✅ Aplicación ${appTypeLabel} "${appName}" agregada ${location}`);
    }));
    context.subscriptions.push(projectManagerTreeView);
    // Refrescar cuando cambie el workspace
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        projectManagerProvider.refresh();
    });
}
function deactivate() { }
// ProjectManagerProvider
class ProjectManagerProvider {
    constructor(storage) {
        this.storage = storage;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.dropMimeTypes = ['application/vnd.code.tree.projectManagerView'];
        this.dragMimeTypes = ['application/vnd.code.tree.projectManagerView'];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async handleDrag(source, dataTransfer) {
        const projects = source.filter(item => !item.isFolder);
        if (projects.length > 0) {
            dataTransfer.set('application/vnd.code.tree.projectManagerView', new vscode.DataTransferItem(projects));
        }
    }
    async handleDrop(target, dataTransfer) {
        const transferItem = dataTransfer.get('application/vnd.code.tree.projectManagerView');
        if (!transferItem) {
            return;
        }
        const projects = this.storage.loadProjects();
        const draggedItems = transferItem.value;
        for (const draggedItem of draggedItems) {
            const projectIndex = projects.findIndex(p => p.path === draggedItem.projectPath && !p.isFolder);
            if (projectIndex === -1) {
                continue;
            }
            let newParent;
            if (target && target.isFolder) {
                newParent = target.label;
            }
            else if (target) {
                const targetProject = projects.find(p => p.path === target.projectPath && !p.isFolder);
                newParent = targetProject?.parent;
            }
            projects[projectIndex].parent = newParent;
        }
        this.storage.saveProjects(projects);
        this.refresh();
    }
    getChildren(element) {
        const projects = this.storage.loadProjects();
        const currentWorkspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!element) {
            const rootItems = projects
                .filter(p => !p.parent)
                .map(project => {
                if (project.isFolder) {
                    const hasActiveChild = projects.some(p => p.parent === project.name &&
                        p.path === currentWorkspacePath);
                    return new ProjectItem(project.name, '', vscode.TreeItemCollapsibleState.Collapsed, false, true, hasActiveChild);
                }
                else {
                    const isCurrentProject = currentWorkspacePath === project.path;
                    return new ProjectItem(project.name, project.path, vscode.TreeItemCollapsibleState.None, isCurrentProject, false, false, project.isExternalApp || false, project.appUrl, project.appBundleId);
                }
            });
            return Promise.resolve(rootItems);
        }
        else if (element.isFolder) {
            const children = projects
                .filter(p => p.parent === element.label)
                .map(project => {
                const isCurrentProject = currentWorkspacePath === project.path;
                return new ProjectItem(project.name, project.path, vscode.TreeItemCollapsibleState.None, isCurrentProject, false, false, project.isExternalApp || false, project.appUrl, project.appBundleId);
            });
            return Promise.resolve(children);
        }
        return Promise.resolve([]);
    }
}
// ProjectItem
class ProjectItem extends vscode.TreeItem {
    constructor(label, projectPath, collapsibleState, isCurrentProject = false, isFolder = false, hasActiveChild = false, isExternalApp = false, appUrl, appBundleId) {
        super(label, collapsibleState);
        this.label = label;
        this.projectPath = projectPath;
        this.collapsibleState = collapsibleState;
        this.isFolder = isFolder;
        this.isExternalApp = isExternalApp;
        this.appUrl = appUrl;
        this.appBundleId = appBundleId;
        this.tooltip = projectPath || appUrl || label;
        if (isFolder) {
            if (hasActiveChild) {
                this.description = '● Contiene proyecto actual';
            }
            else {
                this.description = '';
            }
            this.contextValue = 'projectFolder';
        }
        else if (isExternalApp) {
            if (appBundleId) {
                this.description = '💻 App Nativa';
                this.iconPath = new vscode.ThemeIcon('device-desktop');
            }
            else {
                this.description = '🌐 App Web';
                this.iconPath = new vscode.ThemeIcon('globe');
            }
            this.contextValue = 'externalApp';
            this.command = {
                command: 'projectManager.openProject',
                title: 'Abrir Aplicación',
                arguments: [this]
            };
        }
        else {
            if (isCurrentProject) {
                this.description = '● Actual';
                this.iconPath = new vscode.ThemeIcon('root-folder-opened', new vscode.ThemeColor('charts.green'));
            }
            else {
                this.description = '';
                this.iconPath = new vscode.ThemeIcon('root-folder');
            }
            this.command = {
                command: 'projectManager.openProject',
                title: 'Abrir Proyecto',
                arguments: [this]
            };
            this.contextValue = 'project';
        }
    }
}
//# sourceMappingURL=extension.js.map