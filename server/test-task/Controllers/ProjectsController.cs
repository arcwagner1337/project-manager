using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using test_task.Data;
using test_task.Models;

namespace test_task.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
    public class ProjectsController : ControllerBase 
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/projects (List of projects with filtering, sorting, and RBAC)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetProjects(
            [FromQuery] DateTime? startDateFrom,
            [FromQuery] DateTime? startDateTo,
            [FromQuery] int? priority,
            [FromQuery] string? sortBy,
            [FromQuery] bool descending = false)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return Unauthorized();

            var query = _context.Projects
                .Include(p => p.ProjectManager)
                .Include(p => p.Employees)
                .AsQueryable();

            // RBAC filter
            if (User.IsInRole("Leader"))
            {   
            }
            else if (User.IsInRole("ProjectManager"))
            {
                query = query.Where(p => p.ProjectManagerId == currentUserId);
            }
            else if (User.IsInRole("Employee"))
            {
                query = query.Where(p => p.Employees.Any(e => e.Id == currentUserId));
            }
            else
            {
                return Forbid(); 
            }

            if (startDateFrom.HasValue) query = query.Where(p => p.StartDate >= startDateFrom.Value);
            if (startDateTo.HasValue)   query = query.Where(p => p.StartDate <= startDateTo.Value);
            if (priority.HasValue)     query = query.Where(p => p.Priority == priority.Value);

            // sort
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                switch (sortBy.ToLower())
                {
                    case "name":
                        query = descending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name);
                        break;
                    case "priority":
                        query = descending ? query.OrderByDescending(p => p.Priority) : query.OrderBy(p => p.Priority);
                        break;
                    case "startdate":
                        query = descending ? query.OrderByDescending(p => p.StartDate) : query.OrderBy(p => p.StartDate);
                        break;
                    case "enddate":
                        query = descending ? query.OrderByDescending(p => p.EndDate) : query.OrderBy(p => p.EndDate);
                        break;
                    default:
                        query = query.OrderBy(p => p.Id);
                        break;
                }
            }

            // DTO mapping
            var projects = await query.Select(p => new ProjectResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                CustomerCompany = p.CustomerCompany,
                ExecutorCompany = p.ExecutorCompany,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Priority = p.Priority,
                ProjectManagerId = p.ProjectManagerId,
                ProjectManagerName = p.ProjectManager != null
                    ? $"{p.ProjectManager.LastName} {p.ProjectManager.FirstName}"
                    : null,
                Employees = p.Employees.Select(e => new EmployeeShortDto
                {
                    Id = e.Id,
                    FullName = $"{e.LastName} {e.FirstName} {e.MiddleName}",
                    Email = e.Email
                }).ToList()
            }).ToListAsync();

            return Ok(projects);
        }

        // POST: api/projects (Creating a project using the wizard)
        [HttpPost]
        [Authorize(Roles = "Leader,ProjectManager")] 
        public async Task<ActionResult> CreateProject([FromBody] CreateProjectDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return Unauthorized();

            if (dto.EndDate < dto.StartDate)
            {
                return BadRequest("Дата окончания не может быть раньше даты начала");
            }

            var project = new Project
            {
                Name = dto.Name,
                CustomerCompany = dto.CustomerCompany,
                ExecutorCompany = dto.ExecutorCompany,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Priority = dto.Priority,
                ProjectManagerId = User.IsInRole("ProjectManager") ? currentUserId : dto.ProjectManagerId
            };

            if (dto.EmployeeIds != null && dto.EmployeeIds.Any())
            {
                var employees = await _context.Employees
                    .Where(e => dto.EmployeeIds.Contains(e.Id))
                    .ToListAsync();
                project.Employees = employees;
            }

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Проект успешно создан", projectId = project.Id });
        }


        // GET: api/projects/{id} (Viewing a single project with access verification)
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectResponseDto>> GetProject(int id)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return Unauthorized();

            var project = await _context.Projects
                .Include(p => p.ProjectManager)
                .Include(p => p.Employees)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound("Проект не найден");

            if (!User.IsInRole("Leader"))
            {
                if (User.IsInRole("ProjectManager") && project.ProjectManagerId != currentUserId)
                {
                    return Forbid(); 
                }
                if (User.IsInRole("Employee") && !project.Employees.Any(e => e.Id == currentUserId))
                {
                    return Forbid(); 
                }
            }

            var dto = new ProjectResponseDto
            {
                Id = project.Id,
                Name = project.Name,
                CustomerCompany = project.CustomerCompany,
                ExecutorCompany = project.ExecutorCompany,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Priority = project.Priority,
                ProjectManagerId = project.ProjectManagerId,
                ProjectManagerName = project.ProjectManager != null
                    ? $"{project.ProjectManager.LastName} {project.ProjectManager.FirstName}"
                    : null,
                Employees = project.Employees.Select(e => new EmployeeShortDto
                {
                    Id = e.Id,
                    FullName = $"{project.ProjectManager?.LastName} {e.FirstName} {e.MiddleName}",
                    Email = e.Email
                }).ToList()
            };

            return Ok(dto);
        }

        // PUT: api/projects/{id} (Edit the entire project)
        [HttpPut("{id}")]
        [Authorize(Roles = "Leader,ProjectManager")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] CreateProjectDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return Unauthorized();

            var project = await _context.Projects
                .Include(p => p.Employees)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound("Проект не найден");
            
            if (User.IsInRole("ProjectManager") && project.ProjectManagerId != currentUserId)
            {
                return Forbid();
            }

            if (dto.EndDate < dto.StartDate) return BadRequest("Дата окончания не может быть раньше даты начала");

            project.Name = dto.Name;
            project.CustomerCompany = dto.CustomerCompany;
            project.ExecutorCompany = dto.ExecutorCompany;
            project.StartDate = dto.StartDate;
            project.EndDate = dto.EndDate;
            project.Priority = dto.Priority;
            
            if (User.IsInRole("Leader"))
            {
                project.ProjectManagerId = dto.ProjectManagerId;
            }

            project.Employees.Clear();
            if (dto.EmployeeIds != null && dto.EmployeeIds.Any())
            {
                var employees = await _context.Employees
                    .Where(e => dto.EmployeeIds.Contains(e.Id))
                    .ToListAsync();
                project.Employees = employees;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/projects/{id} (Delete project)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Leader")] 
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound("Проект не найден");

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Проект успешно удален" });
        }

        // POST: api/projects/{id}/employees/{employeeId} (Add an employee to the project)
        [HttpPost("{id}/employees/{employeeId}")]
        [Authorize(Roles = "Leader,ProjectManager")]
        public async Task<IActionResult> AddEmployeeToProject(int id, int employeeId)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return Unauthorized();

            var project = await _context.Projects.Include(p => p.Employees).FirstOrDefaultAsync(p => p.Id == id);
            if (project == null) return NotFound("Проект не найден");

            if (User.IsInRole("ProjectManager") && project.ProjectManagerId != currentUserId) return Forbid();

            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null) return NotFound("Сотрудник не найден");

            if (project.Employees.Any(e => e.Id == employeeId))
            {
                return BadRequest("Этот сотрудник уже работает на проекте");
            }

            project.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Сотрудник успешно добавлен на проект" });
        }

        // DELETE: api/projects/{id}/employees/{employeeId} (Remove employee from the project)
        [HttpDelete("{id}/employees/{employeeId}")]
        [Authorize(Roles = "Leader,ProjectManager")]
        public async Task<IActionResult> RemoveEmployeeFromProject(int id, int employeeId)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return Unauthorized();

            var project = await _context.Projects.Include(p => p.Employees).FirstOrDefaultAsync(p => p.Id == id);
            if (project == null) return NotFound("Проект не найден");

            if (User.IsInRole("ProjectManager") && project.ProjectManagerId != currentUserId) return Forbid();

            var employee = project.Employees.FirstOrDefault(e => e.Id == employeeId);
            if (employee == null)
            {
                return BadRequest("Этот сотрудник не закреплен за проектом");
            }

            project.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Сотрудник успешно убран с проекта" });
        }
    }
}