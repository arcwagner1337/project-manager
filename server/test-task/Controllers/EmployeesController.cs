using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using test_task.Data;
using test_task.Models;

namespace test_task.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : Controller
    {
        private readonly UserManager<Employee> _userManager;
        private readonly AppDbContext _context;

        public EmployeesController(UserManager<Employee> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/employees (Get everyone with their roles)
        [HttpGet]
        [Authorize(Roles = "Leader")]
        public async Task<ActionResult> GetEmployees()
        {
            var employees = await _context.Employees.ToListAsync();
            var result = new List<object>();

            foreach (var e in employees)
            {
                var roles = await _userManager.GetRolesAsync(e);
                result.Add(new
                {
                    e.Id,
                    e.FirstName,
                    e.LastName,
                    e.MiddleName,
                    e.Email,
                    Role = roles.FirstOrDefault() ?? "Employee" 
                });
            }

            return Ok(result);
        }

        // GET: api/employees/search?query=asd (AJAX search with roles)
        [HttpGet("search")]
        [Authorize(Roles = "Leader,ProjectManager")]
        public async Task<ActionResult> SearchEmployees([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Поисковый запрос не может быть пустым");
            }

            var lowerQuery = query.ToLower();
            var results = await _context.Employees
                .Where(e => e.FirstName.ToLower().Contains(lowerQuery) ||
                             e.LastName.ToLower().Contains(lowerQuery) ||
                             (e.MiddleName != null && e.MiddleName.ToLower().Contains(lowerQuery)))
                .Take(10)
                .ToListAsync();

            var resultWithRoles = new List<object>();
            foreach (var e in results)
            {
                var roles = await _userManager.GetRolesAsync(e);
                resultWithRoles.Add(new
                {
                    e.Id,
                    e.FirstName,
                    e.LastName,
                    e.MiddleName,
                    e.Email,
                    Role = roles.FirstOrDefault() ?? "Employee"
                });
            }

            return Ok(resultWithRoles);
        }

        // POST: api/employees (Create an employee with a password and role)
        [HttpPost]
        [Authorize(Roles = "Leader")]
        public async Task<ActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            var employee = new Employee
            {
                UserName = dto.Email, 
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                MiddleName = dto.MiddleName,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(employee, dto.Password ?? "password123");

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            await _userManager.AddToRoleAsync(employee, dto.Role);

            return Ok(new { message = "Сотрудник успешно создан", id = employee.Id });
        }

        // PUT: api/employees/{id} (Update data and role)
        [HttpPut("{id}")]
        [Authorize(Roles = "Leader")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
        {
            var employee = await _userManager.FindByIdAsync(id.ToString());
            if (employee == null)
            {
                return NotFound("Сотрудник не найден");
            }

            employee.FirstName = dto.FirstName;
            employee.LastName = dto.LastName;
            employee.MiddleName = dto.MiddleName;
            employee.Email = dto.Email;
            employee.UserName = dto.Email;

            var result = await _userManager.UpdateAsync(employee);
            if (!result.Succeeded) return BadRequest(result.Errors);

            var currentRoles = await _userManager.GetRolesAsync(employee);
            if (!currentRoles.Contains(dto.Role))
            {
                await _userManager.RemoveFromRolesAsync(employee, currentRoles);
                await _userManager.AddToRoleAsync(employee, dto.Role);
            }

            return NoContent();
        }

        // DELETE: api/employees/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Leader")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _userManager.FindByIdAsync(id.ToString());
            if (employee == null) return NotFound("Сотрудник не найден");

            await _userManager.DeleteAsync(employee);
            return Ok(new { message = "Сотрудник успешно удален" });
        }

        [HttpGet("whoami")]
        [Authorize]
        public IActionResult WhoAmI()
        {
            return Ok(new
            {
                Name = User.Identity?.Name,
                IsAuthenticated = User.Identity?.IsAuthenticated,
                Roles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList(),
                AllClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
            });
        }
    }

    
}