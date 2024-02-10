
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

    /// <summary>
    /// 
    /// </summary>
    /// <param name="uri"></param>
    /// <returns>
    ///     <see langword="null"/> when a Solution file could not be found in the parent directories<br/>
    ///     -AND-<br/>
    ///     No project has been successfully evaluated yet -OR- the most recent project did not have a Solution file.<br/>
    ///     <br/>
    ///     Else, an instance of Metadata.<br/>
    ///     If a metadatum is only available when targeting a particular TargetFramework or RuntimeIdentifier, it is included. Duplicate entries are discarded.
    /// </returns>
    /// <exception cref="NullReferenceException">
    ///     Failed to deserialize Solution data file
    /// </exception>
    /// <exception cref="Exception">
    ///     No projects match the given criteria
    ///     -OR-
    ///     Failed to build completion metadata
    /// </exception>
    /// <exception cref="AggregateException"></exception>
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

    // TODO: allow user to prefer Solution selected via other extensions e.g. csdevkit (roslyn language server), OmniSharp/Ionide, or AvaloniaLSP. String-Enum value?
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