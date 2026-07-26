using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using test_task.Models;

namespace test_task.Data
{
    public class AppDbContext : IdentityDbContext<Employee, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectDocument> ProjectDocuments { get; set; }

        public DbSet<Employee> Employees => Users;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder); 

            
            modelBuilder.Entity<Employee>().ToTable("Employees");

            // One to Many link Project -> ProjectManager
            modelBuilder.Entity<Project>()
                .HasOne(p => p.ProjectManager)
                .WithMany(e => e.ManagedProjects)
                .HasForeignKey(p => p.ProjectManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            // Many to Many link Projects <-> Employees
            modelBuilder.Entity<Project>()
                .HasMany(p => p.Employees)
                .WithMany(e => e.Projects)
                .UsingEntity<Dictionary<string, object>>(
                    "ProjectEmployees",
                    j => j.HasOne<Employee>().WithMany().HasForeignKey("EmployeeId"),
                    j => j.HasOne<Project>().WithMany().HasForeignKey("ProjectId")
                );

            // docs link
            modelBuilder.Entity<ProjectDocument>()
                .HasOne(d => d.Project)
                .WithMany(p => p.Documents)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}