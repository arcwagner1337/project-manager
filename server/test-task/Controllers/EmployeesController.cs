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
    //[Authorize(Roles = "Leader")]
    public class EmployeesController : Controller
    {
        // Вместо чистого контекста внедряем UserManager для управления учетками и ролями
        private readonly UserManager<Employee> _userManager;
        private readonly AppDbContext _context;

        public EmployeesController(UserManager<Employee> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // 1. GET: api/employees (Получить всех с их ролями)
        [HttpGet]
        [Authorize(Roles = "Leader")]
        public async Task<ActionResult> GetEmployees()
        {
            var employees = await _context.Employees.ToListAsync();
            var result = new List<object>();

            foreach (var e in employees)
            {
                // Достаем роль из Identity для каждого сотрудника
                var roles = await _userManager.GetRolesAsync(e);
                result.Add(new
                {
                    e.Id,
                    e.FirstName,
                    e.LastName,
                    e.MiddleName,
                    e.Email,
                    Role = roles.FirstOrDefault() ?? "Employee" // Если роли нет, пишем дефолтную
                });
            }

            return Ok(result);
        }

        // 2. GET: api/employees/search?query=ива (AJAX поиск с ролями)
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

        // 3. POST: api/employees (Создать сотрудника с паролем и ролью)
        [HttpPost]
        [Authorize(Roles = "Leader")]
        public async Task<ActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            var employee = new Employee
            {
                UserName = dto.Email, // Identity требует UserName, дублируем Email
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                MiddleName = dto.MiddleName,
                EmailConfirmed = true
            };

            // Создаем пользователя через UserManager (он сам захэширует пароль)
            // Если пароль не передан, ставим дефолтный, чтобы карточку можно было создать
            var result = await _userManager.CreateAsync(employee, dto.Password ?? "password123");

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Назначаем роль
            await _userManager.AddToRoleAsync(employee, dto.Role);

            return Ok(new { message = "Сотрудник успешно создан", id = employee.Id });
        }

        // 4. PUT: api/employees/{id} (Обновить данные и роль)
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

            // Обновляем роль: удаляем старые, привязываем новую
            var currentRoles = await _userManager.GetRolesAsync(employee);
            if (!currentRoles.Contains(dto.Role))
            {
                await _userManager.RemoveFromRolesAsync(employee, currentRoles);
                await _userManager.AddToRoleAsync(employee, dto.Role);
            }

            return NoContent();
        }

        // 5. DELETE: api/employees/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Leader")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _userManager.FindByIdAsync(id.ToString());
            if (employee == null) return NotFound("Сотрудник не найден");

            // Перестраховка: каскадом удалятся и связи с ролями
            await _userManager.DeleteAsync(employee);
            return Ok(new { message = "Сотрудник успешно удален" });
        }

        [HttpGet("whoami")]
        [Authorize] // Доступно любому залогиненному
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