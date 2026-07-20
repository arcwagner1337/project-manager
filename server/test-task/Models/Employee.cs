using Microsoft.AspNetCore.Identity;

namespace test_task.Models
{
    public class Employee : IdentityUser<int>
    {

        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }

        public string FullName => $"{LastName} {FirstName} {MiddleName}".Trim();

        public ICollection<Project> ManagedProjects { get; set; } = new List<Project>();

        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
