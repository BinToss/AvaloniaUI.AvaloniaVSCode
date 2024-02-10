
using System.Text.Json;
using Avalonia.Ide.CompletionEngine;
using Avalonia.Ide.CompletionEngine.AssemblyMetadata;
using Avalonia.Ide.CompletionEngine.DnlibMetadataProvider;
using AvaloniaLanguageServer.Services;
using AvaloniaLanguageServer.Utilities;


namespace AvaloniaLanguageServer.Models;

public class Workspace
{
    public ProjectInfo? ProjectInfo { get; private set; }
    public BufferService BufferService { get; } = new();

    public async Task InitializeAsync(DocumentUri uri)
    {
        try
        {
            ProjectInfo = await ProjectInfo.GetProjectInfoAsync(uri);
            CompletionMetadata = BuildCompletionMetadata(uri);
        }
        catch (Exception e)
        {
            throw new Exception($"Failed to initialize workspace: {uri}", e);
        }
    }

    Metadata? BuildCompletionMetadata(DocumentUri uri)
    {
        var slnFile = SolutionName(uri) ?? Path.GetFileNameWithoutExtension(ProjectInfo?.ProjectDirectory);

        if (slnFile == null)
            return null;


        var slnFilePath = Path.Combine(Path.GetTempPath(), $"{slnFile}.json");

        if (!File.Exists(slnFilePath))
            return null;

        string content = File.ReadAllText(slnFilePath);
        SolutionData package = JsonSerializer.Deserialize<SolutionData>(content)
            ?? throw new NullReferenceException("Failed to deserialize Solution data file.");
        /*  Includes projects' permutations */
        var exeProjects = package.GetExecutableProjects();
        if (exeProjects.Count() is 0)
            throw new Exception($"No projects found with OutputType {SolutionData.OutputTypeWinExe}.");

        Metadata metadata = new();
        foreach (Project exeProj in exeProjects)
        {
            try // $(IntermediateOutputPath)/.../Avalonia/references
            {
                metadata.AddMetadata(_metadataReader.GetForTargetAssembly(new AvaloniaCompilationAssemblyProvider(exeProj.IntermediateOutputPath)));
            }
            catch (Exception e)
            {
                throw new Exception(
                    $"Failed to build completion metadata. IntermediateOutputPath: {exeProj.IntermediateOutputPath}",
                    e
                );
            }
        }

        return metadata;
    }

    // TODO: prefer getting Solution from csdevkit (roslyn language server) or OmniSharp/Ionide, or fallback to our impl.
    static string? SolutionName(DocumentUri uri)
    {
        string path = Utils.FromUri(uri);
        string root = Directory.GetDirectoryRoot(path);
        string? current = Path.GetDirectoryName(path);

        if (!File.Exists(path) || current == null)
            return null;

        var files = Array.Empty<FileInfo>();

        while (root != current && files.Length == 0)
        {
            var directory = new DirectoryInfo(current!);
            files = directory.GetFiles("*.sln", SearchOption.TopDirectoryOnly);

            if (files.Length != 0)
                break;

            current = Path.GetDirectoryName(current);
        }

        return files.FirstOrDefault()?.Name;
    }

    public Metadata? CompletionMetadata { get; private set; }
    readonly MetadataReader _metadataReader = new(new DnlibMetadataProvider());
}