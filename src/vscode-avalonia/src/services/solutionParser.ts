import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

import * as vscode from "vscode";

import * as sln from "../models/solutionModel";
import { spawn } from "child_process";

import { AppConstants, logger } from "../util/Utilities";

const extensionId = "AvaloniaTeam.vscode-avalonia";

/**
 * Builds the solution model by parsing the solution file and updating the workspace state.
 * If the output file already exists and `force` is false, the function does nothing.
 * @param context The extension context.
 * @param force Whether to force the parsing of the solution file even if the output file already exists.
 */
export async function buildSolutionModel(context: vscode.ExtensionContext, force: boolean = false) {
	var { outputPath, isExist } = await isOutputExists();

	if (!isExist || force) {
		await parseSolution(context);
		return;
	}

	const fileContent = await fs.readFile(outputPath!, "utf-8");
	updateSolutionModel(context, fileContent);
}

/**
 * Returns the solution model from the workspace state.
 * @param context The extension context.
 * @returns The solution model, or undefined if it doesn't exist.
 */
export function getSolutionModel(context: vscode.ExtensionContext): sln.Solution | undefined {
	const solutionData = context.workspaceState.get<sln.Solution | undefined>(AppConstants.solutionData, undefined);
	return solutionData;
}

/**
 * Returns the path to the solution data file.
 * @returns The path to the solution data file, or undefined if it doesn't exist.
 */
export async function getSolutionDataFile() {
	const slnFile = await getSolutionFile();
	if (!slnFile) {
		logger.error("Could not find solution file.");
		return;
	}

	return path.join(os.tmpdir(), path.basename(slnFile) + ".json");
}

/**
 * Deletes the solution data file.
 */
export async function purgeSolutionDataFile() {
	const solutionDataFile = await getSolutionDataFile();
	if (!solutionDataFile) {
		return;
	}
	fs.removeSync(solutionDataFile);
}

function updateSolutionModel(context: vscode.ExtensionContext, jsonContent: string) {
	const data = JSON.parse(jsonContent);
	context.workspaceState.update(AppConstants.solutionData, data);
}

async function getSolutionFile(): Promise<string | undefined> {
	const filePattern = "**/*.sln";
	const files = await vscode.workspace.findFiles(filePattern);

	if (files.length > 0) {
		return files[0].fsPath;
	}

	return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
}

async function isOutputExists() {
	const outputPath = await getSolutionDataFile();
	logger.info(`[EXT - INFO] Solution data path: ${outputPath}`);
	return { outputPath, isExist: fs.pathExistsSync(outputPath!) };
}

async function parseSolution(context: vscode.ExtensionContext): Promise<string> {
	const avaloniaExtn = vscode.extensions.getExtension(extensionId);
	if (!avaloniaExtn) {
		throw new Error("Could not find sample extension.");
	}
	const solutionPath = await getSolutionFile();
	if (!solutionPath) {
		throw new Error("Could not find solution file.");
	}

	const parserLocation = path.join(avaloniaExtn.extensionPath, "solutionParserTool", "SolutionParser.dll");

	return new Promise<string>((resolve, reject) => {
		var jsonContent = "";
		const previewer = spawn(`dotnet`, [parserLocation.putInQuotes(), solutionPath.putInQuotes()], {
			windowsVerbatimArguments: false,
			env: process.env,
			shell: true,
		});

		previewer.on("spawn", () => {
			jsonContent = "";
			logger.info(`parser process args: ${previewer.spawnargs}`);
		});

		previewer.stdout.on("data", (data) => {
			jsonContent += data.toString();
		});

		previewer.stderr.on("data", (data) => {
			logger.error(data.toString());
			reject(data.toString());
		});

		previewer.on("close", (code) => {
			if (code === 0) {
				updateSolutionModel(context, jsonContent);
				resolve(jsonContent);
				logger.info(`parser process exited ${code}`);
			}
			else {
				logger.error(`parser process exited ${code}`);
			}
		});
	});
}
