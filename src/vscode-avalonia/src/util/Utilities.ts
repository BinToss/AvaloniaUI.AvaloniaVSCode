import path = require("path");
import * as vscode from "vscode";
import * as sm from "../models/solutionModel";
import { getSolutionModel } from "../services/solutionParser";
import AppConstants from "./Constants";

// TODO:move const strings to Constants
export const avaloniaFileExtension = "axaml";
export const avaloniaLanguageId = "axaml";
export const logger = vscode.window.createOutputChannel("Avalonia Client", { log: true });

/**
 * Checks if the given document is an Avalonia file.
 * @param document vscode TextDocument
 * @returns `true` if it's an Avalonia file, `false` otherwise
 */
const axamlLang = AppConstants._contributes.languages.find((v) => v.id.toLowerCase() === avaloniaLanguageId);
export function isAvaloniaFile(document: vscode.TextDocument): boolean {
	// axamlLang will never be null | undefined!
	return axamlLang!.extensions.some((dotExt) => path.extname(document.fileName) === dotExt)
}

/**
 * Checks if the given document is an Avalonia file.
 * @param filePath file path
 * @returns filename
 */
export function getFileName(filePath: string): string {
	return path.basename(filePath);
}

/**
 * Returns executable project from solution model
 * @param solution solution model
 * @returns executable project
 */
export function getExecutableProject(solution: sm.Solution): sm.Project | undefined {
	const projs = solution.projects.filter((p) => p.outputType === "WinExe");
	const proj = projs.length > 0 ? projs[0] : undefined;
	if (proj && proj.designerHostPath.trim() !== '') {
		logger.info("designerHostPath: " + proj.designerHostPath);
	}

	return proj;
}
/**
 * Returns the file details from solution model
 * @param file file path
 * @param context vscode extension context
 * @returns File details from solution model
 */
export function getFileDetails(file: string, context: vscode.ExtensionContext): sm.File | undefined {
	const solution = getSolutionModel(context);
	const fileData = solution?.files.find((f) => f.path === file);
	return fileData;
}

declare global {
	interface Array<T> {
		getValue(property: string): string;
	}

	interface String {
		putInQuotes(): string;
	}
}
Array.prototype.getValue = function (this: string[], property: string): string {
	const value = this.find((line) => line.includes(property));
	return value ? value.split("=")[1].trim() : "";
};

String.prototype.putInQuotes = function (this: string): string {
	return `"${this}"`;
};

/** @deprecated Import from "Constants" instead. */
export { AppConstants } from "./Constants";
