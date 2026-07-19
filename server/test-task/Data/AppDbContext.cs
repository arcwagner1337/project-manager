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

        // МАГИЧЕСКАЯ СТРОЧКА: перенаправляет все запросы из контроллеров к Employees во встроенную Users.
        // Это мгновенно починит все ошибки компиляции!
        public DbSet<Employee> Employees => Users;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder); // СТРОГО ПЕРВОЙ СТРОКОЙ!

            // Мапим пользователя Identity в твою таблицу Employees
            modelBuilder.Entity<Employee>().ToTable("Employees");

            // 1. Настраиваем связь Один-ко-Многим (Project -> ProjectManager)
            modelBuilder.Entity<Project>()
                .HasOne(p => p.ProjectManager)
                .WithMany(e => e.ManagedProjects)
                .HasForeignKey(p => p.ProjectManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            // 2. Настраиваем связь Многие-ко-Многим (Projects <-> Employees)
            modelBuilder.Entity<Project>()
                .HasMany(p => p.Employees)
                .WithMany(e => e.Projects)
                .UsingEntity<Dictionary<string, object>>(
                    "ProjectEmployees",
                    j => j.HasOne<Employee>().WithMany().HasForeignKey("EmployeeId"),
                    j => j.HasOne<Project>().WithMany().HasForeignKey("ProjectId")
                );

            // 3. Настраиваем связь Документов с Проектом
            modelBuilder.Entity<ProjectDocument>()
                .HasOne(d => d.Project)
                .WithMany(p => p.Documents)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}