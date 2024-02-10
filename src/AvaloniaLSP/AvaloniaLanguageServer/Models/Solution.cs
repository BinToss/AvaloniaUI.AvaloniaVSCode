using System.Text.Json.Serialization;
namespace AvaloniaLanguageServer.Models
{
    public partial class SolutionData
    {
        [JsonPropertyName("solution")]
        public string Solution { get; set; } = string.Empty;

        /// <remarks>May include permutations of projects e.g. Name: "ProjectName (TFM)" or "ProjectName (TFM, RID)"</remarks>
        [JsonPropertyName("projects")]
        public Project[] Projects { get; set; } = [];

        [JsonPropertyName("files")]
        public ProjectFile[] Files { get; set; } = [];

        public const string OutputTypeWinExe = "WinExe";

        public Project? GetExecutableProject()
        {
            return Projects.FirstOrDefault(project => project.OutputType == OutputTypeWinExe);
        }
    }

    public partial class ProjectFile
    {
        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        [JsonPropertyName("targetPath")]
        public string TargetPath { get; set; } = string.Empty;

        [JsonPropertyName("projectPath")]
        public string ProjectPath { get; set; } = string.Empty;
    }

    public partial class Project
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        [JsonPropertyName("targetPath")]
        public string TargetPath { get; set; } = string.Empty;

        [JsonPropertyName("outputType")]
        public string OutputType { get; set; } = string.Empty;

        [JsonPropertyName("designerHostPath")]
        public string DesignerHostPath { get; set; } = string.Empty;

        [JsonPropertyName("targetFramework")]
        public string TargetFramework { get; set; } = string.Empty;

        [JsonPropertyName("targetFrameworks")]
        public string[] TargetFrameworks { get; set; } = [];

        [JsonPropertyName("depsFilePath")]
        public string DepsFilePath { get; set; } = string.Empty;

        [JsonPropertyName("runtimeConfigFilePath")]
        public string RuntimeConfigFilePath { get; set; } = string.Empty;

        [JsonPropertyName("projectReferences")]
        public string[] ProjectReferences { get; set; } = [];

        [JsonPropertyName("directoryPath")]
        public string DirectoryPath { get; set; } = string.Empty;

        [JsonPropertyName("intermediateOutputPath")]
        public string IntermediateOutputPath { get; set; } = string.Empty;
    }

}