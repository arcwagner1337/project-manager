using Microsoft.AspNetCore.Identity;

namespace test_task.Models
{
    public class Employee : IdentityUser<int>
    {
        // Id и Email удалены, они наследуются автоматически!

        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }

        // Удобная фича для фронта, не создающая колонку в БД
        public string FullName => $"{LastName} {FirstName} {MiddleName}".Trim();

        // Навигационное свойство: проекты, где этот челик является ПМ-ом
        public ICollection<Project> ManagedProjects { get; set; } = new List<Project>();

        // Навигационное свойство: проекты, где он просто исполнитель (Many-to-Many)
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
