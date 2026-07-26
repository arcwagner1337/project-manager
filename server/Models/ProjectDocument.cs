namespace test_task.Models
{
    public class ProjectDocument
    {

        public int Id { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;

    }
}
