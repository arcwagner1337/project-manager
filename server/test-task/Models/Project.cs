namespace test_task.Models
{
    public class Project
    {

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string CustomerCompany { get; set; } = null!;
        public string ExecutorCompany { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Priority { get; set; }

        // FK для руководителя
        public int? ProjectManagerId { get; set; }
        // Навигационное свойство для руководителя
        public Employee? ProjectManager { get; set; }

        // Исполнители проекта (Many-to-Many)
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();

        // Документы проекта
        public ICollection<ProjectDocument> Documents { get; set; } = new List<ProjectDocument>();

    }
}
